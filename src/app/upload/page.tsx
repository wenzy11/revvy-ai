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
  const photoCount = Math.max(1, Math.floor(draft.settings.photoCount ?? 1));
  const canGenerate =
    draft.sourceUrl && !processing && credits >= photoCount && !creditsBlocked;

  const plateLabel =
    draft.settings.plateOption === "none"
      ? lang === "tr"
        ? "Plakasız"
        : "No plate"
      : draft.settings.plateOption === "custom"
        ? lang === "tr"
          ? "Yazdığımız plaka"
          : "Custom plate"
        : lang === "tr"
          ? "Bulanık plaka"
          : "Blurred plate";

  const costText =
    lang === "tr" ? `(${photoCount} kredi)` : `(${photoCount} credit${photoCount === 1 ? "" : "s"})`;

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

            <div className="rounded-2xl border border-[color:var(--border)] bg-white p-3">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-950">
                Foto Sayısı
              </label>
              <select
                value={photoCount}
                onChange={(event) =>
                  updateSettings({ photoCount: Number(event.target.value) })
                }
                className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-400"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-[color:var(--muted)]">
                {lang === "tr"
                  ? `Finalde her foto 1 kredi harcar (toplam ${photoCount} kredi).`
                  : `Final costs 1 credit per photo (total ${photoCount} credits).`}
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-white p-3">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-950">
                Plaka Tercihi
              </label>
              <select
                value={draft.settings.plateOption}
                onChange={(event) =>
                  updateSettings({
                    plateOption:
                      event.target.value === "none"
                        ? "none"
                        : event.target.value === "custom"
                          ? "custom"
                          : "blurred",
                  })
                }
                className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-400"
              >
                <option value="blurred">
                  {lang === "tr" ? "Bulanık plaka" : "Blurred plate"}
                </option>
                <option value="custom">
                  {lang === "tr" ? "Yazdığımız plaka" : "Custom plate"}
                </option>
                <option value="none">{lang === "tr" ? "Plakasız" : "No plate"}</option>
              </select>
              <div className="mt-2 text-xs text-[color:var(--muted)]">
                {lang === "tr"
                  ? `Seçim: ${plateLabel}`
                  : `Selected: ${plateLabel}`}
              </div>
            </div>

            {draft.settings.plateOption === "custom" ? (
              <div className="rounded-2xl border border-[color:var(--border)] bg-white p-3">
                <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-950">
                  Plaka Metni
                </label>
                <input
                  type="text"
                  value={draft.settings.plateText}
                  onChange={(event) => updateSettings({ plateText: event.target.value })}
                  placeholder={lang === "tr" ? "Örn: 34 ABC 1234" : 'e.g. "34 ABC 1234"'}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-400"
                />
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  {lang === "tr"
                    ? "Bu metin plaka olarak okunabilir şekilde yerleştirilmeye çalışılır."
                    : "We try to place this text on the plate in a readable way."}
                </div>
              </div>
            ) : null}

            {draft.settings.plateOption === "blurred" ? (
              <div className="rounded-2xl border border-[color:var(--border)] bg-white p-3">
                <div className="text-xs text-[color:var(--muted)]">
                  {lang === "tr"
                    ? "Bulanık plaka seçildi: yazdığın metin okunabilir olmayacak (input burada gizli)."
                    : "Blurred plate selected: plate text won’t be readable (input hidden)."}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                onClick={generateFinal}
                disabled={!canGenerate}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t(lang, "generate")} {costText}
              </Button>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-xs text-[color:var(--muted)]">
              {draft.sourceUrl ? (
                <>
                  {lang === "tr"
                    ? `Üretim ${photoCount} kredi harcar. Kalan:`
                    : `Generation costs ${photoCount} credit${photoCount === 1 ? "" : "s"}. Remaining:`}{" "}
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
            {draft.sourceUrl && draft.finals && draft.finals.length ? (
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

                {draft.finals.map((final, idx) => (
                  <div key={final.url} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                      {lang === "tr" ? `Uretilen ${idx + 1}` : `Generated ${idx + 1}`}
                    </p>
                    <div className="relative h-72 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-blue-50/30">
                      <Image
                        src={final.url}
                        alt={`Uretilen gorsel ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <a
                      href={final.url}
                      download={`revvy-ai-final-${idx + 1}.png`}
                      className="mt-2 block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-700"
                    >
                      {t(lang, "download_final")} {idx + 1}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 text-sm text-[color:var(--muted)]">
                {t(lang, "no_result")}
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </AppShell>
  );
}
