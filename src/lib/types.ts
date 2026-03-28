export type EditSettings = {
  promptText: string;
};

export type RenderStage = "preview" | "final";

export type RenderedAsset = {
  url: string;
  stage: RenderStage;
  watermark: boolean;
  generatedAt: string;
};

export type Project = {
  id: string;
  createdAt: string;
  name: string;
  originalUrl: string;
  preview?: RenderedAsset;
  final?: RenderedAsset;
  settings: EditSettings;
};

export type AppUser = {
  email: string;
};
