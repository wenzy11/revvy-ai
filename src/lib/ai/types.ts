import type { EditSettings, RenderedAsset, RenderStage } from "../types";

export type RenderRequest = {
  imageUrl: string;
  settings: EditSettings;
  stage: RenderStage;
  /** Firebase Auth ID token (preview/final; sunucuda Admin SDK varsa zorunlu) */
  idToken?: string;
};

export interface AiProvider {
  name: string;
  render(request: RenderRequest): Promise<RenderedAsset>;
}
