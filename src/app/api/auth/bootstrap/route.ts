import { ensureUserProfile, verifyIdToken } from "../../../../lib/firebase/admin";
import { isFirebaseAdminConfigured } from "../../../../lib/firebase/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return Response.json({ error: "FIREBASE_SERVICE_ACCOUNT_JSON eksik" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return Response.json({ error: "Token gerekli" }, { status: 401 });
  }

  const decoded = await verifyIdToken(token);
  if (!decoded) {
    return Response.json({ error: "Gecersiz token" }, { status: 401 });
  }

  await ensureUserProfile(decoded.uid, decoded.email ?? null);
  return Response.json({ ok: true });
}
