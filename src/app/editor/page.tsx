"use client";

import Link from "next/link";
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
    firebaseEnabled,
    user,
    authLoading,
    creditsLoading,
  } = useRevvy();

  const needSignIn = firebaseEnabled && !user;
  const creditsBlocked = firebaseEnabled && (authLoading || creditsLoading);
  const canFinal = !processing && credits >= 1 && !needSignIn && !creditsBlocked;

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
                  Final Render Al
                </Button>

                {draft.final ? (
                  <a
                    href={draft.final.url}
                    download="revvy-ai-final.png"
                    className="block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700"
                  >
                    Final Goruntuyu Indir
                  </a>
                ) : (
                  <div className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-xs text-[color:var(--muted)]">
                    Final icin en az 1 kredi gerekir.
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
