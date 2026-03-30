export type PlateOption = "blurred" | "custom" | "none";

export type EditSettings = {
  promptText: string;
  /** Finalde istenen foto sayısı. Her foto 1 kredi harcar. */
  photoCount: number;
  /** Plakayı nasıl ele alalım? */
  plateOption: PlateOption;
  /** Plakada yazacak metin (örn: 34 ABC 1234). */
  plateText: string;
};

export type RenderStage = "preview" | "final";

export type RenderedAsset = {
  url: string;
  stage: RenderStage;
  watermark: boolean;
  generatedAt: string;
  /** Sunucu (Firestore) kalan kredi — Firebase akışında döner */
  creditsRemaining?: number;
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
  uid?: string;
  name?: string;
  photoURL?: string;
};
