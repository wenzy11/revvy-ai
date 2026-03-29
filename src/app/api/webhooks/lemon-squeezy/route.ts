import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, grantCreditsForLemonPaidOrder } from "../../../../lib/firebase/admin";

export const runtime = "nodejs";

/**
 * Lemon Squeezy webhook — signing: https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */

type LemonMeta = { event_name?: string; custom_data?: Record<string, unknown> };

type OrderAttributes = {
  store_id?: number;
  status?: string;
  user_email?: string;
  first_order_item?: { variant_id?: number };
  custom_data?: Record<string, unknown>;
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

function readFirebaseUidFromPayload(body: LemonWebhookBody, attrs: OrderAttributes): string | undefined {
  const metaCustom = body.meta?.custom_data;
  const attrCustom = attrs.custom_data;
  const from = (obj: Record<string, unknown> | undefined) => {
    if (!obj) return undefined;
    const v = obj.firebase_uid ?? obj.firebaseUid;
    return typeof v === "string" ? v : undefined;
  };
  return from(metaCustom as Record<string, unknown> | undefined) ?? from(attrCustom);
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
    const orderId = body.data.id;
    if (!attrs || orderId == null) {
      return Response.json({ ok: true, ignored: "missing_attributes" }, { status: 200 });
    }

    const storeId = attrs.store_id;
    if (expectedStoreId != null && Number.isFinite(expectedStoreId) && storeId !== expectedStoreId) {
      return Response.json({ ok: true, ignored: "store_mismatch" }, { status: 200 });
    }

    if (attrs.status !== "paid") {
      return Response.json({ ok: true, ignored: "not_paid", status: attrs.status }, { status: 200 });
    }

    const variantId = attrs.first_order_item?.variant_id;
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
          orderId,
          variantId,
          hint: "Set LEMON_SQUEEZY_VARIANT_CREDITS e.g. {\"123456\":5,\"789012\":10}",
        }),
      );
      return Response.json({ ok: true, ignored: "unknown_variant", variantId }, { status: 200 });
    }

    const buyerEmail = attrs.user_email?.trim();
    if (!buyerEmail) {
      return Response.json({ ok: true, ignored: "no_email" }, { status: 200 });
    }

    const firebaseUidHint = readFirebaseUidFromPayload(body, attrs);

    const result = await grantCreditsForLemonPaidOrder({
      lemonOrderId: String(orderId),
      credits,
      buyerEmail,
      firebaseUidFromCheckout: firebaseUidHint ?? null,
    });

    if (result === "no_firebase_user") {
      console.warn(
        JSON.stringify({
          source: "lemon-webhook",
          message: "no_firebase_user",
          orderId,
          buyerEmail,
          hint: "Kullanıcı Google ile uygulamaya giriş yapmalı (aynı e-posta).",
        }),
      );
      return Response.json(
        { ok: true, ignored: "no_firebase_user", orderId, credits },
        { status: 200 },
      );
    }

    if (result === "failed") {
      return Response.json({ error: "credit_grant_failed" }, { status: 500 });
    }

    return Response.json(
      {
        ok: true,
        orderId,
        variantId,
        credits,
        grant: result,
      },
      { status: 200 },
    );
  }

  if (eventName === "order_refunded" && body.data?.type === "orders") {
    const orderId = body.data.id;
    const db = getAdminDb();
    if (db && orderId != null) {
      try {
        await db
          .collection("lemon_webhooks")
          .doc(String(orderId))
          .set({ refundedAt: FieldValue.serverTimestamp() }, { merge: true });
      } catch (e) {
        console.warn("lemon refund marker", e);
      }
    }
    return Response.json({ ok: true, noted: "refund_logged" }, { status: 200 });
  }

  return Response.json({ ok: true, ignored: "event_not_handled", eventName }, { status: 200 });
}
