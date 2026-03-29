import { ensureUserProfile, getAdminDb, verifyIdToken } from "../../../../lib/firebase/admin";
import {
  getFirebaseWebConfig,
  getServiceAccountProjectId,
  isFirebaseAdminConfigured,
} from "../../../../lib/firebase/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return Response.json({ error: "FIREBASE_SERVICE_ACCOUNT_JSON eksik" }, { status: 503 });
  }

  const adminProjectId = getServiceAccountProjectId();
  if (!adminProjectId) {
    return Response.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON gecersiz veya project_id yok" },
      { status: 503 },
    );
  }

  if (!getAdminDb()) {
    return Response.json(
      { error: "Admin SDK baslatilamadi — JSON formatini kontrol et (tek satir, escape)" },
      { status: 503 },
    );
  }

  const webProjectId = getFirebaseWebConfig()?.projectId;
  if (webProjectId && webProjectId !== adminProjectId) {
    console.error("[bootstrap] web vs admin project mismatch", webProjectId, adminProjectId);
    return Response.json(
      {
        error: "Web config projectId ile service account project_id eslesmiyor",
        webProjectId,
        adminProjectId,
      },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return Response.json({ error: "Token gerekli" }, { status: 401 });
  }

  const decoded = await verifyIdToken(token);
  if (!decoded) {
    return Response.json(
      { error: "Gecersiz token — service account bu Auth projesiyle eslesmiyor olabilir" },
      { status: 401 },
    );
  }

  const tokenAud = typeof decoded.aud === "string" ? decoded.aud : null;
  if (tokenAud && tokenAud !== adminProjectId) {
    console.error("[bootstrap] token aud vs admin project", tokenAud, adminProjectId);
    return Response.json(
      {
        error: "ID token projesi (aud) ile service account project_id eslesmiyor",
        tokenAud,
        adminProjectId,
      },
      { status: 400 },
    );
  }

  try {
    await ensureUserProfile(decoded.uid, {
      email: decoded.email ?? null,
      displayName: typeof decoded.name === "string" ? decoded.name : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Firestore yazim hatasi";
    console.error("[bootstrap] ensureUserProfile", e);
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({ ok: true, firestoreProjectId: adminProjectId, uid: decoded.uid });
}
