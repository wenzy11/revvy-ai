"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
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
import { getFirebaseWebConfig } from "../lib/firebase/config";
import { getFirebaseAuth, getFirebaseDb } from "../lib/firebase/client";
import type { Lang } from "../lib/i18n";
import type { AppUser, EditSettings, RenderedAsset } from "../lib/types";

const DEFAULT_SETTINGS: EditSettings = {
  promptText:
    "Araci profesyonel otomotiv studyosunda cekilmis gibi duzenle. Arka plan temiz ve premium olsun.",
};

type Draft = {
  sourceUrl?: string;
  fileName?: string;
  settings: EditSettings;
  preview?: RenderedAsset;
  final?: RenderedAsset;
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
  draft: Draft;
  processing: boolean;
  signInWithGoogle: () => Promise<void>;
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
  const [credits, setCredits] = useState<number>(1);
  const [processing, setProcessing] = useState(false);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getFirebaseWebConfig()));
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    settings: DEFAULT_SETTINGS,
  });

  const firebaseEnabled = Boolean(getFirebaseWebConfig());

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
      if (!firebaseEnabled && parsed.user !== undefined) setUser(parsed.user);
      if (!firebaseEnabled) {
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

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) {
      setAuthLoading(false);
      return;
    }

    let unsubDoc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
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

      try {
        const token = await fbUser.getIdToken();
        await fetch("/api/auth/bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // bootstrap 503 olabilir — Firestore yine dinlenir
      }

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

      setAuthLoading(false);
    });

    return () => {
      unsubAuth();
      unsubDoc?.();
    };
  }, [firebaseEnabled]);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser({ email: "demo@revvy.ai" });
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
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
      final: undefined,
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
    setProcessing(true);
    try {
      const preview = await runAiPipeline({
        imageUrl: draft.sourceUrl,
        settings: draft.settings,
        stage: "preview",
      });
      setDraft((prev) => ({ ...prev, preview }));
    } finally {
      setProcessing(false);
    }
  }, [draft.settings, draft.sourceUrl]);

  const generateFinal = useCallback(async () => {
    if (!draft.sourceUrl || credits < 1) return;
    if (firebaseEnabled) {
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) return;
    }

    setProcessing(true);
    setDraft((prev) => ({ ...prev, preview: undefined, final: undefined }));

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
        setCredits((prev) => prev - 1);
      }

      setDraft((prev) => ({ ...prev, final }));
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
      draft,
      processing,
      signInWithGoogle,
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
      draft,
      processing,
      signInWithGoogle,
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
