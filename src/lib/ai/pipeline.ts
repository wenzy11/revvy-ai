import type { RenderRequest } from "./types";

export async function runAiPipeline(request: RenderRequest) {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(request.idToken
        ? { Authorization: `Bearer ${request.idToken}` }
        : {}),
    },
    body: JSON.stringify({
      imageDataUrl: request.imageUrl,
      userPrompt: request.settings.promptText,
      stage: request.stage,
      photoCount: request.settings.photoCount,
      plateOption: request.settings.plateOption,
      plateText: request.settings.plateText,
    }),
  });

  const payload = (await res.json()) as
    | { urls: string[]; watermark: boolean; creditsRemaining?: number }
    | { error: string };

  if (!res.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error : "Render basarisiz");
  }

  return {
    urls: payload.urls,
    stage: request.stage,
    watermark: payload.watermark,
    generatedAt: new Date().toISOString(),
    creditsRemaining: payload.creditsRemaining,
  };
}
