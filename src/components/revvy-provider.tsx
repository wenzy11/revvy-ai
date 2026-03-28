"use client";

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
  draft: Draft;
  processing: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
  topUpCredits: (amount: number) => void;
  setUpload: (file: File) => Promise<void>;
  updateSettings: (patch: Partial<EditSettings>) => void;
  generatePreview: () => Promise<void>;
  generateFinal: () => Promise<void>;
  clearDraft: () => void;
};

const RevvyContext = createContext<RevvyContextValue | undefined>(undefined);

// NOTE: localStorage quota is small; never persist base64 images/projects here.
const STORAGE_KEY = "revvy-ai-app-state-v3";
const STORAGE_KEY_LEGACY = "revvy-ai-app-state-v2";

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
  const [draft, setDraft] = useState<Draft>({
    settings: DEFAULT_SETTINGS,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(STORAGE_KEY_LEGACY);
    if (!raw) {
      const browserLang = (navigator.language || "").toLowerCase();
      if (browserLang.startsWith("tr")) setLang("tr");
      else setLang("en");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        lang?: Lang;
        user: AppUser | null;
        credits?: number;
      };
      if (parsed.lang === "tr" || parsed.lang === "en") setLang(parsed.lang);
      setUser(parsed.user);
      const c = parsed.credits;
      setCredits(typeof c === "number" && Number.isFinite(c) && c >= 0 ? c : 1);
    } catch {
      // Ignore invalid persisted payload.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang, user, credits }));
    } catch (err) {
      // If quota is exceeded (likely due to old v1 payload), clear and retry once.
      if (err instanceof DOMException && err.name === "QuotaExceededError") {
        try {
          window.localStorage.removeItem("revvy-ai-app-state-v1");
          window.localStorage.removeItem(STORAGE_KEY);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang, user, credits }));
        } catch {
          // Give up silently; app should still function in-memory.
        }
      }
    }
  }, [credits, lang, user]);

  const signIn = useCallback((email: string) => {
    setUser({ email });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const topUpCredits = useCallback((amount: number) => {
    setCredits((prev) => prev + amount);
  }, []);

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
    setProcessing(true);
    // New render should not stack over previous result.
    setDraft((prev) => ({ ...prev, preview: undefined, final: undefined }));
    try {
      const final = await runAiPipeline({
        imageUrl: draft.sourceUrl,
        settings: draft.settings,
        stage: "final",
      });

      setCredits((prev) => prev - 1);
      setDraft((prev) => ({ ...prev, final }));
    } finally {
      setProcessing(false);
    }
  }, [credits, draft.settings, draft.sourceUrl]);

  const clearDraft = useCallback(() => {
    setDraft({ settings: DEFAULT_SETTINGS });
  }, []);

  const value = useMemo<RevvyContextValue>(
    () => ({
      lang,
      setLang,
      user,
      credits,
      draft,
      processing,
      signIn,
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
      draft,
      processing,
      signIn,
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
