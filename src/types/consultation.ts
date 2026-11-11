export type UnitSystem = "imperial" | "metric";

export type GenderFit = "womenswear" | "menswear" | "androgynous";

export type StyleAesthetic =
  | "quiet-luxury"
  | "minimalist-tailored"
  | "street-editorial"
  | "parisian-classic"
  | "relaxed-coastal";

export type StyleOccasion =
  | "everyday-elevated"
  | "executive-office"
  | "evening-event"
  | "smart-travel"
  | "capsule-reset";

export type BudgetTier = "accessible" | "contemporary" | "luxury";

export type FitPreference = "tailored" | "relaxed" | "structured-oversized";

export interface ExtractedPhotoMetrics {
  dominantColors: string[];
  warmthScore: number; // -100 (cool) to +100 (warm)
  contrastScore: number; // 0 (low) to 100 (high)
  brightnessScore: number; // 0 (deep) to 100 (light)
}

export interface ConsultationRequest {
  imageBase64: string;
  photoMetrics: ExtractedPhotoMetrics;
  unitSystem: UnitSystem;
  heightCm: number;
  weightKg: number;
  genderFit: GenderFit;
  aesthetic: StyleAesthetic;
  occasion: StyleOccasion;
  budget: BudgetTier;
  fitPreference: FitPreference;
  customNotes?: string;
  clientApiKey?: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
  usage: string;
}

export interface AvoidColorSwatch {
  name: string;
  hex: string;
  reason: string;
}

export interface LookbookPiece {
  category: string;
  item: string;
  colorHex: string;
  colorName: string;
  fitNote: string;
  brandSuggestion: string;
}

export interface CuratedOutfit {
  id: string;
  title: string;
  occasionLabel: string;
  vibe: string;
  pieces: LookbookPiece[];
  stylistTip: string;
}

export interface ShoppingItem {
  priority: "Essential" | "Statement" | "Upgrade";
  item: string;
  specification: string;
  estimatedPriceRange: string;
}

export interface HairstyleGridItem {
  id: string;
  name: string;
  category: string;
  lengthAndCut: string;
  styleDescription: string;
  whyItComplements: string;
  recommendedToneHex: string;
  recommendedToneName: string;
  silhouetteVariant: number;
}

export interface ConsultationReport {
  source: "gemini-vision" | "openai-vision" | "atelier-engine";
  generatedAt: string;
  clientTitle: string;
  stylistSummary: string;
  faceShapeSummary: string;
  hairstyleGrid: HairstyleGridItem[];
  metricsAnalysis: {
    heightDisplay: string;
    weightDisplay: string;
    bmi: number;
    bmiCategory: string;
    frameProfile: string;
    verticalRuleOfThirds: string;
    recommendedSizes: {
      tops: string;
      bottomsWaist: string;
      bottomsInseam: string;
      outerwear: string;
      dressOrSuitSize: string;
    };
    tailoringNotes: string[];
  };
  colorAnalysis: {
    season: string;
    undertone: string;
    contrastLevel: string;
    rationale: string;
    powerColors: ColorSwatch[];
    neutrals: ColorSwatch[];
    accentColors: ColorSwatch[];
    colorsToAvoid: AvoidColorSwatch[];
  };
  silhouetteAndFit: {
    keyPrinciples: Array<{
      title: string;
      description: string;
    }>;
    fabricRecommendations: string[];
    necklinesAndCollars: string[];
    trouserAndHemGuide: string;
  };
  curatedLookbook: CuratedOutfit[];
  shoppingChecklist: ShoppingItem[];
}
