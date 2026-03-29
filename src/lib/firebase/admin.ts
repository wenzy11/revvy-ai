import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

let adminApp: App | null | undefined;

function getAdminApp(): App | null {
  if (adminApp !== undefined) return adminApp;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    adminApp = null;
    return null;
  }
  try {
    const cred = JSON.parse(raw) as ServiceAccount;
    adminApp =
      getApps().length > 0
        ? getApps()[0]!
        : initializeApp({
            credential: cert(cred),
          });
    return adminApp;
  } catch {
    adminApp = null;
    return null;
  }
}

export function getAdminAuth() {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminDb() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth();
  if (!auth) return null;
  try {
    return await auth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}

export async function getCredits(uid: string): Promise<number> {
  const db = getAdminDb();
  if (!db) return 0;
  const snap = await db.collection("users").doc(uid).get();
  const c = snap.data()?.credits;
  return typeof c === "number" ? c : 0;
}

type EnsureProfileOpts = {
  email: string | null;
  displayName?: string | null;
};

/** İlk girişte users/{uid} yoksa credits:1 ile oluşturur; varsa email/displayName/lastLoginAt güncellenir. */
export async function ensureUserProfile(uid: string, opts: EnsureProfileOpts) {
  const db = getAdminDb();
  if (!db) return;
  const ref = db.collection("users").doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      tx.set(ref, {
        email: opts.email ?? null,
        displayName: opts.displayName ?? null,
        credits: 1,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      });
      return;
    }
    const data = snap.data() as { email?: string | null; displayName?: string | null } | undefined;
    const patch: Record<string, unknown> = {
      email: opts.email ?? data?.email ?? null,
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (opts.displayName != null && opts.displayName !== "") {
      patch.displayName = opts.displayName;
    }
    tx.update(ref, patch);
  });
}

export async function consumeCredit(uid: string): Promise<{ ok: true; credits: number } | { ok: false }> {
  const db = getAdminDb();
  if (!db) return { ok: false };
  const ref = db.collection("users").doc(uid);
  try {
    const newCredits = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() as { credits?: number } | undefined;
      const current = typeof data?.credits === "number" ? data.credits : 0;
      if (current < 1) return null;
      const next = current - 1;
      tx.update(ref, { credits: next, updatedAt: FieldValue.serverTimestamp() });
      return next;
    });
    if (newCredits === null) return { ok: false };
    return { ok: true, credits: newCredits };
  } catch {
    return { ok: false };
  }
}

export async function addCredits(uid: string, amount: number): Promise<boolean> {
  if (amount < 1) return false;
  const db = getAdminDb();
  if (!db) return false;
  const ref = db.collection("users").doc(uid);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() as { credits?: number } | undefined;
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
    return true;
  } catch {
    return false;
  }
}
