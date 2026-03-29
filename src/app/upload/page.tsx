"use client";

import Image from "next/image";
import { Download, ImageUp, Loader2, Sparkles } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { useRevvy } from "../../components/revvy-provider";
import { Button } from "../../components/ui/button";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { t } from "../../lib/i18n";

export default function UploadPage() {
  const {
    lang,
    credits,
    draft,
    processing,
    setUpload,
    updateSettings,
    generateFinal,
    authLoading,
    creditsLoading,
  } = useRevvy();

  const creditsBlocked = authLoading || creditsLoading;
  const canGenerate =
    draft.sourceUrl && !processing && credits >= 1 && !creditsBlocked;

  return (
    <AppShell>
      <section className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader
            title={t(lang, "upload_title")}
            subtitle={t(lang, "upload_subtitle")}
          />
          <CardBody className="space-y-4">
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-200 bg-[linear-gradient(180deg,rgba(27,77,255,0.06),rgba(0,179,255,0.03))] px-6 py-12 text-center transition hover:border-blue-300">
              <div className="rounded-2xl border border-blue-200 bg-white p-3 text-[color:var(--brand)] shadow-sm shadow-blue-100">
                <ImageUp className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-blue-950">
                  {t(lang, "upload_cta")}
                </div>
                <div className="text-xs text-[color:var(--muted)]">
                  JPG, PNG, WEBP • Max 20MB
                </div>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  await setUpload(file);
                }}
              />
            </label>

            {draft.sourceUrl ? (
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-[color:var(--border)]">
                <Image
                  src={draft.sourceUrl}
                  alt="yuklenen arac"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--muted)]">
                {t(lang, "upload_hint")}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t(lang, "prompt_title")}
            subtitle={t(lang, "prompt_subtitle")}
          />
          <CardBody className="space-y-3">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white p-3">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-950">
                <Sparkles className="h-4 w-4 text-[color:var(--brand)]" />
                {t(lang, "prompt_label")}
              </label>
              <textarea
                value={draft.settings.promptText}
                onChange={(event) => updateSettings({ promptText: event.target.value })}
                rows={7}
                className="w-full resize-y rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-400"
                placeholder={t(lang, "prompt_placeholder")}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                onClick={generateFinal}
                disabled={!canGenerate}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t(lang, "generate")} {t(lang, "generate_cost")}
              </Button>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-xs text-[color:var(--muted)]">
              {draft.sourceUrl ? (
                <>
                  {t(lang, "generate_help_has_image")}{" "}
                  <span className="font-semibold text-blue-900">
                    {creditsLoading ? "…" : credits} {t(lang, "credits")}
                  </span>
                </>
              ) : (
                t(lang, "generate_help_no_image")
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader
            title={t(lang, "result_title")}
            subtitle={t(lang, "result_subtitle")}
          />
          <CardBody>
            {draft.sourceUrl && draft.final ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                    Orijinal
                  </p>
                  <div className="relative h-72 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-blue-50/30">
                    <Image
                      src={draft.sourceUrl}
                      alt="Orijinal gorsel"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                    Uretilen
                  </p>
                  <div className="relative h-72 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-blue-50/30">
                    <Image
                      src={draft.final.url}
                      alt="Uretilen gorsel"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 text-sm text-[color:var(--muted)]">
                {t(lang, "no_result")}
              </div>
            )}

            {draft.final ? (
              <a
                href={draft.final.url}
                download="revvy-ai-final.png"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
              >
                {t(lang, "download_final")}
              </a>
            ) : null}
          </CardBody>
        </Card>
      </section>
    </AppShell>
  );
}
