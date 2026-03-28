"use client";

import { Check, Coins } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { useRevvy } from "../../components/revvy-provider";
import { Button } from "../../components/ui/button";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { t } from "../../lib/i18n";

const packs = [
  { id: "p5", credits: 5, priceUsd: "2.00", highlight: false },
  { id: "p10", credits: 10, priceUsd: "3.49", highlight: true },
  { id: "p20", credits: 20, priceUsd: "5.99", highlight: false },
] as const;

export default function PricingPage() {
  const { topUpCredits, lang } = useRevvy();

  return (
    <AppShell>
      <section className="space-y-6">
        <Card>
          <CardHeader
            title={t(lang, "pricing_title")}
            subtitle={t(lang, "pricing_subtitle")}
          />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[color:var(--muted)]">
              {t(lang, "pricing_usd_note")}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold text-blue-800">
              <Coins className="h-3.5 w-3.5 text-[color:var(--brand)]" />
              1 {t(lang, "credits")} · $0
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {packs.map((pack) => (
            <Card
              key={pack.id}
              className={`overflow-hidden ${pack.highlight ? "ring-2 ring-[color:var(--brand)]" : ""}`}
            >
              <CardHeader
                title={`${pack.credits} ${t(lang, "credits")}`}
                subtitle={`$${pack.priceUsd}`}
                right={
                  pack.highlight ? (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {t(lang, "pricing_popular")}
                    </span>
                  ) : undefined
                }
              />

              <CardBody>
                <ul className="space-y-2 text-sm text-blue-900">
                  <li className="inline-flex w-full items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {t(lang, "pricing_feature_hd")}
                  </li>
                  <li className="inline-flex w-full items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {t(lang, "pricing_feature_fast")}
                  </li>
                  <li className="inline-flex w-full items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {t(lang, "pricing_feature_stack")}
                  </li>
                </ul>

                <div className="mt-5">
                  <Button onClick={() => topUpCredits(pack.credits)} className="w-full">
                    {t(lang, "pricing_buy")}
                  </Button>
                  <div className="mt-2 text-center text-xs text-[color:var(--muted)]">
                    {t(lang, "pricing_demo_note")}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
