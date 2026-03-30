import OpenAI from "openai";
import {
  getCredits,
  consumeCredits,
  verifyIdToken,
} from "../../../lib/firebase/admin";
import { isFirebaseAdminConfigured } from "../../../lib/firebase/config";
import type { PlateOption } from "../../../lib/types";

export const runtime = "nodejs";

type Body = {
  imageDataUrl: string;
  userPrompt: string;
  stage: "preview" | "final";
  photoCount?: number;
  plateOption?: PlateOption;
  plateText?: string;
};

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    throw new Error("Gecersiz data URL");
  }
  const mimeType = match[1]!;
  const base64 = match[2]!;
  return { mimeType, buffer: Buffer.from(base64, "base64") };
}

const BASE_QUALITY_PROMPT = [
  "Sen profesyonel otomotiv studyosu retus uzmani bir AI'sin.",
  "Yuklenen aracin modelini, rengini ve tum detaylarini KORU (araci degistirme).",
  "Araci ilan kalitesine getir: duzgun pozlama, temiz kontrast, dogal renk, net detay.",
  "Arka plan profesyonel ve dikkat dagitmayacak kadar temiz olsun.",
  // Plaka metni istenirse istisna olabilir.
  "Goruntude watermark, logo, metin, etiket, tabela OLMASIN (plaka yazisi istenirse istisna).",
].join("\n");

function platePrompt(plateOption: PlateOption, plateText: string): string {
  const trimmed = plateText.trim();

  if (plateOption === "none") {
    return [
      "Insan, yuz, plaka bilgisi gibi hassas detaylari gizle.",
      "Plakayi tamamen kaldir; plaka yazilari/etiketleri OLMASIN.",
    ].join("\n");
  }

  if (plateOption === "custom") {
    return [
      "Insan, yuz, plaka bilgisi gibi hassas detaylari gizle (plaka haric).",
      trimmed
        ? `Plakaya EXACT olarak su metni yerlestir: "${trimmed}". Plaka karakterleri net, keskin ve okunabilir olsun.`
        : "Plakaya okunabilir bir metin yerlestir (kullanici plaka metni bossa varsayim yapma; plaka okunakli olsun).",
      "Plaka disinda watermark/logo/metin/etiket/tabela OLMASIN.",
    ].join("\n");
  }

  // blurred (default)
  const maybePlateLine = trimmed
    ? `Kullanici plakasi: "${trimmed}". Bu bilgi okunabilir olmamali; plaka karakterleri blur/maskele ile gizlenmeli.`
    : `Plakayi blurla/maskele; plaka karakterleri okunabilir olmamali.`;
  return [
    "Insan, yuz, plaka bilgisi gibi hassas detaylari gizle (plakayi blurla/maskele).",
    maybePlateLine,
  ].join("\n");
}

function clampPhotoCount(photoCount: number | undefined): number {
  const n = Math.floor(photoCount ?? 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 4);
}

function poseVariation(i: number, photoCount: number): string {
  // PhotoCount=3 icin: deterministik ON / ARKA / YAN.
  if (photoCount === 3) {
    if (i === 0) {
      return [
        "POZISYON 1/3: ON GORUNUM (aracin on kaputu/kasa önü kameraya dönük).",
        "Aracin ayni konumda kaldigi varsayilsin; sadece kamera/perspektif degissin.",
        "Zemin ve arka plan mümkün oldugunca benzer/kesintisiz kalmali.",
      ].join("\n");
    }
    if (i === 1) {
      return [
        "POZISYON 2/3: ARKA GORUNUM (aracin arka bagaj bölümü kameraya dönük).",
        "Aracin ayni konumda kaldigi varsayilsin; sadece kamera/perspektif degissin.",
        "Zemin ve arka plan mümkün oldugunca benzer/kesintisiz kalmali.",
      ].join("\n");
    }
    return [
      "POZISYON 3/3: YAN GORUNUM (aracin yan cephesi 3/4 aci ile kameraya dönük).",
      "Aracin ayni konumda kaldigi varsayilsin; sadece kamera/perspektif degissin.",
      "Zemin ve arka plan mümkün oldugunca benzer/kesintisiz kalmali.",
    ].join("\n");
  }

  // 2 foto: ON / ARKA.
  if (photoCount === 2) {
    return [
      `POZISYON ${i + 1}/${photoCount}: Kamerayi öne/arkaya alacak sekilde perspektif degissin.`,
      "Aracin ayni konumda kaldigi varsayilsin; sadece kadraj/perspektif degissin.",
      "Aracin rengi, modeli ve temel detaylari korunmali.",
    ].join("\n");
  }

  // 4+ foto: daha genis kamera varyasyonu.
  const idx = i + 1;
  return [
    `POZISYON ${idx}/${photoCount}: Kamera acisi ve perspektif degissin (aracin ayni sahnede kaldigi varsayilsin).`,
    "Zemin/arka plan benzer kalmali; aracin detaylari korunmali.",
  ].join("\n");
}

function envImageQuality(): string {
  return process.env.OPENAI_IMAGE_QUALITY ?? "high";
}

function envImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5";
}

function envImageSize():
  | "1024x1024"
  | "auto"
  | "256x256"
  | "512x512"
  | "1536x1024"
  | "1024x1536"
  | null
  | undefined {
  const allowed = [
    "1024x1024",
    "auto",
    "256x256",
    "512x512",
    "1536x1024",
    "1024x1536",
  ] as const;
  const raw = process.env.OPENAI_IMAGE_SIZE?.trim() ?? "";
  if (allowed.includes(raw as (typeof allowed)[number])) {
    return raw as (typeof allowed)[number];
  }
  return "1024x1024";
}

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.imageDataUrl) {
      return Response.json({ error: "imageDataUrl gerekli" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY tanimli degil" },
        { status: 500 },
      );
    }

    const adminConfigured = isFirebaseAdminConfigured();
    const relaxRenderAuth =
      process.env.NODE_ENV === "development" || process.env.RENDER_AUTH_RELAXED === "1";

    if (!adminConfigured && !relaxRenderAuth) {
      return Response.json(
        { error: "Uretim ortaminda FIREBASE_SERVICE_ACCOUNT_JSON zorunlu" },
        { status: 503 },
      );
    }

    let firebaseUid: string | null = null;

    const photoCount = clampPhotoCount(body.photoCount);
    const plateOption: PlateOption =
      body.plateOption === "none" || body.plateOption === "blurred" || body.plateOption === "custom"
        ? body.plateOption
        : "blurred";
    const plateText = typeof body.plateText === "string" ? body.plateText : "";

    if (adminConfigured) {
      const token = bearerToken(req);
      if (!token) {
        return Response.json({ error: "Giris gerekli" }, { status: 401 });
      }
      const decoded = await verifyIdToken(token);
      if (!decoded) {
        return Response.json({ error: "Gecersiz oturum" }, { status: 401 });
      }
      firebaseUid = decoded.uid;
      if (body.stage === "final") {
        const creditsNow = await getCredits(firebaseUid);
        if (creditsNow < photoCount) {
          return Response.json({ error: "Yetersiz kredi" }, { status: 403 });
        }
      }
    }

    const { buffer, mimeType } = dataUrlToBuffer(body.imageDataUrl);
    const openai = new OpenAI({ apiKey });

    const promptBase = `${BASE_QUALITY_PROMPT}\n${platePrompt(plateOption, plateText)}\n\nKULLANICI ISTEGI:\n${body.userPrompt || ""}`.trim();

    const urls: string[] = [];
    for (let i = 0; i < photoCount; i++) {
      const variation =
        photoCount > 1 ? `\n\n${poseVariation(i, photoCount)}` : "";
      const prompt = `${promptBase}${variation}`.trim();

      const result = await openai.images.edit({
        model: envImageModel(),
        quality: envImageQuality() as "low" | "medium" | "high" | "auto",
        prompt,
        image: [
          new File([buffer], "car.png", {
            type: mimeType || "image/png",
          }),
        ],
        size: envImageSize(),
      });

      const b64 = result.data?.[0]?.b64_json;
      if (!b64) {
        return Response.json({ error: "Gorsel uretilmedi" }, { status: 502 });
      }
      urls.push(`data:image/png;base64,${b64}`);
    }

    let creditsRemaining: number | undefined;
    if (body.stage === "final" && firebaseUid) {
      const spent = await consumeCredits(firebaseUid, photoCount);
      if (!spent.ok) {
        return Response.json({ error: "Kredi guncellenemedi" }, { status: 409 });
      }
      creditsRemaining = spent.credits;
    }

    return Response.json({
      urls,
      watermark: body.stage === "preview",
      ...(creditsRemaining !== undefined ? { creditsRemaining } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return Response.json({ error: message }, { status: 500 });
  }
}
