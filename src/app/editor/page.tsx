"use client";

import Link from "next/link";
import Image from "next/image";
import { Download, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { BeforeAfter } from "../../components/before-after";
import { useRevvy } from "../../components/revvy-provider";
import { Button } from "../../components/ui/button";
import { Card, CardBody, CardHeader } from "../../components/ui/card";

export default function EditorPage() {
  const {
    credits,
    draft,
    processing,
    updateSettings,
    generatePreview,
    generateFinal,
    authLoading,
    creditsLoading,
  } = useRevvy();

  const creditsBlocked = authLoading || creditsLoading;
  const photoCount = Math.max(1, Math.floor(draft.settings.photoCount ?? 1));
  const canFinal = !processing && credits >= photoCount && !creditsBlocked;

  if (!draft.sourceUrl) {
    return (
      <AppShell>
        <Card className="max-w-xl">
          <CardHeader title="Editor" subtitle="Devam etmek icin once bir fotograf yukle." />
          <CardBody>
            <Link href="/upload">
              <Button>Upload sayfasina git</Button>
            </Link>
          </CardBody>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="space-y-5">
        <Card>
          <CardHeader
            title="3. Onizleme ve Render"
            subtitle="Tum ayarlar yerine sadece prompt ile duzenleme."
            right={
              <div className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold text-blue-800">
                {credits} kredi
              </div>
            }
          />
          <CardBody>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4">
                {draft.preview ? (
                  <BeforeAfter
                    before={draft.sourceUrl}
                    after={draft.preview.url}
                    showWatermark={draft.preview.watermark}
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 text-[color:var(--muted)] md:h-96">
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-[color:var(--brand)]" />
                      Once onizleme uret.
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-[color:var(--border)] bg-white p-4">
                <div className="rounded-xl border border-[color:var(--border)] bg-blue-50/40 p-3">
                  <div className="mb-3 rounded-xl border border-[color:var(--border)] bg-white/70 p-3">
                    <div className="mb-2 text-sm font-semibold text-blue-950">
                      Foto Sayısı
                    </div>
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
                      {photoCount} {photoCount === 1 ? "kredi" : "kredi"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3">
                    <div className="mb-2 text-sm font-semibold text-blue-950">
                      Plaka Tercihi
                    </div>
                    <select
                      value={draft.settings.plateOption}
                      onChange={(event) =>
                        updateSettings({
                          plateOption:
                            event.target.value === "none" ? "none" : "blurred",
                        })
                      }
                      className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-400"
                    >
                      <option value="blurred">Bulanık plaka</option>
                      <option value="none">Plakasız</option>
                    </select>
                  </div>

                  {draft.settings.plateOption === "blurred" ? (
                    <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3">
                      <div className="mb-2 text-sm font-semibold text-blue-950">
                        Plaka Metni
                      </div>
                      <input
                        type="text"
                        value={draft.settings.plateText}
                        onChange={(event) =>
                          updateSettings({ plateText: event.target.value })
                        }
                        placeholder="Örn: 34 ABC 1234"
                        className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-400"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3 text-xs text-[color:var(--muted)]">
                      {`Plakasız seçildiğinde plaka tamamen kaldırılır.`}
                    </div>
                  )}

                  <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-950">
                    <Sparkles className="h-4 w-4 text-[color:var(--brand)]" />
                    Duzenleme Promptu
                  </label>
                  <textarea
                    value={draft.settings.promptText}
                    onChange={(event) =>
                      updateSettings({ promptText: event.target.value })
                    }
                    rows={10}
                    className="w-full resize-y rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-400"
                    placeholder="Ornek: Araci premium beyaz studyo ortamina tası, parlama kontrolu yap, lastik ve jant detaylarini belirginlestir, ilan kalitesinde temiz bir cekim gibi gorsun."
                  />
                  <div className="mt-2 text-xs text-[color:var(--muted)]">
                    Prompt ne kadar acik olursa sonuc o kadar iyi olur.
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={generatePreview}
                  disabled={processing}
                  className="w-full"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Onizleme Uret
                </Button>

                <Button
                  onClick={generateFinal}
                  disabled={!canFinal}
                  className="w-full"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Final Render Al ({photoCount} kredi)
                </Button>

                {draft.finals?.length ? (
                  <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-white px-4 py-3">
                    {draft.finals.map((final, idx) => (
                      <div key={final.url} className="space-y-2">
                        <div className="relative h-28 overflow-hidden rounded-xl border border-[color:var(--border)] bg-blue-50/30">
                          <ImageIcon className="absolute left-2 top-2 h-6 w-6 text-[color:var(--muted)]" />
                          <Image
                            src={final.url}
                            alt={`Final ${idx + 1}`}
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>
                        <a
                          href={final.url}
                          download={`revvy-ai-final-${idx + 1}.png`}
                          className="block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-700"
                        >
                          Final Goruntuyu Indir {idx + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-xs text-[color:var(--muted)]">
                    {`Final icin en az ${photoCount} kredi gerekir.`}
                  </div>
                )}

                <Link href="/upload" className="block">
                  <Button className="w-full" variant="ghost">
                    Yeni Uretim Yap
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>
    </AppShell>
  );
}
