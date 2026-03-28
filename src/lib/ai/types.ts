import type { EditSettings, RenderedAsset, RenderStage } from "../types";

export type RenderRequest = {
  imageUrl: string;
  settings: EditSettings;
  stage: RenderStage;
};

export interface AiProvider {
  name: string;
  render(request: RenderRequest): Promise<RenderedAsset>;
}
