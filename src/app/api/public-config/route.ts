import { getFirebaseWebConfig, getServiceAccountProjectId } from "../../../lib/firebase/config";

export const runtime = "nodejs";

/**
 * Sunucuda (runtime) Firebase web config okunur — Vercel'de client bundle'a
 * build sırasında girmeyen NEXT_PUBLIC_* değerleri burada yine de vardır.
 * adminProjectId: web projectId ile aynı olmalı (Firestore yazıları için).
 */
export async function GET() {
  const firebase = getFirebaseWebConfig();
  const adminProjectId = getServiceAccountProjectId();
  return Response.json({ firebase, adminProjectId });
}
