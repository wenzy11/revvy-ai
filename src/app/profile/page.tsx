"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { AppShell } from "../../components/app-shell";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { t } from "../../lib/i18n";
import { useRevvy } from "../../components/revvy-provider";
import { getFirebaseDb } from "../../lib/firebase/client";

type Purchase = {
  id: string;
  buyerEmail?: string;
  creditsPending?: number;
  grantedCredits?: number;
  refundedAt?: Timestamp;
  createdAt?: Timestamp;
  completedAt?: Timestamp;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === "object" && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as Timestamp).toDate();
  }
  return null;
}

function formatDate(lang: "tr" | "en", value?: Timestamp): string {
  const d = toDate(value);
  if (!d) return lang === "tr" ? "-" : "-";
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export default function ProfilePage() {
  const { lang, user, credits, firebaseEnabled } = useRevvy();

  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uid = user?.uid;

  const canLoad = firebaseEnabled && Boolean(uid);

  useEffect(() => {
    if (!canLoad || !uid) {
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      return;
    }

    let cancelled = false;
    void (async () => {
      if (cancelled) return;

      setLoading(true);
      setError(null);

      const q = query(
        collection(db, "lemon_webhooks"),
        where("uid", "==", uid),
        limit(50),
      );

      try {
        const snap = await getDocs(q);
        if (cancelled) return;

        const rows: Purchase[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            buyerEmail: typeof data.buyerEmail === "string" ? data.buyerEmail : undefined,
            creditsPending:
              typeof data.creditsPending === "number" ? data.creditsPending : undefined,
            grantedCredits:
              typeof data.grantedCredits === "number" ? data.grantedCredits : undefined,
            refundedAt:
              data.refundedAt && typeof (data.refundedAt as Timestamp).toDate === "function"
                ? (data.refundedAt as Timestamp)
                : undefined,
            createdAt:
              data.createdAt && typeof (data.createdAt as Timestamp).toDate === "function"
                ? (data.createdAt as Timestamp)
                : undefined,
            completedAt:
              data.completedAt &&
              typeof (data.completedAt as Timestamp).toDate === "function"
                ? (data.completedAt as Timestamp)
                : undefined,
          };
        });

        const timeOf = (p: Purchase): number => {
          const t = p.completedAt ?? p.createdAt;
          return t ? t.toDate().getTime() : 0;
        };

        rows.sort((a, b) => timeOf(b) - timeOf(a));
        setPurchases(rows);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canLoad, uid, firebaseEnabled]);

  const historyTitle = useMemo(() => t(lang, "profile_history"), [lang]);
  const profileTitle = useMemo(() => t(lang, "profile_title"), [lang]);

  return (
    <AppShell>
      <section className="space-y-6">
        <Card>
          <CardHeader
            title={profileTitle}
            subtitle={lang === "tr" ? "Hesabın ve kredilerin" : "Account and credits"}
          />
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[color:var(--border)] bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                  {t(lang, "profile_account")}
                </div>
                <div className="mt-2 text-sm text-blue-950">
                  <div className="font-semibold">{user?.email ?? "-"}</div>
                  <div className="mt-1 text-xs text-[color:var(--muted)]">
                    uid: {user?.uid ?? "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[color:var(--border)] bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                  {t(lang, "profile_credits")}
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-950">
                  {credits} {t(lang, "credits")}
                </div>
                <div className="mt-3">
                  <Link href="/pricing">
                    <Button className="w-full">{lang === "tr" ? "Kredi ekle" : "Add credits"}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={historyTitle}
            subtitle={
              lang === "tr"
                ? "Lemon Squeezy üzerinden yapılan satın almalar"
                : "Purchases made via Lemon Squeezy"
            }
          />
          <CardBody>
            {loading ? (
              <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-4 text-sm text-[color:var(--muted)]">
                {lang === "tr" ? "Yükleniyor…" : "Loading…"}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {lang === "tr" ? "Geçmiş alınamadı" : "Could not load history"}: {error}
              </div>
            ) : purchases.length ? (
              <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
                <div className="grid grid-cols-[1fr_0.7fr_0.8fr] gap-0 bg-blue-50/40 px-4 py-3 text-xs font-semibold text-[color:var(--muted)]">
                  <div>{lang === "tr" ? "Sipariş" : "Order"}</div>
                  <div>{lang === "tr" ? "Kredi" : "Credits"}</div>
                  <div>{lang === "tr" ? "Tarih" : "Date"}</div>
                </div>
                <div className="divide-y divide-[color:var(--border)]">
                  {purchases.map((p) => {
                    const granted = p.grantedCredits ?? p.creditsPending ?? 0;
                    const d = p.completedAt ?? p.createdAt;
                    return (
                      <div
                        key={p.id}
                        className="grid grid-cols-[1fr_0.7fr_0.8fr] gap-0 px-4 py-3 text-sm"
                      >
                        <div className="truncate text-blue-950">
                          <div className="font-semibold">{p.id}</div>
                          {p.buyerEmail ? (
                            <div className="truncate text-xs text-[color:var(--muted)]">{p.buyerEmail}</div>
                          ) : null}
                          {p.refundedAt ? (
                            <div className="mt-1 text-[11px] font-semibold text-red-700">
                              {lang === "tr" ? "İade" : "Refunded"}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold text-blue-950">
                            {granted} {t(lang, "credits")}
                          </span>
                        </div>
                        <div className="flex items-center text-[color:var(--muted)]">
                          {formatDate(lang, d)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-4 text-sm text-[color:var(--muted)]">
                {lang === "tr" ? "Henüz satın alma geçmişi yok." : "No purchase history yet."}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t(lang, "profile_support_title")}
            subtitle={
              lang === "tr"
                ? "Soruların için bize e-posta gönder."
                : "Send us an email for questions."
            }
          />
          <CardBody>
            <div className="rounded-xl border border-[color:var(--border)] bg-white p-4">
              <div className="text-sm font-semibold text-blue-950">
                {t(lang, "profile_support_email")}
              </div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">
                {t(lang, "profile_support_hint")}
              </div>
              <div className="mt-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    const to = "wenzykerem@gmail.com";
                    const subject = lang === "tr" ? "Revvy AI Destek" : "Revvy AI Support";
                    const body =
                      lang === "tr"
                        ? "Merhaba,\n\nSorunum / sorum:\n"
                        : "Hi,\n\nMy issue / question:\n";
                    window.location.href = `mailto:${to}?subject=${encodeURIComponent(
                      subject,
                    )}&body=${encodeURIComponent(body)}`;
                  }}
                >
                  {t(lang, "profile_support_button")}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>
    </AppShell>
  );
}

