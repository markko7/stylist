import {
  ExtractedPhotoMetrics,
  GenderFit,
  StyleAesthetic,
  StyleOccasion,
} from "@/types/consultation";

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export async function analyzeUploadedPhoto(
  fileOrDataUrl: File | string
): Promise<{
  dataUrl: string;
  metrics: ExtractedPhotoMetrics;
}> {
  const dataUrl =
    typeof fileOrDataUrl === "string"
      ? fileOrDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.readAsDataURL(fileOrDataUrl);
        });

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 640;
      const scale = Math.min(1, maxDim / Math.max(img.width || 640, img.height || 640));
      const w = Math.max(64, Math.round((img.width || 400) * scale));
      const h = Math.max(64, Math.round((img.height || 500) * scale));
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({
          dataUrl,
          metrics: {
            dominantColors: ["#2E221D", "#C19A6B", "#EDE6D6", "#A84A32"],
            warmthScore: 15,
            contrastScore: 55,
            brightnessScore: 50,
          },
        });
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.84);

      // Sample 4 regions (upper center face/hair zone, mid torso, upper-left, lower-center)
      const regions = [
        { x: Math.floor(w * 0.35), y: Math.floor(h * 0.18), rw: Math.floor(w * 0.3), rh: Math.floor(h * 0.22) },
        { x: Math.floor(w * 0.3), y: Math.floor(h * 0.42), rw: Math.floor(w * 0.4), rh: Math.floor(h * 0.25) },
        { x: Math.floor(w * 0.25), y: Math.floor(h * 0.08), rw: Math.floor(w * 0.5), rh: Math.floor(h * 0.12) },
        { x: Math.floor(w * 0.3), y: Math.floor(h * 0.68), rw: Math.floor(w * 0.4), rh: Math.floor(h * 0.2) },
      ];

      const dominantColors: string[] = [];
      let totalWarmth = 0;
      const luminances: number[] = [];

      for (const reg of regions) {
        const imageData = ctx.getImageData(
          Math.max(0, reg.x),
          Math.max(0, reg.y),
          Math.max(1, reg.rw),
          Math.max(1, reg.rh)
        ).data;

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;

        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          luminances.push(lum);
        }

        if (count > 0) {
          const rAvg = rSum / count;
          const gAvg = gSum / count;
          const bAvg = bSum / count;
          dominantColors.push(rgbToHex(rAvg, gAvg, bAvg));
          totalWarmth += (rAvg - bAvg) * 0.65 + (gAvg - bAvg) * 0.2;
        }
      }

      const avgLuminance =
        luminances.reduce((acc, v) => acc + v, 0) / Math.max(1, luminances.length);
      const variance =
        luminances.reduce((acc, v) => acc + Math.pow(v - avgLuminance, 2), 0) /
        Math.max(1, luminances.length);
      const stdDev = Math.sqrt(variance);

      const warmthScore = Math.max(-100, Math.min(100, Math.round(totalWarmth / 4)));
      const contrastScore = Math.max(15, Math.min(95, Math.round((stdDev / 75) * 100)));
      const brightnessScore = Math.max(10, Math.min(95, Math.round((avgLuminance / 255) * 100)));

      resolve({
        dataUrl: compressedDataUrl,
        metrics: {
          dominantColors:
            dominantColors.length === 4
              ? dominantColors
              : ["#2E221D", "#C19A6B", "#EDE6D6", "#A84A32"],
          warmthScore,
          contrastScore,
          brightnessScore,
        },
      });
    };

    img.onerror = () => {
      resolve({
        dataUrl,
        metrics: {
          dominantColors: ["#2E221D", "#C19A6B", "#EDE6D6", "#A84A32"],
          warmthScore: 15,
          contrastScore: 55,
          brightnessScore: 50,
        },
      });
    };

    img.src = dataUrl;
  });
}

export interface DemoPreset {
  id: string;
  name: string;
  subtitle: string;
  heightCm: number;
  weightKg: number;
  genderFit: GenderFit;
  aesthetic: StyleAesthetic;
  occasion: StyleOccasion;
  svgDataUrl: string;
  metrics: ExtractedPhotoMetrics;
}

function makePortraitSvgDataUrl(
  bgHex: string,
  haloHex: string,
  hairHex: string,
  skinHex: string,
  garmentHex: string,
  label: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600" width="480" height="600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="${haloHex}" />
      </linearGradient>
    </defs>
    <rect width="480" height="600" fill="url(#bg)" />
    <circle cx="240" cy="210" r="145" fill="${haloHex}" opacity="0.45" />
    <!-- Hair back -->
    <path d="M150 190 C150 105, 330 105, 330 190 L340 310 L140 310 Z" fill="${hairHex}" />
    <!-- Shoulders / Garment -->
    <path d="M75 600 C85 430, 155 390, 240 390 C325 390, 395 430, 405 600 Z" fill="${garmentHex}" />
    <!-- Lapel lines -->
    <path d="M195 392 L240 495 L285 392" fill="none" stroke="${bgHex}" stroke-width="4" opacity="0.45" />
    <!-- Neck -->
    <rect x="212" y="305" width="56" height="98" rx="24" fill="${skinHex}" />
    <!-- Head -->
    <ellipse cx="240" cy="225" rx="68" ry="86" fill="${skinHex}" />
    <!-- Hair top silhouette -->
    <path d="M170 205 C175 125, 305 125, 310 205 C290 165, 200 165, 170 205 Z" fill="${hairHex}" />
    <!-- Editorial framing lines -->
    <rect x="24" y="24" width="432" height="552" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1.5" />
    <text x="44" y="550" fill="#FFFFFF" opacity="0.85" font-family="serif" font-size="18" letter-spacing="2">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "camille",
    name: "Camille V.",
    subtitle: "5'5\" · 128 lbs · Warm Autumn",
    heightCm: 165,
    weightKg: 58,
    genderFit: "womenswear",
    aesthetic: "quiet-luxury",
    occasion: "everyday-elevated",
    svgDataUrl: makePortraitSvgDataUrl(
      "#D9CFC1",
      "#C2A887",
      "#2D1E18",
      "#D9A986",
      "#3A2A22",
      "ATELIER REF 01 // WARM AUTUMN"
    ),
    metrics: {
      dominantColors: ["#2D1E18", "#D9A986", "#3A2A22", "#C2A887"],
      warmthScore: 34,
      contrastScore: 58,
      brightnessScore: 46,
    },
  },
  {
    id: "marcus",
    name: "Marcus K.",
    subtitle: "6'1\" · 185 lbs · Architectural Winter",
    heightCm: 185,
    weightKg: 84,
    genderFit: "menswear",
    aesthetic: "minimalist-tailored",
    occasion: "executive-office",
    svgDataUrl: makePortraitSvgDataUrl(
      "#232936",
      "#3B465E",
      "#121318",
      "#8D6249",
      "#161920",
      "ATELIER REF 02 // COOL WINTER"
    ),
    metrics: {
      dominantColors: ["#121318", "#8D6249", "#161920", "#3B465E"],
      warmthScore: -24,
      contrastScore: 72,
      brightnessScore: 38,
    },
  },
  {
    id: "soren",
    name: "Soren L.",
    subtitle: "5'9\" · 154 lbs · Cool Summer",
    heightCm: 175,
    weightKg: 70,
    genderFit: "androgynous",
    aesthetic: "street-editorial",
    occasion: "capsule-reset",
    svgDataUrl: makePortraitSvgDataUrl(
      "#CBD2D6",
      "#96A5B0",
      "#4A443F",
      "#E5C4B0",
      "#43525E",
      "ATELIER REF 03 // COOL SUMMER"
    ),
    metrics: {
      dominantColors: ["#4A443F", "#E5C4B0", "#43525E", "#96A5B0"],
      warmthScore: -16,
      contrastScore: 42,
      brightnessScore: 62,
    },
  },
];
