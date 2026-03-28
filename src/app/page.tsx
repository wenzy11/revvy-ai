"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ImageUp, Shield, Sparkles } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { t } from "../lib/i18n";
import { useRevvy } from "../components/revvy-provider";

const showcaseExamples = [
  {
    title: "Ornek #1 - Sedan",
    imageUrl:
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ornek #2 - SUV",
    imageUrl:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ornek #3 - Hatchback",
    imageUrl:
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ornek #4 - Coupe",
    imageUrl:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ornek #5 - Pickup",
    imageUrl:
      "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ornek #6 - Performance",
    imageUrl:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function Home() {
  const { lang } = useRevvy();
  return (
    <AppShell>
      <section className="grid items-center gap-10 py-12 md:grid-cols-[1.2fr_0.95fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm text-blue-700">
            <Sparkles className="h-4 w-4" />
            {t(lang, "home_badge")}
          </span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-blue-950 md:text-6xl">
            {t(lang, "home_h1")}
          </h1>
          <p className="max-w-xl text-lg text-blue-800/80">
            {t(lang, "home_p")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500"
            >
              {t(lang, "home_start")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-blue-200 px-4 py-2 text-blue-700 transition hover:bg-blue-50 hover:text-blue-900"
            >
              {t(lang, "home_view_plans")}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xl shadow-blue-100">
          <div className="flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-6 py-10 text-center">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <ImageUp className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-semibold text-blue-950">Araba Fotografi Yukle</p>
              <p className="mt-1 text-sm text-blue-700/80">JPG, PNG - Maksimum 20MB</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-white px-4 py-3">
              <span className="flex items-center gap-3 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Arka Plani Studyo Yap
              </span>
              <div className="h-4 w-4 rounded border border-blue-500 bg-blue-500" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-white px-4 py-3">
              <span className="flex items-center gap-3 text-sm font-medium">
                <Shield className="h-4 w-4 text-blue-600" />
                Plakayi Gizle
              </span>
              <div className="h-4 w-4 rounded border border-blue-300" />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-6">
        <h2 className="mb-4 text-2xl font-semibold text-blue-950">{t(lang, "examples_title")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {showcaseExamples.map((item) => (
            <article key={item.title} className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-blue-700">{item.title}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div
                  className="relative h-48 overflow-hidden rounded-xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${item.imageUrl}')`,
                    filter:
                      "saturate(0.42) contrast(0.76) brightness(0.74) blur(0.8px)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-80 mix-blend-multiply"
                    style={{
                      background:
                        "radial-gradient(70px 50px at 15% 60%, rgba(0,0,0,0.55), transparent 72%), radial-gradient(120px 80px at 78% 35%, rgba(0,0,0,0.46), transparent 76%), linear-gradient(130deg, rgba(15,23,42,0.5), rgba(15,23,42,0.2))",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-45"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(15,23,42,0.16), rgba(15,23,42,0.16) 1px, transparent 1px, transparent 3px)",
                    }}
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-blue-950/80 px-2 py-1 text-[10px] font-semibold text-blue-50">
                    {t(lang, "before_bad")}
                  </div>
                </div>

                <div
                  className="relative h-48 overflow-hidden rounded-xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${item.imageUrl}')`,
                    filter: "saturate(1.15) contrast(1.08) brightness(1.05)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-28"
                    style={{
                      background:
                        "radial-gradient(140px 90px at 32% 22%, rgba(255,255,255,0.62), transparent 68%), radial-gradient(160px 110px at 82% 70%, rgba(255,255,255,0.36), transparent 74%)",
                    }}
                  />
                  <div className="absolute bottom-2 right-2 rounded bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                    {t(lang, "after_pro")}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-blue-100 pt-6">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Revvy AI
        </div>
      </footer>
    </AppShell>
  );
}
