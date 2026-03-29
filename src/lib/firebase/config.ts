export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

/** Tek satır: Console’daki `firebaseConfig` objesi (service account JSON’u DEĞİL). */
function parseBundledWebConfig(): FirebaseWebConfig | null {
  const raw =
    process.env.FIREBASE_WEB_CONFIG_JSON?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_CONFIG?.trim();
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const apiKey = String(o.apiKey ?? "");
    const authDomain = String(o.authDomain ?? "");
    const projectId = String(o.projectId ?? "");
    const storageBucket = String(o.storageBucket ?? "");
    const messagingSenderId = String(o.messagingSenderId ?? "");
    const appId = String(o.appId ?? "");
    if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
      return null;
    }
    const measurementId = o.measurementId != null ? String(o.measurementId) : undefined;
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      ...(measurementId ? { measurementId } : {}),
    };
  } catch {
    return null;
  }
}

export function getFirebaseWebConfig(): FirebaseWebConfig | null {
  const bundled = parseBundledWebConfig();
  if (bundled) return bundled;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
}

/** Service account JSON içinden (Vercel'de tek satır). parse başarısızsa null. */
export function getServiceAccountProjectId(): string | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { project_id?: string };
    return typeof o.project_id === "string" && o.project_id ? o.project_id : null;
  } catch {
    return null;
  }
}
