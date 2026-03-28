import type { AiProvider, RenderRequest } from "../types";
import type { RenderedAsset } from "../../types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createOverlayLabel(request: RenderRequest): string {
  const prompt = request.settings.promptText
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 42);

  return `${prompt}_${request.stage}`;
}

export const mockAiProvider: AiProvider = {
  name: "mock-ai-provider",
  async render(request) {
    await wait(request.stage === "preview" ? 900 : 1400);

    const asset: RenderedAsset = {
      url: `${request.imageUrl}#${createOverlayLabel(request)}`,
      stage: request.stage,
      watermark: request.stage === "preview",
      generatedAt: new Date().toISOString(),
    };

    return asset;
  },
};
