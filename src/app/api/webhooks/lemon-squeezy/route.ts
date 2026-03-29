import crypto from "node:crypto";

export const runtime = "nodejs";

/**
 * Lemon Squeezy webhook — signing: https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 * Payload examples: https://docs.lemonsqueezy.com/help/webhooks/example-payloads
 */

type LemonMeta = { event_name?: string };

type OrderAttributes = {
  store_id?: number;
  status?: string;
  first_order_item?: { variant_id?: number };
};

type LemonWebhookBody = {
  meta?: LemonMeta;
  data?: {
    type?: string;
    id?: string;
    attributes?: OrderAttributes;
  };
};

function verifySignature(rawBody: string, secret: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digestHex = hmac.update(rawBody).digest("hex");
  const digest = Buffer.from(digestHex, "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(digest, signature);
}

function parseVariantCredits(): Map<number, number> {
  const raw = process.env.LEMON_SQUEEZY_VARIANT_CREDITS;
  const map = new Map<number, number>();
  if (!raw?.trim()) return map;
  try {
    const obj = JSON.parse(raw) as Record<string, number>;
    for (const [k, v] of Object.entries(obj)) {
      const id = Number(k);
      const credits = Number(v);
      if (Number.isFinite(id) && Number.isFinite(credits) && credits > 0) {
        map.set(id, credits);
      }
    }
  } catch {
    // invalid JSON — leave map empty
  }
  return map;
}

export async function POST(req: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "LEMON_SQUEEZY_WEBHOOK_SECRET tanımlı değil" }, { status: 500 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get("X-Signature");

  if (!verifySignature(rawBody, secret, sig)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: LemonWebhookBody;
  try {
    body = JSON.parse(rawBody) as LemonWebhookBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = body.meta?.event_name;
  const storeIdEnv = process.env.LEMON_SQUEEZY_STORE_ID;
  const expectedStoreId = storeIdEnv ? Number(storeIdEnv) : null;

  if (eventName === "order_created" && body.data?.type === "orders") {
    const attrs = body.data.attributes;
    const storeId = attrs?.store_id;
    if (expectedStoreId != null && Number.isFinite(expectedStoreId) && storeId !== expectedStoreId) {
      return Response.json({ ok: true, ignored: "store_mismatch" }, { status: 200 });
    }

    if (attrs?.status !== "paid") {
      return Response.json({ ok: true, ignored: "not_paid", status: attrs?.status }, { status: 200 });
    }

    const variantId = attrs?.first_order_item?.variant_id;
    if (variantId == null || !Number.isFinite(variantId)) {
      return Response.json({ ok: true, ignored: "no_variant" }, { status: 200 });
    }

    const variantCredits = parseVariantCredits();
    const credits = variantCredits.get(variantId);

    if (credits == null) {
      console.warn(
        JSON.stringify({
          source: "lemon-webhook",
          message: "unknown_variant",
          orderId: body.data.id,
          variantId,
          hint: "Set LEMON_SQUEEZY_VARIANT_CREDITS e.g. {\"123456\":5,\"789012\":10}",
        }),
      );
      return Response.json({ ok: true, ignored: "unknown_variant", variantId }, { status: 200 });
    }

    // TODO: persist credits (DB) keyed by custom data / customer email — şimdilik log
    console.info(
      JSON.stringify({
        source: "lemon-webhook",
        event: "order_created",
        orderId: body.data.id,
        variantId,
        credits,
        note: "grant_credits_pending_db",
      }),
    );

    return Response.json({ ok: true, orderId: body.data.id, variantId, credits }, { status: 200 });
  }

  if (eventName === "order_refunded" && body.data?.type === "orders") {
    console.info(
      JSON.stringify({
        source: "lemon-webhook",
        event: "order_refunded",
        orderId: body.data.id,
        note: "handle_refund_pending",
      }),
    );
    return Response.json({ ok: true, ignored: "refund_logged" }, { status: 200 });
  }

  return Response.json({ ok: true, ignored: "event_not_handled", eventName }, { status: 200 });
}
