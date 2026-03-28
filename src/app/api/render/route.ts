import OpenAI from "openai";

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

    const { buffer, mimeType } = dataUrlToBuffer(body.imageDataUrl);
    const openai = new OpenAI({ apiKey });

    const prompt = `${BASE_QUALITY_PROMPT}\n\nKULLANICI ISTEGI:\n${body.userPrompt || ""}`.trim();

    // gpt-image-1 supports image edits; response returns base64 data.
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

    return Response.json({
      url: outDataUrl,
      watermark: body.stage === "preview",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return Response.json({ error: message }, { status: 500 });
  }
}

