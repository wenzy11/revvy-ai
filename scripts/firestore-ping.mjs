/**
 * Firestore baglanti testi — .env.local icinde FIREBASE_SERVICE_ACCOUNT_JSON gerekli.
 * Calistir: npm run firestore:ping
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
if (!raw) {
  console.error(
    "\n❌ FIREBASE_SERVICE_ACCOUNT_JSON yok.\n" +
      "   Firebase Console → Project settings → Service accounts → Generate new private key\n" +
      "   JSON’u tek satir yapip .env.local’e ekle.\n",
  );
  process.exit(1);
}

let cred;
try {
  cred = JSON.parse(raw);
} catch {
  console.error("\n❌ FIREBASE_SERVICE_ACCOUNT_JSON gecerli JSON degil.\n");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(cred) });
}

const db = getFirestore();
const snap = await db.collection("users").limit(3).get();

console.log("\n✅ Firestore baglantisi OK (proje:", cred.project_id ?? "?", ")");
console.log("   `users` koleksiyonundan ornek:", snap.size, "dokuman listelendi.\n");
snap.forEach((d) => {
  console.log("   -", d.id, JSON.stringify(d.data()));
});
