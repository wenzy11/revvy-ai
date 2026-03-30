/**
 * Firestore'da kullanıcıya test kredisi ekler (Lemon olmadan).
 * Kullanım: npm run grant-credits -- <firebase_uid> <miktar>
 * Örnek: npm run grant-credits -- abcXYZ123 10
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
if (!raw) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON yok (.env.local)");
  process.exit(1);
}

const uid = process.argv[2];
const amount = Number(process.argv[3]);
if (!uid || !Number.isFinite(amount) || amount < 1 || amount > 500) {
  console.error("Kullanım: npm run grant-credits -- <firebase_uid> <miktar>  (1–500)");
  process.exit(1);
}

let cred;
try {
  cred = JSON.parse(raw);
} catch {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON geçersiz JSON");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(cred),
    ...(cred.project_id ? { projectId: cred.project_id } : {}),
  });
}

const db = getFirestore();
const ref = db.collection("users").doc(uid);

await db.runTransaction(async (tx) => {
  const snap = await tx.get(ref);
  const data = snap.data();
  const current = typeof data?.credits === "number" ? data.credits : 0;
  tx.set(
    ref,
    {
      credits: current + amount,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
});

console.log(`OK: users/${uid} krediye +${amount} eklendi (yaklaşık toplam okumak için Console'a bak).`);
