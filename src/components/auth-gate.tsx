"use client";

import { Loader2 } from "lucide-react";
import { useRevvy } from "./revvy-provider";
import { RevvyLogo } from "./ui/logo";
import { Button } from "./ui/button";
import { t } from "../lib/i18n";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    lang,
    setLang,
    user,
    authLoading,
    firebaseEnabled,
    firebaseConfigResolving,
    signInWithGoogle,
    signInPending,
    signInErrorKey,
    clearSignInError,
  } = useRevvy();

  if (firebaseConfigResolving) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-blue-950">
        <Loader2 className="h-10 w-10 animate-spin text-[color:var(--brand)]" />
        <p className="text-sm text-[color:var(--muted)]">{t(lang, "config_loading")}</p>
      </div>
    );
  }

  if (!firebaseEnabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center text-blue-950">
        <RevvyLogo />
        <div className="max-w-md space-y-2">
          <h1 className="text-xl font-bold">{t(lang, "firebase_missing_title")}</h1>
          <p className="text-sm text-[color:var(--muted)]">{t(lang, "firebase_missing_body")}</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-blue-950">
        <Loader2 className="h-10 w-10 animate-spin text-[color:var(--brand)]" />
        <p className="text-sm text-[color:var(--muted)]">{t(lang, "auth_checking")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 text-blue-950">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_0%,rgba(27,77,255,0.10),transparent_55%),radial-gradient(900px_600px_at_90%_20%,rgba(0,179,255,0.10),transparent_60%)]" />
        </div>
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-[color:var(--border)] bg-white/90 p-10 shadow-lg shadow-blue-100/50 backdrop-blur">
          <div className="flex flex-col items-center gap-4 text-center">
            <RevvyLogo />
            <h1 className="text-2xl font-bold tracking-tight">{t(lang, "auth_wall_title")}</h1>
            <p className="text-sm leading-relaxed text-[color:var(--muted)]">
              {t(lang, "auth_wall_subtitle")}
            </p>
            <p className="text-xs text-blue-800/80">{t(lang, "auth_wall_hint")}</p>
            {signInErrorKey ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
                {t(lang, signInErrorKey as "auth_storage_error")}
              </p>
            ) : null}
          </div>
          <Button
            className="h-12 w-full text-base"
            disabled={signInPending}
            onClick={() => {
              clearSignInError();
              void signInWithGoogle();
            }}
          >
            {signInPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t(lang, "config_loading")}
              </span>
            ) : (
              t(lang, "google_sign_in")
            )}
          </Button>
          <p className="text-center text-[10px] text-[color:var(--muted)]">{t(lang, "auth_wall_redirect_note")}</p>
          <label className="flex items-center justify-center gap-2 text-xs text-blue-800">
            <span className="text-[color:var(--muted)]">{t(lang, "language")}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as "tr" | "en")}
              className="rounded-lg border border-[color:var(--border)] bg-white px-2 py-1 font-semibold outline-none"
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
            </select>
          </label>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
