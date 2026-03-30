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
    const cred = JSON.parse(raw) as ServiceAccount & { project_id?: string };
    const projectId =
      typeof cred.project_id === "string" && cred.project_id ? cred.project_id : undefined;
    adminApp =
      getApps().length > 0
        ? getApps()[0]!
        : initializeApp({
            credential: cert(cred),
            ...(projectId ? { projectId } : {}),
          });
    return adminApp;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getAdminApp] FIREBASE_SERVICE_ACCOUNT_JSON parse/init:", e);
    }
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[verifyIdToken]", msg);
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

export async function consumeCredits(
  uid: string,
  amount: number,
): Promise<{ ok: true; credits: number } | { ok: false }> {
  const db = getAdminDb();
  if (!db) return { ok: false };
  const ref = db.collection("users").doc(uid);
  const a = Math.floor(amount);
  if (!Number.isFinite(a) || a < 1) return { ok: false };

  try {
    const newCredits = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() as { credits?: number } | undefined;
      const current = typeof data?.credits === "number" ? data.credits : 0;
      if (current < a) return null;
      const next = current - a;
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

function isAlreadyExistsError(e: unknown): boolean {
  const err = e as { code?: number; message?: string };
  return err.code === 6 || Boolean(err.message?.includes("ALREADY_EXISTS"));
}

export type LemonGrantResult = "granted" | "duplicate" | "no_firebase_user" | "failed";

/**
 * Ödeme sonrası kredi yazar; aynı Lemon order id ile tekrar çağrılırsa duplicate döner.
 * Önce checkout[custom][firebase_uid] (e-posta eşleşiyorsa), yoksa buyer e-posta ile Firebase kullanıcısı aranır.
 */
export async function grantCreditsForLemonPaidOrder(opts: {
  lemonOrderId: string;
  credits: number;
  buyerEmail: string;
  firebaseUidFromCheckout?: string | null;
}): Promise<LemonGrantResult> {
  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) return "failed";

  const emailNorm = opts.buyerEmail.trim().toLowerCase();
  if (!emailNorm || !opts.lemonOrderId || opts.credits < 1) return "failed";

  const processedRef = db.collection("lemon_webhooks").doc(opts.lemonOrderId);

  let uid: string | undefined;
  const hint = opts.firebaseUidFromCheckout?.trim();
  if (hint && /^[a-zA-Z0-9_-]{10,128}$/.test(hint)) {
    try {
      const u = await auth.getUser(hint);
      if (u.email?.toLowerCase() === emailNorm) uid = u.uid;
    } catch {
      // e-posta ile devam
    }
  }
  if (!uid) {
    try {
      const u = await auth.getUserByEmail(emailNorm);
      uid = u.uid;
    } catch {
      return "no_firebase_user";
    }
  }

  try {
    await processedRef.create({
      buyerEmail: emailNorm,
      creditsPending: opts.credits,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    if (isAlreadyExistsError(e)) return "duplicate";
    return "failed";
  }

  try {
    const ok = await addCredits(uid, opts.credits);
    if (!ok) throw new Error("addCredits failed");
    await processedRef.set(
      {
        uid,
        grantedCredits: opts.credits,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return "granted";
  } catch (e) {
    console.error("[grantCreditsForLemonPaidOrder]", e);
    try {
      await processedRef.delete();
    } catch {
      // ignore
    }
    return "failed";
  }
}
