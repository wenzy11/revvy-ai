import { getFirebaseWebConfig } from "../../../lib/firebase/config";

export const runtime = "nodejs";

/**
 * Sunucuda (runtime) Firebase web config okunur — Vercel'de client bundle'a
 * build sırasında girmeyen NEXT_PUBLIC_* değerleri burada yine de vardır.
 */
export async function GET() {
  const firebase = getFirebaseWebConfig();
  return Response.json({ firebase });
}
