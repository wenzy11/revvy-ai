"use client";

import { Check, Coins } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { useRevvy } from "../../components/revvy-provider";
import { withLemonCheckoutFirebaseContext } from "../../lib/lemon-checkout-url";
import { Button } from "../../components/ui/button";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { t } from "../../lib/i18n";

const packs = [
  {
    id: "p5",
    credits: 5 as const,
    priceLabel: "TRY 89.99",
    highlight: false,
  },
  {
    id: "p10",
    credits: 10 as const,
    priceLabel: "TRY 149.99",
    highlight: true,
  },
  {
    id: "p20",
    credits: 20 as const,
    priceLabel: "TRY 249.99",
    highlight: false,
  },
] as const;

function baseCheckoutUrlFor(credits: 5 | 10 | 20): string | undefined {
  const raw =
    credits === 5
      ? process.env.NEXT_PUBLIC_LEMON_CHECKOUT_5
      : credits === 10
        ? process.env.NEXT_PUBLIC_LEMON_CHECKOUT_10
        : process.env.NEXT_PUBLIC_LEMON_CHECKOUT_20;
  const s = raw?.trim();
  return s || undefined;
}

export default function PricingPage() {
  const { topUpCredits, lang, user } = useRevvy();

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
          {packs.map((pack) => {
            const base = baseCheckoutUrlFor(pack.credits);
            const checkout =
              base && user?.uid
                ? withLemonCheckoutFirebaseContext(base, {
                    uid: user.uid,
                    email: user.email,
                  })
                : base;
            return (
              <Card
                key={pack.id}
                className={`overflow-hidden ${pack.highlight ? "ring-2 ring-[color:var(--brand)]" : ""}`}
              >
                <CardHeader
                  title={`${pack.credits} ${t(lang, "credits")}`}
                  subtitle={pack.priceLabel}
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
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (checkout) {
                          window.open(checkout, "_blank", "noopener,noreferrer");
                        } else {
                          topUpCredits(pack.credits);
                        }
                      }}
                    >
                      {t(lang, "pricing_buy")}
                    </Button>
                    <div className="mt-2 text-center text-xs text-[color:var(--muted)]">
                      {checkout ? t(lang, "pricing_pay_note") : t(lang, "pricing_demo_note")}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
