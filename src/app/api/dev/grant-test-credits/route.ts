import { addCredits, verifyIdToken } from "../../../../lib/firebase/admin";

export const runtime = "nodejs";

/**
 * Sadece DEMO_GRANT_CREDITS_SECRET tanımlıyken açılır. Production’da kullanma veya güçlü secret koy.
 * Tarayıcıdan çağırma (secret sızmaz); curl / Postman ile Bearer + header kullan.
 *
 * curl -X POST https://.../api/dev/grant-test-credits \
 *   -H "Authorization: Bearer <ID_TOKEN>" \
 *   -H "x-revvy-demo-secret: $DEMO_GRANT_CREDITS_SECRET" \
 *   -H "content-type: application/json" \
 *   -d '{"amount":5}'
 */
export async function POST(req: Request) {
  const expected = process.env.DEMO_GRANT_CREDITS_SECRET?.trim();
  if (!expected) {
    return Response.json({ error: "not_enabled" }, { status: 404 });
  }

  const got = req.headers.get("x-revvy-demo-secret")?.trim();
  if (got !== expected) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) {
    return Response.json({ error: "token_gerekli" }, { status: 401 });
  }

  const decoded = await verifyIdToken(token);
  if (!decoded) {
    return Response.json({ error: "gecersiz_token" }, { status: 401 });
  }

  let body: { amount?: number };
  try {
    body = (await req.json()) as { amount?: number };
  } catch {
    return Response.json({ error: "json" }, { status: 400 });
  }

  const amount = Math.min(100, Math.max(1, Math.floor(Number(body.amount) || 0)));
  if (amount < 1) {
    return Response.json({ error: "amount" }, { status: 400 });
  }

  const ok = await addCredits(decoded.uid, amount);
  if (!ok) {
    return Response.json({ error: "firestore" }, { status: 500 });
  }

  return Response.json({ ok: true, amount, uid: decoded.uid });
}
