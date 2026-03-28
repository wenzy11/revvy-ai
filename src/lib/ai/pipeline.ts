import type { RenderRequest } from "./types";

export async function runAiPipeline(request: RenderRequest) {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      imageDataUrl: request.imageUrl,
      userPrompt: request.settings.promptText,
      stage: request.stage,
    }),
  });

  const payload = (await res.json()) as
    | { url: string; watermark: boolean }
    | { error: string };

  if (!res.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error : "Render basarisiz");
  }

  return {
    url: payload.url,
    stage: request.stage,
    watermark: payload.watermark,
    generatedAt: new Date().toISOString(),
  };
}
