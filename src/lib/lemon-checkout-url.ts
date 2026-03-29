/**
 * Lemon ön doldurma: https://docs.lemonsqueezy.com/help/checkout/prefilling-checkout-fields
 * Webhook’ta firebase_uid + e-posta eşleşmesi ile güvenli eşleme yapılır.
 */
export function withLemonCheckoutFirebaseContext(
  checkoutUrl: string,
  opts: { uid: string; email?: string },
): string {
  const trimmed = checkoutUrl.trim();
  if (!trimmed || !opts.uid) return trimmed;
  try {
    const u = new URL(trimmed);
    u.searchParams.set("checkout[custom][firebase_uid]", opts.uid);
    if (opts.email?.trim()) {
      u.searchParams.set("checkout[email]", opts.email.trim());
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}
