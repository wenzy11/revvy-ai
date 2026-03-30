"use client";

import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { runAiPipeline } from "../lib/ai/pipeline";
import { getFirebaseWebConfig, type FirebaseWebConfig } from "../lib/firebase/config";
import {
  getFirebaseAuth,
  getFirebaseDb,
  hasFirebaseClientConfig,
  setFirebaseClientOverride,
} from "../lib/firebase/client";
import type { Lang } from "../lib/i18n";
import type { AppUser, EditSettings, RenderedAsset } from "../lib/types";

const DEFAULT_SETTINGS: EditSettings = {
  promptText:
    "Araci profesyonel otomotiv studyosunda cekilmis gibi duzenle. Arka plan temiz ve premium olsun.",
  photoCount: 1,
  plateOption: "blurred",
  plateText: "",
};

type Draft = {
  sourceUrl?: string;
  fileName?: string;
  settings: EditSettings;
  preview?: RenderedAsset;
  finals?: RenderedAsset[];
};

type RevvyContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  user: AppUser | null;
  credits: number;
  /** Firebase + giriş yapılmadı veya profil yükleniyor */
  authLoading: boolean;
  creditsLoading: boolean;
  firebaseEnabled: boolean;
  /** Build’de env yokken /api/public-config bekleniyor */
  firebaseConfigResolving: boolean;
  draft: Draft;
  processing: boolean;
  signInWithGoogle: () => Promise<void>;
  signInPending: boolean;
  /** Giriş hatası (ör. redirect depolama); i18n anahtarı */
  signInErrorKey: string | null;
  clearSignInError: () => void;
  signOut: () => Promise<void>;
  topUpCredits: (amount: number) => void;
  setUpload: (file: File) => Promise<void>;
  updateSettings: (patch: Partial<EditSettings>) => void;
  generatePreview: () => Promise<void>;
  generateFinal: () => Promise<void>;
  clearDraft: () => void;
};

const RevvyContext = createContext<RevvyContextValue | undefined>(undefined);

const STORAGE_KEY = "revvy-ai-app-state-v4";
const STORAGE_KEY_LEGACY = "revvy-ai-app-state-v3";

function isRedirectStorageError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("missing initial state") ||
    msg.includes("sessionStorage") ||
    msg.includes("storage-partitioned")
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function RevvyProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("tr");
  const [user, setUser] = useState<AppUser | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [signInPending, setSignInPending] = useState(false);
  const [signInErrorKey, setSignInErrorKey] = useState<string | null>(null);

  const clearSignInError = useCallback(() => setSignInErrorKey(null), []);
  /** İlk onAuthStateChanged gelene kadar true — aksi halde config API’den gelirken duvar bir frame görünüp oturumu “yok” sanıyor */
  const [authLoading, setAuthLoading] = useState(true);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    settings: DEFAULT_SETTINGS,
  });
  const [, setConfigTick] = useState(0);
  const [publicConfigTried, setPublicConfigTried] = useState(() =>
    Boolean(getFirebaseWebConfig()),
  );

  const firebaseEnabled = hasFirebaseClientConfig();
  const firebaseConfigResolving = !publicConfigTried;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public-config")
      .then(
        (r) =>
          r.json() as Promise<{
            firebase: FirebaseWebConfig | null;
            adminProjectId?: string | null;
          }>,
      )
      .then((data) => {
        if (cancelled) return;
        if (!getFirebaseWebConfig()) {
          setFirebaseClientOverride(data.firebase ?? null);
        }
        const webPid = data.firebase?.projectId;
        const adminPid = data.adminProjectId ?? null;
        if (webPid && adminPid && webPid !== adminPid) {
          console.error(
            `[Revvy] Proje uyusmazligi: web projectId="${webPid}" / Vercel service account project_id="${adminPid}". Firestore yazilari bootstrap ile bu projede olmaz.`,
          );
        }
        if (webPid && !adminPid) {
          console.warn(
            "[Revvy] Vercel'de FIREBASE_SERVICE_ACCOUNT_JSON yok veya project_id okunamadi — Firestore'a sunucu yazamaz.",
          );
        }
        setConfigTick((n) => n + 1);
      })
      .catch(() => {
        if (cancelled) return;
        setFirebaseClientOverride(null);
        setConfigTick((n) => n + 1);
      })
      .finally(() => {
        if (!cancelled) setPublicConfigTried(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(STORAGE_KEY_LEGACY) ??
      window.localStorage.getItem("revvy-ai-app-state-v2");
    if (!raw) {
      const browserLang = (navigator.language || "").toLowerCase();
      if (browserLang.startsWith("tr")) setLang("tr");
      else setLang("en");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        lang?: Lang;
        user?: AppUser | null;
        credits?: number;
      };
      if (parsed.lang === "tr" || parsed.lang === "en") setLang(parsed.lang);
      if (!firebaseEnabled) {
        if (parsed.user !== undefined) setUser(parsed.user);
        const c = parsed.credits;
        setCredits(typeof c === "number" && Number.isFinite(c) && c >= 0 ? c : 1);
      }
    } catch {
      // ignore
    }
  }, [firebaseEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (firebaseEnabled) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang }));
      } else {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ lang, user, credits }),
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "QuotaExceededError") {
        try {
          window.localStorage.removeItem("revvy-ai-app-state-v1");
          window.localStorage.removeItem(STORAGE_KEY_LEGACY);
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(firebaseEnabled ? { lang } : { lang, user, credits }),
          );
        } catch {
          // give up
        }
      }
    }
  }, [credits, firebaseEnabled, lang, user]);

  useEffect(() => {
    if (!firebaseEnabled) {
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) {
      setAuthLoading(false);
      return;
    }

    let unsubDoc: (() => void) | undefined;
    let unsubAuth: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        await getRedirectResult(auth);
        await auth.authStateReady();
      } catch (err) {
        console.error("getRedirectResult", err);
        if (!cancelled && isRedirectStorageError(err)) {
          setSignInErrorKey("auth_storage_error");
        }
      }
      if (cancelled) return;

      unsubAuth = onAuthStateChanged(auth, (fbUser) => {
        unsubDoc?.();
        unsubDoc = undefined;

        if (!fbUser) {
          setUser(null);
          setCredits(0);
          setCreditsLoading(false);
          setAuthLoading(false);
          return;
        }

        setCreditsLoading(true);
        setUser({
          email: fbUser.email ?? "",
          uid: fbUser.uid,
          name: fbUser.displayName ?? undefined,
          photoURL: fbUser.photoURL ?? undefined,
        });
        setAuthLoading(false);

        void (async () => {
          try {
            const token = await fbUser.getIdToken();
            const res = await fetch("/api/auth/bootstrap", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              signal:
                typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
                  ? AbortSignal.timeout(15_000)
                  : undefined,
            });
            const body = await res.text();
            if (!res.ok) {
              console.error("[Revvy bootstrap]", res.status, body);
            }
          } catch (e) {
            console.error("[Revvy bootstrap] ag hatasi", e);
          }
        })();

        const ref = doc(db, "users", fbUser.uid);
        unsubDoc = onSnapshot(
          ref,
          (snap) => {
            const c = snap.data()?.credits;
            setCredits(typeof c === "number" ? c : 0);
            setCreditsLoading(false);
          },
          () => {
            setCredits(0);
            setCreditsLoading(false);
          },
        );
      });
    })();

    return () => {
      cancelled = true;
      unsubAuth?.();
      unsubDoc?.();
    };
  }, [firebaseEnabled]);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    setSignInErrorKey(null);
    setSignInPending(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({ prompt: "select_account" });

      try {
        await signInWithPopup(auth, provider);
        setSignInPending(false);
        return;
      } catch (popupErr) {
        console.warn("signInWithPopup failed, trying redirect", popupErr);
      }

      await signInWithRedirect(auth, provider);
    } catch (e) {
      console.error("signInWithGoogle", e);
      if (isRedirectStorageError(e)) {
        setSignInErrorKey("auth_storage_error");
      }
      setSignInPending(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    if (firebaseEnabled) {
      setCredits(0);
    } else {
      setCredits(1);
    }
  }, [firebaseEnabled]);

  const topUpCredits = useCallback(
    (amount: number) => {
      if (firebaseEnabled) return;
      setCredits((prev) => prev + amount);
    },
    [firebaseEnabled],
  );

  const setUpload = useCallback(async (file: File) => {
    const sourceUrl = await fileToDataUrl(file);
    setDraft((prev) => ({
      ...prev,
      sourceUrl,
      fileName: file.name,
      preview: undefined,
      finals: undefined,
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<EditSettings>) => {
    setDraft((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const generatePreview = useCallback(async () => {
    if (!draft.sourceUrl) return;
    const auth = getFirebaseAuth();
    const idToken =
      firebaseEnabled && auth?.currentUser
        ? await auth.currentUser.getIdToken()
        : undefined;
    setProcessing(true);
    try {
      const preview = await runAiPipeline({
        imageUrl: draft.sourceUrl,
        // Preview, kredi harcamadan 1 görsel üretir.
        settings: { ...draft.settings, photoCount: 1 },
        stage: "preview",
        idToken,
      });
      const firstUrl = preview.urls?.[0];
      if (!firstUrl) return;
      setDraft((prev) => ({
        ...prev,
        preview: {
          url: firstUrl,
          stage: "preview",
          watermark: preview.watermark,
          generatedAt: preview.generatedAt,
        },
      }));
    } finally {
      setProcessing(false);
    }
  }, [draft.settings, draft.sourceUrl, firebaseEnabled]);

  const generateFinal = useCallback(async () => {
    const photoCount = Math.max(1, Math.floor(draft.settings.photoCount ?? 1));
    if (!draft.sourceUrl || credits < photoCount) return;
    if (firebaseEnabled) {
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) return;
    }

    setProcessing(true);
    setDraft((prev) => ({ ...prev, preview: undefined, finals: undefined }));

    try {
      const auth = getFirebaseAuth();
      const idToken =
        firebaseEnabled && auth?.currentUser
          ? await auth.currentUser.getIdToken()
          : undefined;

      const final = await runAiPipeline({
        imageUrl: draft.sourceUrl,
        settings: draft.settings,
        stage: "final",
        idToken,
      });

      if (typeof final.creditsRemaining === "number") {
        setCredits(final.creditsRemaining);
      } else if (!firebaseEnabled) {
        setCredits((prev) => prev - photoCount);
      }

      const urls = final.urls ?? [];
      setDraft((prev) => ({
        ...prev,
        finals: urls.map((url) => ({
          url,
          stage: "final",
          watermark: false,
          generatedAt: final.generatedAt,
        })),
      }));
    } finally {
      setProcessing(false);
    }
  }, [credits, draft.settings, draft.sourceUrl, firebaseEnabled]);

  const clearDraft = useCallback(() => {
    setDraft({ settings: DEFAULT_SETTINGS });
  }, []);

  const value = useMemo<RevvyContextValue>(
    () => ({
      lang,
      setLang,
      user,
      credits,
      authLoading,
      creditsLoading,
      firebaseEnabled,
      firebaseConfigResolving,
      draft,
      processing,
      signInWithGoogle,
      signInPending,
      signInErrorKey,
      clearSignInError,
      signOut,
      topUpCredits,
      setUpload,
      updateSettings,
      generatePreview,
      generateFinal,
      clearDraft,
    }),
    [
      lang,
      setLang,
      user,
      credits,
      authLoading,
      creditsLoading,
      firebaseEnabled,
      firebaseConfigResolving,
      draft,
      processing,
      signInWithGoogle,
      signInPending,
      signInErrorKey,
      clearSignInError,
      signOut,
      topUpCredits,
      setUpload,
      updateSettings,
      generatePreview,
      generateFinal,
      clearDraft,
    ],
  );

  return <RevvyContext.Provider value={value}>{children}</RevvyContext.Provider>;
}

export function useRevvy() {
  const context = useContext(RevvyContext);
  if (!context) {
    throw new Error("useRevvy must be used within RevvyProvider");
  }
  return context;
}
