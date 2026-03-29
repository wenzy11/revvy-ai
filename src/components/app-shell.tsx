"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, LogOut, Menu } from "lucide-react";
import { useRevvy } from "./revvy-provider";
import { RevvyLogo } from "./ui/logo";
import { Button } from "./ui/button";
import { t } from "../lib/i18n";

const links = [
  { href: "/", key: "nav_home" as const },
  { href: "/upload", key: "nav_upload" as const },
  { href: "/pricing", key: "nav_pricing" as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    lang,
    setLang,
    credits,
    user,
    signInWithGoogle,
    signOut,
    firebaseEnabled,
    authLoading,
    firebaseConfigResolving,
  } = useRevvy();

  return (
    <div className="min-h-screen bg-white text-blue-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_0%,rgba(27,77,255,0.10),transparent_55%),radial-gradient(900px_600px_at_90%_20%,rgba(0,179,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.95),rgba(255,255,255,1))]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <RevvyLogo />
          </Link>

          <nav className="hidden gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  pathname === link.href
                    ? "bg-blue-600 text-white"
                    : "text-blue-800/80 hover:bg-blue-50 hover:text-blue-950"
                }`}
              >
                {t(lang, link.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <label className="hidden items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs text-blue-800 md:inline-flex">
              <span className="text-[10px] font-semibold text-[color:var(--muted)]">
                {t(lang, "language")}
              </span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "tr" | "en")}
                className="bg-transparent text-xs font-semibold text-blue-900 outline-none"
                aria-label={t(lang, "language")}
              >
                <option value="tr">TR</option>
                <option value="en">EN</option>
              </select>
            </label>
            <div className="hidden items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs text-blue-800 md:inline-flex">
              <Coins className="h-3.5 w-3.5 text-[color:var(--brand)]" />
              {credits} {t(lang, "credits")}
            </div>
            {user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void signOut();
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                {t(lang, "logout")}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={(firebaseEnabled && authLoading) || firebaseConfigResolving}
                onClick={() => {
                  void signInWithGoogle();
                }}
              >
                {firebaseConfigResolving
                  ? t(lang, "config_loading")
                  : firebaseEnabled
                    ? t(lang, "google_sign_in")
                    : t(lang, "demo_login")}
              </Button>
            )}

            <Button className="md:hidden" variant="ghost" size="sm" type="button" aria-label="Menu">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
