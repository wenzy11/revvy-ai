export type Lang = "tr" | "en";

type Dict = Record<string, string>;

const tr: Dict = {
  nav_home: "Ana Sayfa",
  nav_upload: "Yükle",
  nav_projects: "Projeler",
  nav_pricing: "Fiyatlandırma",
  credits: "kredi",
  demo_login: "Demo Giriş",
  google_sign_in: "Google ile giriş",
  config_loading: "Yükleniyor…",
  auth_wall_title: "Devam etmek için giriş yap",
  auth_wall_subtitle:
    "Revvy AI araç fotoğraflarını stüdyo kalitesine taşır. Kredilerin ve üretimlerin hesabında güvenle saklanır.",
  auth_wall_hint: "İlk girişte hesabına 1 ücretsiz kredi tanımlanır.",
  auth_wall_redirect_note: "Google’a yönlendirileceksin; tamamla ve bu sayfaya geri dön.",
  auth_checking: "Oturum kontrol ediliyor…",
  firebase_missing_title: "Firebase yapılandırması eksik",
  firebase_missing_body:
    "Sunucuda FIREBASE_WEB_CONFIG_JSON ve FIREBASE_SERVICE_ACCOUNT_JSON tanımlı olmalı. Vercel Environment Variables’ı kontrol et.",
  logout: "Çıkış",
  language: "Dil",

  upload_title: "1. Araç Fotoğrafını Yükle",
  upload_subtitle: "Ham çekim bile olabilir. Revvy AI stüdyo kalitesine taşır.",
  upload_cta: "Araba Fotoğrafı Yükle",
  upload_hint: "İpuçları: Aracı kadraja tam al, plakayı kapatmana gerek yok.",

  prompt_title: "2. Düzenleme Promptu",
  prompt_subtitle: "İsteğini doğrudan yazarak düzenlet.",
  prompt_label: "Prompt",
  prompt_placeholder:
    "Örnek: Aracı beyaz seamless arka planda premium stüdyo çekimi gibi düzenle; parlaklık dengeli, boya net, ilan kalitesinde olsun.",

  generate: "Üret",
  generate_cost: "(1 kredi)",
  generate_help_has_image: "Üretim 1 kredi harcar. Kalan:",
  generate_help_no_image: "Üretim için önce fotoğraf yükle.",
  sign_in_required: "Üretim için Google ile giriş yap.",

  result_title: "Sonuç",
  result_subtitle: "Üretim tamamlanınca sonuç burada görünür.",
  no_result: "Henüz sonuç yok. Üret.",
  download_final: "Final Görüntüyü İndir",

  home_badge: "Otomotiv Stüdyo Kalitesinde AI",
  home_h1: "Araba fotoğraflarını saniyeler içinde profesyonel çekim görünümüne çevir.",
  home_p:
    "Yükle, prompt yaz, tek tıkla ilan kalitesinde görsel üret ve indir.",
  home_start: "Başla",
  home_view_plans: "Paketleri Gör",
  examples_title: "Önce / Sonra Örnekleri",
  before_bad: "ÖNCE - KALİTESİZ / KÖTÜ ARKAPLAN",
  after_pro: "SONRA - PROFESYONEL ÇEKİM",

  pricing_title: "Kredi paketleri",
  pricing_subtitle: "Hesap açılışında 1 ücretsiz kredi. Her üretim 1 kredi harcar.",
  pricing_usd_note: "Fiyatlar Lemon mağazasında TRY.",
  pricing_buy: "Satın al",
  pricing_demo_note: "Demo: kredi ekler (checkout URL yok)",
  pricing_pay_note: "Ödeme Lemon Squeezy güvenli sayfasında tamamlanır.",
  pricing_feature_hd: "Yüksek çözünürlük final",
  pricing_feature_fast: "Hızlı üretim",
  pricing_feature_stack: "İstediğin kadar paket al",
  pricing_popular: "Popüler",
};

const en: Dict = {
  nav_home: "Home",
  nav_upload: "Upload",
  nav_projects: "Projects",
  nav_pricing: "Pricing",
  credits: "credits",
  demo_login: "Demo Login",
  google_sign_in: "Sign in with Google",
  config_loading: "Loading…",
  auth_wall_title: "Sign in to continue",
  auth_wall_subtitle:
    "Revvy AI upgrades car photos to studio quality. Your credits and work stay tied to your account.",
  auth_wall_hint: "You get 1 free credit on first sign-in.",
  auth_wall_redirect_note: "You’ll be sent to Google, then return here.",
  auth_checking: "Checking session…",
  firebase_missing_title: "Firebase is not configured",
  firebase_missing_body:
    "Set FIREBASE_WEB_CONFIG_JSON and FIREBASE_SERVICE_ACCOUNT_JSON on the server (e.g. Vercel env).",
  logout: "Logout",
  language: "Language",

  upload_title: "1. Upload a Car Photo",
  upload_subtitle: "Even a raw shot works. Revvy AI upgrades it to studio quality.",
  upload_cta: "Upload Car Photo",
  upload_hint: "Tip: Frame the whole car—no need to hide the plate.",

  prompt_title: "2. Edit Prompt",
  prompt_subtitle: "Describe what you want—Revvy will handle the rest.",
  prompt_label: "Prompt",
  prompt_placeholder:
    "Example: Make it look like a premium white seamless studio shoot; balanced exposure, crisp paint, listing-ready.",

  generate: "Generate",
  generate_cost: "(1 credit)",
  generate_help_has_image: "Generation costs 1 credit. Remaining:",
  generate_help_no_image: "Upload a photo first to generate.",
  sign_in_required: "Sign in with Google to generate.",

  result_title: "Result",
  result_subtitle: "When generation finishes, you’ll see it here.",
  no_result: "No result yet. Generate.",
  download_final: "Download Final Image",

  home_badge: "Studio-grade Automotive AI",
  home_h1: "Turn car photos into professional studio-looking images in seconds.",
  home_p: "Upload, write a prompt, generate a listing-ready image, download.",
  home_start: "Start",
  home_view_plans: "View Plans",
  examples_title: "Before / After Examples",
  before_bad: "BEFORE - LOW QUALITY / BAD BACKGROUND",
  after_pro: "AFTER - PROFESSIONAL",

  pricing_title: "Credit packs",
  pricing_subtitle: "1 free credit on signup. Each generation uses 1 credit.",
  pricing_usd_note: "Prices in TRY on Lemon.",
  pricing_buy: "Buy",
  pricing_demo_note: "Demo: adds credits (no checkout URL)",
  pricing_pay_note: "Checkout opens on Lemon Squeezy.",
  pricing_feature_hd: "High-resolution final output",
  pricing_feature_fast: "Fast generation",
  pricing_feature_stack: "Buy as many packs as you need",
  pricing_popular: "Popular",
};

const dictionaries: Record<Lang, Dict> = { tr, en };

export function t(lang: Lang, key: keyof typeof tr): string {
  return dictionaries[lang][key] ?? dictionaries.tr[key] ?? String(key);
}

