import OpenAI from "openai";
import {
  consumeCredit,
  getCredits,
  verifyIdToken,
} from "../../../lib/firebase/admin";
import { isFirebaseAdminConfigured } from "../../../lib/firebase/config";

export const runtime = "nodejs";

type Body = {
  imageDataUrl: string;
  userPrompt: string;
  stage: "preview" | "final";
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
  "Goruntude yazi, logo, watermark, metin, etiket, tabelalar OLMASIN.",
  "Insan, yuz, plaka bilgisi gibi hassas detaylari gizle (plakayi blurla/maskele).",
].join("\n");

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

    let firebaseUid: string | null = null;
    if (body.stage === "final" && isFirebaseAdminConfigured()) {
      const token = bearerToken(req);
      if (!token) {
        return Response.json({ error: "Giris gerekli" }, { status: 401 });
      }
      const decoded = await verifyIdToken(token);
      if (!decoded) {
        return Response.json({ error: "Gecersiz oturum" }, { status: 401 });
      }
      firebaseUid = decoded.uid;
      const creditsNow = await getCredits(firebaseUid);
      if (creditsNow < 1) {
        return Response.json({ error: "Yetersiz kredi" }, { status: 403 });
      }
    }

    const { buffer, mimeType } = dataUrlToBuffer(body.imageDataUrl);
    const openai = new OpenAI({ apiKey });

    const prompt = `${BASE_QUALITY_PROMPT}\n\nKULLANICI ISTEGI:\n${body.userPrompt || ""}`.trim();

    const result = await openai.images.edit({
      model: "gpt-image-1",
      prompt,
      image: [
        new File([buffer], "car.png", {
          type: mimeType || "image/png",
        }),
      ],
      size: "1024x1024",
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return Response.json({ error: "Gorsel uretilmedi" }, { status: 502 });
    }

    const outDataUrl = `data:image/png;base64,${b64}`;

    let creditsRemaining: number | undefined;
    if (body.stage === "final" && firebaseUid) {
      const spent = await consumeCredit(firebaseUid);
      if (!spent.ok) {
        return Response.json({ error: "Kredi guncellenemedi" }, { status: 409 });
      }
      creditsRemaining = spent.credits;
    }

    return Response.json({
      url: outDataUrl,
      watermark: body.stage === "preview",
      ...(creditsRemaining !== undefined ? { creditsRemaining } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return Response.json({ error: message }, { status: 500 });
  }
}
