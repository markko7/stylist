import {
  ConsultationReport,
  ConsultationRequest,
  ColorSwatch,
  AvoidColorSwatch,
  CuratedOutfit,
  ShoppingItem,
} from "../types/consultation";

export function cmToFtIn(cm: number): { feet: number; inches: number; label: string } {
  const totalInches = cm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches, label: `${feet}'${inches}"` };
}

export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462);
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 21.5;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Fine / Slender Build";
  if (bmi < 22.0) return "Lean / Editorial Build";
  if (bmi < 25.0) return "Balanced / Classic Build";
  if (bmi < 28.5) return "Athletic / Solid Build";
  return "Power / Full-Structured Build";
}

function getFrameProfile(heightCm: number, bmi: number): {
  profile: string;
  verticalStrategy: string;
  inseamInches: number;
} {
  const isPetiteOrCompact = heightCm < 164;
  const isTall = heightCm >= 180;
  const inseamInches = Math.round(((heightCm * 0.45) / 2.54) * 2) / 2;

  if (isPetiteOrCompact) {
    if (bmi < 22.5) {
      return {
        profile: "Compact Linear Silhouette",
        verticalStrategy:
          "Elongate your vertical line using high-waisted trousers (11\"+ rise), monochromatic column layering, and slightly cropped jackets that hit right at the hip bone to create a 1/3 top to 2/3 bottom ratio.",
        inseamInches: Math.max(26, inseamInches - 1),
      };
    }
    return {
      profile: "Compact Structured Proportions",
      verticalStrategy:
        "Prioritize vertical seam lines, open necklines (V-neck, camp collar, or notched lapels), and single-breasted outerwear with a slight taper at the waist to streamline your frame without adding bulk.",
      inseamInches: Math.max(26, inseamInches - 1),
    };
  }

  if (isTall) {
    if (bmi < 22.5) {
      return {
        profile: "Statuesque Elongated Frame",
        verticalStrategy:
          "Leverage your natural vertical presence with horizontal texture contrast, double-breasted blazers, wide-leg trousers with a full break, and layered knitwear that adds visual dimension across the shoulders.",
        inseamInches: Math.min(35, inseamInches + 1),
      };
    }
    return {
      profile: "Architectural Tall Silhouette",
      verticalStrategy:
        "Command rooms with structured shoulders, mid-to-long overcoats, medium-spread collars, and relaxed straight-cut trousers that balance upper-body presence with clean lower-body drape.",
      inseamInches: Math.min(35, inseamInches + 1),
    };
  }

  // Average height (164cm - 179cm)
  if (bmi < 21.5) {
    return {
      profile: "Lean Balanced Frame",
      verticalStrategy:
        "Introduce tactile volume through mid-weight merino, pleated trousers, and structured shoulder seams while maintaining a defined waist to celebrate your natural proportion.",
      inseamInches,
    };
  }
  if (bmi < 25.5) {
    return {
      profile: "Harmonic Classic Proportions",
      verticalStrategy:
        "Follow the classic Rule of Thirds: tuck or half-tuck tops into mid-to-high-rise bottoms, pair relaxed pieces with one sharp tailored anchor, and keep sleeve cuffs hitting precisely at the wrist bone.",
      inseamInches,
    };
  }
  return {
    profile: "Broad / Sculpted Frame",
    verticalStrategy:
      "Opt for fabrics with structured drape (high-twist wool, heavy crepe, gabardine) that skim rather than cling. Unbuttoned outer layers create two vertical framing lines through the torso.",
    inseamInches,
  };
}

function computeRecommendedSizes(
  heightCm: number,
  weightKg: number,
  bmi: number,
  genderFit: ConsultationRequest["genderFit"],
  fitPreference: ConsultationRequest["fitPreference"],
  inseamInches: number
) {
  let sizeIndex = 2; // 0: XS, 1: S, 2: M, 3: L, 4: XL, 5: XXL
  if (bmi < 19 && weightKg < 56) sizeIndex = 0;
  else if (bmi < 21.5 && weightKg < 66) sizeIndex = 1;
  else if (bmi < 24.5 && weightKg < 78) sizeIndex = 2;
  else if (bmi < 27.5 && weightKg < 90) sizeIndex = 3;
  else if (bmi < 31 && weightKg < 104) sizeIndex = 4;
  else sizeIndex = 5;

  if (heightCm > 185 && sizeIndex < 3) sizeIndex += 1;
  if (heightCm < 160 && sizeIndex > 1 && bmi < 23) sizeIndex -= 1;

  const sizeLabels = ["XS", "S", "M", "L", "XL", "XXL"];
  const baseTop = sizeLabels[sizeIndex];
  const relaxedTop = sizeLabels[Math.min(5, sizeIndex + 1)];

  const topRec =
    fitPreference === "structured-oversized"
      ? `${baseTop} (Oversized cut) or size up to ${relaxedTop}`
      : fitPreference === "relaxed"
      ? `${baseTop} (Relaxed block) / ${relaxedTop} (Slim brands)`
      : `${baseTop} (True-to-size tailored fit)`;

  if (genderFit === "womenswear") {
    const usNumeric = ["US 0–2", "US 4–6", "US 6–8", "US 10–12", "US 14–16", "US 16–18"][sizeIndex];
    const waistIn = [24, 26, 28, 30, 33, 36][sizeIndex];
    return {
      tops: topRec,
      bottomsWaist: `W${waistIn}–${waistIn + 1}" (${usNumeric})`,
      bottomsInseam: `${inseamInches}" (Ankle graze) / ${inseamInches + 1.5}" (Full length)`,
      outerwear: `${baseTop} / ${usNumeric} (${heightCm < 163 ? "Petite length recommended" : heightCm > 176 ? "Tall length recommended" : "Regular length"})`,
      dressOrSuitSize: `${usNumeric} (EU ${32 + sizeIndex * 2}–${34 + sizeIndex * 2})`,
    };
  }

  if (genderFit === "menswear") {
    const suitChest = ["36", "38", "40", "42", "44", "46"][sizeIndex];
    const lengthCode = heightCm < 170 ? "S (Short)" : heightCm > 183 ? "L (Long)" : "R (Regular)";
    const waistIn = [28, 30, 32, 34, 36, 38][sizeIndex];
    return {
      tops: topRec,
      bottomsWaist: `W${waistIn}"–${waistIn + 1}"`,
      bottomsInseam: `L${Math.round(inseamInches)}" (No break) / L${Math.round(inseamInches + 1)}" (Half break)`,
      outerwear: `${baseTop} / ${suitChest}${lengthCode}`,
      dressOrSuitSize: `${suitChest}${lengthCode} (EU ${Number(suitChest) + 10})`,
    };
  }

  // Androgynous / Unisex
  const waistIn = [26, 28, 30, 32, 35, 38][sizeIndex];
  const euSize = ["EU 44 / US 2–4", "EU 46 / US 4–6", "EU 48 / US 8–10", "EU 50 / US 10–12", "EU 52 / US 14", "EU 54 / US 16"][sizeIndex];
  return {
    tops: topRec,
    bottomsWaist: `W${waistIn}"–${waistIn + 1}"`,
    bottomsInseam: `${Math.round(inseamInches)}"–${Math.round(inseamInches + 1)}"`,
    outerwear: `${baseTop} Unisex Block (${heightCm < 165 ? "Cropped/Short" : heightCm > 180 ? "Longline" : "Standard"})`,
    dressOrSuitSize: euSize,
  };
}

function analyzeColorSeason(metrics: ConsultationRequest["photoMetrics"]): {
  season: string;
  undertone: string;
  contrastLevel: string;
  rationale: string;
  powerColors: ColorSwatch[];
  neutrals: ColorSwatch[];
  accentColors: ColorSwatch[];
  colorsToAvoid: AvoidColorSwatch[];
} {
  const { warmthScore, contrastScore, brightnessScore } = metrics;
  const isWarm = warmthScore >= 0;
  const isHighContrast = contrastScore >= 52;
  const isLight = brightnessScore >= 55;

  if (isWarm && !isLight) {
    // Deep Autumn
    return {
      season: "Deep Autumn (Rich Warmth)",
      undertone: "Warm Golden-Bronze Undertone",
      contrastLevel: isHighContrast ? "Medium-High Dimensional Contrast" : "Rich Medium-Depth Contrast",
      rationale:
        "Your photo analysis indicates rich warmth balanced with grounded depth. Earthy, saturated pigments with golden or olive undertones harmonize naturally with your features and prevent washed-out cast.",
      powerColors: [
        { name: "Burnished Terracotta", hex: "#A84A32", usage: "Statement knitwear, silk shirts, and structured blazers" },
        { name: "Forest Cypress", hex: "#234233", usage: "Tailored outerwear, monochrome suiting, and leather goods" },
        { name: "Oxblood Bordeaux", hex: "#5E1D24", usage: "Evening wear, scarves, and footwear accents" },
      ],
      neutrals: [
        { name: "Espresso Roast", hex: "#2E221D", usage: "Superior replacement for stark jet black" },
        { name: "Warm Camel", hex: "#C19A6B", usage: "Overcoats, pleated trousers, and cashmere layers" },
        { name: "Oyster Cream", hex: "#EDE6D6", usage: "Shirting and base tees instead of optic white" },
      ],
      accentColors: [
        { name: "Antique Brass", hex: "#B8860B", usage: "Jewelry, belt hardware, and watch bezels" },
        { name: "Spiced Ochre", hex: "#CC7722", usage: "Pocket squares, knit ties, or bag details" },
      ],
      colorsToAvoid: [
        { name: "Icy Pastel Pink", hex: "#F2D4E6", reason: "Clashes with warm undertones and dulls natural skin luminosity" },
        { name: "Neon Electric Blue", hex: "#00E5FF", reason: "Overpowers your natural depth with synthetic coolness" },
      ],
    };
  }

  if (isWarm && isLight) {
    // Warm / True Spring
    return {
      season: "Luminous Warm Spring",
      undertone: "Warm Peach & Ivory-Gold Undertone",
      contrastLevel: "Fresh Medium-Light Contrast",
      rationale:
        "Your image profile shows high luminosity paired with warm golden undertones. Fresh, sun-lit colors and warm ivory neutrals illuminate your complexion without weighing down your frame.",
      powerColors: [
        { name: "Warm Cobalt", hex: "#2B5B84", usage: "Daytime suiting, linen shirts, and lightweight jackets" },
        { name: "Sunlit Coral Terracotta", hex: "#D96B43", usage: "Resort wear, knit polos, and statement tops" },
        { name: "Sage Olive", hex: "#6B7F5E", usage: "Utility jackets, chinos, and tailored separates" },
      ],
      neutrals: [
        { name: "Warm Alabaster", hex: "#F5EFE6", usage: "Crisp shirting, summer trousers, and knitwear" },
        { name: "Toasted Almond", hex: "#C8AD8D", usage: "Trench coats, loafers, and relaxed blazers" },
        { name: "Warm Navy", hex: "#23364C", usage: "Core suiting and grounding trousers" },
      ],
      accentColors: [
        { name: "Champagne Gold", hex: "#D4AF37", usage: "Fine jewelry, eyewear frames, and buckles" },
        { name: "Pistachio Leaf", hex: "#93B57B", usage: "Silk scarves and seasonal layering" },
      ],
      colorsToAvoid: [
        { name: "Pitch Black Near Face", hex: "#0A0A0A", reason: "Creates harsh shadows under the jawline; swap for Warm Navy or Espresso" },
        { name: "Muted Ash Grey", hex: "#7E848C", reason: "Drains warmth from the complexion" },
      ],
    };
  }

  if (!isWarm && isHighContrast) {
    // Clear / Deep Winter
    return {
      season: "Architectural Winter (Cool & Crisp)",
      undertone: "Cool Olive / Rose-Neutral Undertone",
      contrastLevel: "High Architectural Contrast",
      rationale:
        "Your image profile reveals crisp contrast and cool-neutral undertones. High-definition, saturated cool tones and sharp monochromatic pairings frame your features with editorial precision.",
      powerColors: [
        { name: "Midnight Sapphire", hex: "#14284B", usage: "Sharp blazers, evening wear, and fine merino knits" },
        { name: "Deep Emerald", hex: "#124E3F", usage: "Statement outerwear, silk pieces, and knitwear" },
        { name: "Crimson Berry", hex: "#7A1C32", usage: "Accent layering, evening pieces, and structured tops" },
      ],
      neutrals: [
        { name: "Obsidian Black", hex: "#141416", usage: "Core monochrome base, leather jackets, and tailoring" },
        { name: "Charcoal Slate", hex: "#373B42", usage: "Flannel trousers, structured coats, and knitwear" },
        { name: "Optic Bone White", hex: "#F7F8FA", usage: "Poplin shirts and high-contrast tee layering" },
      ],
      accentColors: [
        { name: "Brushed Platinum", hex: "#C0C5CE", usage: "Watches, eyewear, and jewelry hardware" },
        { name: "Icy Cobalt", hex: "#3B6EE8", usage: "Subtle collar or accessory pop" },
      ],
      colorsToAvoid: [
        { name: "Mustard Yellow", hex: "#C89D28", reason: "Creates a sallow cast against cool-toned skin" },
        { name: "Dusty Orange-Brown", hex: "#B0653B", reason: "Muddies your crisp natural contrast" },
      ],
    };
  }

  // Cool / Soft Summer
  return {
    season: "Cool Tailored Summer",
    undertone: "Cool Neutral-Rose Undertone",
    contrastLevel: "Refined Low-to-Medium Contrast",
    rationale:
      "Your image shows harmonious, blended tonal transitions with cool undertones. Tonal layering in slate blues, eucalyptus greens, taupe, and soft charcoal looks effortlessly sophisticated on you.",
    powerColors: [
      { name: "Mineral Slate Blue", hex: "#4A647D", usage: "Shirting, unlined blazers, and cashmere crewnecks" },
      { name: "Eucalyptus Sage", hex: "#5C766D", usage: "Trousers, dresses, and lightweight outerwear" },
      { name: "Plum Aubergine", hex: "#4E3145", usage: "Evening tailoring and elevated knitwear" },
    ],
    neutrals: [
      { name: "Cool Greige / Taupe", hex: "#9E958E", usage: "Trench coats, pleated trousers, and suede footwear" },
      { name: "Graphite Charcoal", hex: "#3E424B", usage: "Softer, more flattering alternative to harsh black" },
      { name: "Soft Pearl", hex: "#F0EFEA", usage: "Silk blouses, linen shirts, and base layers" },
    ],
    accentColors: [
      { name: "Burnished Silver", hex: "#A8B0B8", usage: "Minimalist watches, cuffs, and eyewear" },
      { name: "Dusty Rose Rosewood", hex: "#9E6B72", usage: "Tonal accessories and knit textures" },
    ],
    colorsToAvoid: [
      { name: "Blazing Tangerine", hex: "#FF6600", reason: "Overwhelms delicate tonal balance" },
      { name: "Stark Jet Black + Optic White", hex: "#000000", reason: "Too harsh; replace with Graphite + Soft Pearl" },
    ],
  };
}

function getBrandSuggestions(budget: ConsultationRequest["budget"], aesthetic: ConsultationRequest["aesthetic"]) {
  if (budget === "luxury") {
    if (aesthetic === "street-editorial") return ["Acne Studios", "Lemaire", "Dries Van Noten", "Bottega Veneta"];
    if (aesthetic === "parisian-classic") return ["Celine", "Saint Laurent", "Isabel Marant", "Ami Paris"];
    return ["The Row", "Loro Piana", "Brunello Cucinelli", "Totême"];
  }
  if (budget === "contemporary") {
    if (aesthetic === "street-editorial") return ["Our Legacy", "Studio Nicholson", "A.P.C.", "Norse Projects"];
    if (aesthetic === "parisian-classic") return ["Sézane", "Sandro", "Officine Générale", "De Bonne Facture"];
    return ["COS", "Theory", "SuitSupply", "Massimo Dutti Studio"];
  }
  // Accessible
  return ["UNIQLO U", "ARKET", "Abercrombie Tailored", "Mango Selection"];
}

export function generateAtelierConsultation(req: ConsultationRequest): ConsultationReport {
  const bmi = calculateBmi(req.heightCm, req.weightKg);
  const bmiCategory = getBmiCategory(bmi);
  const { feet, inches, label: ftInLabel } = cmToFtIn(req.heightCm);
  const lbs = kgToLbs(req.weightKg);

  const heightDisplay =
    req.unitSystem === "imperial"
      ? `${ftInLabel} (${req.heightCm} cm)`
      : `${req.heightCm} cm (${feet}'${inches}")`;
  const weightDisplay =
    req.unitSystem === "imperial"
      ? `${lbs} lbs (${req.weightKg} kg)`
      : `${req.weightKg} kg (${lbs} lbs)`;

  const { profile: frameProfile, verticalStrategy, inseamInches } = getFrameProfile(
    req.heightCm,
    bmi
  );
  const recommendedSizes = computeRecommendedSizes(
    req.heightCm,
    req.weightKg,
    bmi,
    req.genderFit,
    req.fitPreference,
    inseamInches
  );

  const colorAnalysis = analyzeColorSeason(req.photoMetrics);
  const brands = getBrandSuggestions(req.budget, req.aesthetic);

  const aestheticLabels: Record<ConsultationRequest["aesthetic"], string> = {
    "quiet-luxury": "Quiet Luxury & Tactile Minimalism",
    "minimalist-tailored": "Architectural Minimalist Tailoring",
    "street-editorial": "Contemporary Street Editorial",
    "parisian-classic": "Effortless Parisian Chic",
    "relaxed-coastal": "Refined Coastal Sartorial",
  };

  const occasionLabels: Record<ConsultationRequest["occasion"], string> = {
    "everyday-elevated": "Elevated Daily Uniform",
    "executive-office": "Executive & Boardroom Presence",
    "evening-event": "Evening & Gallery Social",
    "smart-travel": "First-Class Transit & Travel",
    "capsule-reset": "360° Seasonal Capsule Wardrobe",
  };

  const tailoringNotes: string[] = [
    req.heightCm < 166
      ? `Ask your tailor for a zero-to-quarter break on trousers (${inseamInches}" inseam) so fabric never pools at the ankle.`
      : req.heightCm > 181
      ? `Request a 1.5" cuff on wide or straight trousers (${inseamInches}" inseam) to anchor your long leg line with intentional weight.`
      : `Hem trousers to a clean quarter-break (${inseamInches}" inseam) that skims the top of your footwear.`,
    bmi >= 25
      ? "Choose single-breasted jackets with a slightly suppressed waist and structured shoulder pads to create a sharp V-taper."
      : "Incorporate textured weaves (bouclé, brushed wool, heavy twill, or ribbed merino) to add three-dimensional presence to your frame.",
    `Sleeve length should terminate exactly at the ulna wrist bone, showing 1/4" to 1/2" of shirt cuff when wearing a jacket.`,
  ];

  const p0 = colorAnalysis.powerColors[0];
  const p1 = colorAnalysis.powerColors[1];
  const n0 = colorAnalysis.neutrals[0];
  const n1 = colorAnalysis.neutrals[1];
  const n2 = colorAnalysis.neutrals[2];
  const a0 = colorAnalysis.accentColors[0];

  const curatedLookbook: CuratedOutfit[] = [
    {
      id: "look-1",
      title: `The ${aestheticLabels[req.aesthetic].split(" ")[0]} Signature Uniform`,
      occasionLabel: occasionLabels[req.occasion],
      vibe: "High-proportion daily authority with tonal depth",
      pieces: [
        {
          category: "Outer Layer",
          item:
            req.genderFit === "womenswear"
              ? "Single-Breasted Tailored Wool Blazer"
              : "Unstructured Double-Faced Wool Chore / Blazer",
          colorHex: n0.hex,
          colorName: n0.name,
          fitNote: `Size ${recommendedSizes.outerwear.split(" ")[0]} — hits just below hip bone to preserve 1/3 to 2/3 vertical ratio`,
          brandSuggestion: brands[0],
        },
        {
          category: "Base Top",
          item: "Fine-Gauge Merino Mock-Neck or Crisp Poplin Shirt",
          colorHex: n2.hex,
          colorName: n2.name,
          fitNote: `Full tuck into trouser waist to highlight torso-to-leg transition`,
          brandSuggestion: brands[1],
        },
        {
          category: "Trousers",
          item: "High-Twist Pleated Straight-Leg Trouser",
          colorHex: n1.hex,
          colorName: n1.name,
          fitNote: `Waist ${recommendedSizes.bottomsWaist.split(" ")[0]}, hemmed to ${inseamInches}"`,
          brandSuggestion: brands[2],
        },
        {
          category: "Footwear & Hardware",
          item: "Almond-Toe Leather Loafer + Minimalist Belt",
          colorHex: a0.hex,
          colorName: a0.name,
          fitNote: "Match leather undertone to your belt and watch strap",
          brandSuggestion: brands[3],
        },
      ],
      stylistTip: `By pairing ${n0.name} outerwear open over a tucked ${n2.name} base, you create a narrow bright vertical column down the center of your frame.`,
    },
    {
      id: "look-2",
      title: "Monochromatic Power Statement",
      occasionLabel: "Client Dinner / Evening Creative",
      vibe: `Rich ${colorAnalysis.season} palette with architectural lines`,
      pieces: [
        {
          category: "Statement Piece",
          item:
            req.genderFit === "womenswear"
              ? "Draped Silk-Blend Blouse or Structured Knit Dress"
              : "Relaxed Silk-Cotton Camp Collar Shirt + Tailored Jacket",
          colorHex: p0.hex,
          colorName: p0.name,
          fitNote: "Placed directly near the face to amplify skin clarity and eye contrast",
          brandSuggestion: brands[1],
        },
        {
          category: "Bottoms",
          item: "Tailored Tapered Wool-Crepe Trouser",
          colorHex: n0.hex,
          colorName: n0.name,
          fitNote: `High-to-mid rise (${recommendedSizes.bottomsWaist}) with clean front crease`,
          brandSuggestion: brands[0],
        },
        {
          category: "Accent Layer",
          item: "Cashmere Shoulder Wrap or Textured Overcoat",
          colorHex: p1.hex,
          colorName: p1.name,
          fitNote: "Draped effortlessly for tonal depth without bulk",
          brandSuggestion: brands[2],
        },
      ],
      stylistTip: `${p0.name} is your highest-impact power color—wearing it near your collarbone immediately draws focus upward to your face.`,
    },
    {
      id: "look-3",
      title: "Off-Duty Architectural Weekend",
      occasionLabel: "Weekend Gallery, Travel & Espresso",
      vibe: "Relaxed volume anchored by clean tailoring",
      pieces: [
        {
          category: "Knitwear / Overshirt",
          item: "Ribbed Fisherman Knit or Heavy Twill Overshirt",
          colorHex: p1.hex,
          colorName: p1.name,
          fitNote: `Size ${recommendedSizes.tops.split(" ")[0]} — structured shoulder seam`,
          brandSuggestion: brands[2],
        },
        {
          category: "Trouser / Denim",
          item: "Raw Ecru / Selvedge Straight-Column Denim",
          colorHex: n2.hex,
          colorName: n2.name,
          fitNote: `Straight leg cylinder balances upper body proportion`,
          brandSuggestion: brands[3],
        },
        {
          category: "Footwear",
          item: "Suede Chelsea Boot or Low-Profile Court Sneaker",
          colorHex: n1.hex,
          colorName: n1.name,
          fitNote: "Tonal sole keeps the lower silhouette uninterrupted",
          brandSuggestion: brands[0],
        },
      ],
      stylistTip:
        "Never pair oversized tops with baggy puddling bottoms at the same time—keep one half structured so the silhouette looks intentional.",
    },
  ];

  const priceRanges: Record<ConsultationRequest["budget"], [string, string, string]> = {
    accessible: ["$70 – $140", "$50 – $95", "$110 – $190"],
    contemporary: ["$240 – $480", "$150 – $260", "$350 – $650"],
    luxury: ["$950 – $2,200", "$450 – $890", "$1,200 – $2,800"],
  };

  const shoppingChecklist: ShoppingItem[] = [
    {
      priority: "Essential",
      item: `High-Twist Pleated Trousers in ${n0.name}`,
      specification: `Size ${recommendedSizes.bottomsWaist}, tailored to a ${inseamInches}" inseam with a clean front press.`,
      estimatedPriceRange: priceRanges[req.budget][0],
    },
    {
      priority: "Essential",
      item: `Fine-Gauge Merino Knit in ${p0.name}`,
      specification: `Size ${recommendedSizes.tops.split(" ")[0]} — worn next to face to activate your ${colorAnalysis.season} undertone.`,
      estimatedPriceRange: priceRanges[req.budget][1],
    },
    {
      priority: "Statement",
      item: `Architectural Blazer / Coat in ${n1.name}`,
      specification: `Size ${recommendedSizes.outerwear} — ${req.fitPreference === "tailored" ? "structured shoulder with nipped waist" : "relaxed drop-shoulder with crisp lapel"}.`,
      estimatedPriceRange: priceRanges[req.budget][2],
    },
    {
      priority: "Upgrade",
      item: `220gsm Supima / Poplin Base Layers in ${n2.name}`,
      specification: `Replace stark optic white tees/shirts with ${n2.name} (${n2.hex}) for superior skin harmony.`,
      estimatedPriceRange: priceRanges[req.budget][1],
    },
  ];

  return {
    source: "atelier-engine",
    generatedAt: new Date().toISOString(),
    clientTitle: `${aestheticLabels[req.aesthetic]} Dossier`,
    stylistSummary: `Designed for a ${heightDisplay}, ${weightDisplay} (${frameProfile}) profile seeking ${aestheticLabels[req.aesthetic]} for ${occasionLabels[req.occasion]}. Your photo luminance and undertone profile aligns with ${colorAnalysis.season}, favoring ${p0.name} and ${n0.name} paired with ${req.fitPreference} proportions that honor the vertical Rule of Thirds.`,
    metricsAnalysis: {
      heightDisplay,
      weightDisplay,
      bmi,
      bmiCategory,
      frameProfile,
      verticalRuleOfThirds: verticalStrategy,
      recommendedSizes,
      tailoringNotes,
    },
    colorAnalysis,
    silhouetteAndFit: {
      keyPrinciples: [
        {
          title: "The 1/3 to 2/3 Vertical Ratio",
          description: verticalStrategy,
        },
        {
          title: "Shoulder Seam & Chest Drape",
          description:
            bmi < 22
              ? "Select jackets with subtle roped or structured shoulders and double-pocket detailing to expand chest presence."
              : "Choose softly constructed Neapolitan shoulders and low-gorge notched lapels that elongate the neck and streamline the torso.",
        },
        {
          title: "Tonal Column Continuity",
          description: `Wearing ${n0.name} or ${n1.name} in a continuous top-to-bottom column adds 2–3 inches of visual height while letting statement outerwear take center stage.`,
        },
      ],
      fabricRecommendations:
        bmi < 23
          ? [
              "Heavyweight 240gsm+ combed cotton",
              "Brushed Shetland & ribbed merino wool",
              "Structured cavalry twill & corduroy",
              "Double-faced wool-cashmere",
            ]
          : [
              "High-twist tropical wool (drapes cleanly without clinging)",
              "Matte silk-crepe & Tencel-linen blends",
              "Fine-gauge 14gg merino knitwear",
              "Unlined wool gabardine",
            ],
      necklinesAndCollars:
        req.heightCm < 168 || bmi >= 25
          ? [
              "Open camp collars & V-necklines to elongate the neck",
              "Medium-spread shirt collars with hidden button-downs",
              "Low-buttoning 2-button notched lapels",
            ]
          : [
              "Mock-neck and turtleneck layering under blazers",
              "Cutaway and classic point collars",
              "Peak lapels and double-breasted closures",
            ],
      trouserAndHemGuide: `Target a ${inseamInches}" inseam with a mid-to-high rise (${recommendedSizes.bottomsWaist}). Avoid skinny-tapered cuts that pinch at the calf; a straight or gently tapered leg opening (7.5"–8.5") creates a continuous vertical line from hip to shoe.`,
    },
    curatedLookbook,
    shoppingChecklist,
  };
}

export interface AIEnvConfig {
  openAiApiKey?: string;
  openAiModel?: string;
  geminiApiKey?: string;
}

function mergeReportWithOverrides(
  baseReport: ConsultationReport,
  parsed: Record<string, unknown>,
  source: ConsultationReport["source"]
): ConsultationReport {
  const parsedMetrics =
    parsed.metricsAnalysis && typeof parsed.metricsAnalysis === "object"
      ? (parsed.metricsAnalysis as Record<string, unknown>)
      : {};
  const parsedSizes =
    parsedMetrics.recommendedSizes &&
    typeof parsedMetrics.recommendedSizes === "object"
      ? (parsedMetrics.recommendedSizes as Record<string, unknown>)
      : {};
  const parsedColor =
    parsed.colorAnalysis && typeof parsed.colorAnalysis === "object"
      ? (parsed.colorAnalysis as Record<string, unknown>)
      : {};
  const parsedSilhouette =
    parsed.silhouetteAndFit && typeof parsed.silhouetteAndFit === "object"
      ? (parsed.silhouetteAndFit as Record<string, unknown>)
      : {};

  const tailoringNotes =
    Array.isArray(parsed.tailoringNotes) && parsed.tailoringNotes.length > 0
      ? (parsed.tailoringNotes as string[])
      : Array.isArray(parsedMetrics.tailoringNotes) &&
        parsedMetrics.tailoringNotes.length > 0
      ? (parsedMetrics.tailoringNotes as string[])
      : baseReport.metricsAnalysis.tailoringNotes;

  return {
    ...baseReport,
    source,
    clientTitle:
      typeof parsed.clientTitle === "string" && parsed.clientTitle.trim()
        ? parsed.clientTitle
        : baseReport.clientTitle,
    stylistSummary:
      typeof parsed.stylistSummary === "string" && parsed.stylistSummary.trim()
        ? parsed.stylistSummary
        : baseReport.stylistSummary,
    metricsAnalysis: {
      ...baseReport.metricsAnalysis,
      frameProfile:
        typeof parsedMetrics.frameProfile === "string" &&
        parsedMetrics.frameProfile.trim()
          ? parsedMetrics.frameProfile
          : baseReport.metricsAnalysis.frameProfile,
      verticalRuleOfThirds:
        typeof parsedMetrics.verticalRuleOfThirds === "string" &&
        parsedMetrics.verticalRuleOfThirds.trim()
          ? parsedMetrics.verticalRuleOfThirds
          : baseReport.metricsAnalysis.verticalRuleOfThirds,
      recommendedSizes: {
        tops:
          typeof parsedSizes.tops === "string" && parsedSizes.tops.trim()
            ? parsedSizes.tops
            : baseReport.metricsAnalysis.recommendedSizes.tops,
        bottomsWaist:
          typeof parsedSizes.bottomsWaist === "string" &&
          parsedSizes.bottomsWaist.trim()
            ? parsedSizes.bottomsWaist
            : baseReport.metricsAnalysis.recommendedSizes.bottomsWaist,
        bottomsInseam:
          typeof parsedSizes.bottomsInseam === "string" &&
          parsedSizes.bottomsInseam.trim()
            ? parsedSizes.bottomsInseam
            : baseReport.metricsAnalysis.recommendedSizes.bottomsInseam,
        outerwear:
          typeof parsedSizes.outerwear === "string" &&
          parsedSizes.outerwear.trim()
            ? parsedSizes.outerwear
            : baseReport.metricsAnalysis.recommendedSizes.outerwear,
        dressOrSuitSize:
          typeof parsedSizes.dressOrSuitSize === "string" &&
          parsedSizes.dressOrSuitSize.trim()
            ? parsedSizes.dressOrSuitSize
            : baseReport.metricsAnalysis.recommendedSizes.dressOrSuitSize,
      },
      tailoringNotes,
    },
    colorAnalysis: {
      ...baseReport.colorAnalysis,
      season:
        typeof parsed.season === "string" && parsed.season.trim()
          ? parsed.season
          : typeof parsedColor.season === "string" && parsedColor.season.trim()
          ? parsedColor.season
          : baseReport.colorAnalysis.season,
      undertone:
        typeof parsed.undertone === "string" && parsed.undertone.trim()
          ? parsed.undertone
          : typeof parsedColor.undertone === "string" &&
            parsedColor.undertone.trim()
          ? parsedColor.undertone
          : baseReport.colorAnalysis.undertone,
      contrastLevel:
        typeof parsedColor.contrastLevel === "string" &&
        parsedColor.contrastLevel.trim()
          ? parsedColor.contrastLevel
          : baseReport.colorAnalysis.contrastLevel,
      rationale:
        typeof parsed.rationale === "string" && parsed.rationale.trim()
          ? parsed.rationale
          : typeof parsedColor.rationale === "string" &&
            parsedColor.rationale.trim()
          ? parsedColor.rationale
          : baseReport.colorAnalysis.rationale,
      powerColors:
        Array.isArray(parsedColor.powerColors) &&
        parsedColor.powerColors.length > 0
          ? (parsedColor.powerColors as ColorSwatch[])
          : baseReport.colorAnalysis.powerColors,
      neutrals:
        Array.isArray(parsedColor.neutrals) && parsedColor.neutrals.length > 0
          ? (parsedColor.neutrals as ColorSwatch[])
          : baseReport.colorAnalysis.neutrals,
      accentColors:
        Array.isArray(parsedColor.accentColors) &&
        parsedColor.accentColors.length > 0
          ? (parsedColor.accentColors as ColorSwatch[])
          : baseReport.colorAnalysis.accentColors,
      colorsToAvoid:
        Array.isArray(parsedColor.colorsToAvoid) &&
        parsedColor.colorsToAvoid.length > 0
          ? (parsedColor.colorsToAvoid as AvoidColorSwatch[])
          : baseReport.colorAnalysis.colorsToAvoid,
    },
    silhouetteAndFit: {
      ...baseReport.silhouetteAndFit,
      keyPrinciples:
        Array.isArray(parsedSilhouette.keyPrinciples) &&
        parsedSilhouette.keyPrinciples.length > 0
          ? (parsedSilhouette.keyPrinciples as Array<{
              title: string;
              description: string;
            }>)
          : baseReport.silhouetteAndFit.keyPrinciples,
      fabricRecommendations:
        Array.isArray(parsedSilhouette.fabricRecommendations) &&
        parsedSilhouette.fabricRecommendations.length > 0
          ? (parsedSilhouette.fabricRecommendations as string[])
          : baseReport.silhouetteAndFit.fabricRecommendations,
      necklinesAndCollars:
        Array.isArray(parsedSilhouette.necklinesAndCollars) &&
        parsedSilhouette.necklinesAndCollars.length > 0
          ? (parsedSilhouette.necklinesAndCollars as string[])
          : baseReport.silhouetteAndFit.necklinesAndCollars,
      trouserAndHemGuide:
        typeof parsedSilhouette.trouserAndHemGuide === "string" &&
        parsedSilhouette.trouserAndHemGuide.trim()
          ? parsedSilhouette.trouserAndHemGuide
          : baseReport.silhouetteAndFit.trouserAndHemGuide,
    },
    curatedLookbook:
      Array.isArray(parsed.curatedLookbook) &&
      parsed.curatedLookbook.length > 0
        ? (parsed.curatedLookbook as CuratedOutfit[])
        : baseReport.curatedLookbook,
    shoppingChecklist:
      Array.isArray(parsed.shoppingChecklist) &&
      parsed.shoppingChecklist.length > 0
        ? (parsed.shoppingChecklist as ShoppingItem[])
        : baseReport.shoppingChecklist,
  };
}

export async function generateConsultationWithOptionalAI(
  req: ConsultationRequest,
  envConfig?: AIEnvConfig
): Promise<ConsultationReport> {
  const baseReport = generateAtelierConsultation(req);

  const envOpenAiKey =
    envConfig?.openAiApiKey ||
    (typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : undefined);
  const envGeminiKey =
    envConfig?.geminiApiKey ||
    (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);

  const openAiKey = req.clientApiKey?.trim().startsWith("sk-")
    ? req.clientApiKey.trim()
    : envOpenAiKey;
  const geminiKey = req.clientApiKey?.trim().startsWith("AIza")
    ? req.clientApiKey.trim()
    : envGeminiKey;

  if (!openAiKey && !geminiKey) {
    return baseReport;
  }

  const systemPrompt = `You are ATELIER VERA, an elite personal stylist and anthropometric wardrobe consultant.
A client has submitted their photo and body metrics:
- Height: ${baseReport.metricsAnalysis.heightDisplay} (${req.heightCm} cm)
- Weight: ${baseReport.metricsAnalysis.weightDisplay} (${req.weightKg} kg), BMI: ${baseReport.metricsAnalysis.bmi}
- Tailoring Block: ${req.genderFit}
- Signature Aesthetic: ${req.aesthetic}
- Primary Occasion: ${req.occasion}
- Budget Tier: ${req.budget}
- Fit Preference: ${req.fitPreference}
- Client Notes: ${req.customNotes || "None"}
- Extracted Photo Pigments: ${req.photoMetrics.dominantColors.join(", ")} (Warmth: ${req.photoMetrics.warmthScore}, Contrast: ${req.photoMetrics.contrastScore}/100, Luminance: ${req.photoMetrics.brightnessScore}/100)

Analyze the client's photo, complexion, proportions, and style preferences. Return ONLY valid JSON with bespoke styling recommendations matching this exact structure:
{
  "clientTitle": "Editorial title for this client's style dossier",
  "stylistSummary": "2-3 sentence bespoke assessment of their visual proportions, complexion harmony, and sartorial direction",
  "metricsAnalysis": {
    "frameProfile": "Concise architectural frame classification",
    "verticalRuleOfThirds": "1-2 sentence rule-of-thirds proportion advice for their exact height and weight",
    "tailoringNotes": ["3 specific alterations or tailoring instructions calibrated to their height and weight"]
  },
  "colorAnalysis": {
    "season": "Specific 12-season color palette name",
    "undertone": "Detected skin/hair/eye undertone description",
    "contrastLevel": "Detected contrast level description",
    "rationale": "2 sentence explanation of why this color palette flatters the client"
  },
  "silhouetteAndFit": {
    "trouserAndHemGuide": "Specific trouser rise, leg opening, and hem break instructions for their height"
  }
}`;

  try {
    if (openAiKey) {
      const model = envConfig?.openAiModel || "gpt-4o-mini";
      const isSupportedRasterImage =
        /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(req.imageBase64);

      const userContent: Array<Record<string, unknown>> = [
        {
          type: "text",
          text: "Generate the personalized ATELIER VERA style consulting report in JSON for this client.",
        },
      ];

      if (isSupportedRasterImage) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: req.imageBase64,
            detail: "low",
          },
        });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const rawText = data?.choices?.[0]?.message?.content;
        if (rawText) {
          const parsed = JSON.parse(rawText) as Record<string, unknown>;
          return mergeReportWithOverrides(baseReport, parsed, "openai-vision");
        }
      }
    } else if (geminiKey) {
      const base64Data = req.imageBase64.replace(/^data:image\/[\w+]+;base64,/, "");
      const mimeMatch = req.imageBase64.match(/^data:(image\/[\w+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  ...(mimeType !== "image/svg+xml"
                    ? [
                        {
                          inline_data: {
                            mime_type: mimeType,
                            data: base64Data,
                          },
                        },
                      ]
                    : []),
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as Record<string, unknown>;
          return mergeReportWithOverrides(baseReport, parsed, "gemini-vision");
        }
      }
    }
  } catch (err) {
    console.warn("AI Vision fallback triggered:", err);
  }

  return baseReport;
}
