# ATELIER VERA — AI Personal Styling & Anthropometric Consulting

A Next.js and TypeScript web application that generates a bespoke personal styling and wardrobe consultation dossier from a user's photo, height, weight, and style preferences.

## Features

- **Portrait Upload & Live Colorimetry Scanner**: Extracts dominant hex pigments, undertone warmth, contrast index, and luminance on a client-side `<canvas>`, plus includes 3 instant demo profiles.
- **Height & Weight Calibration**: Synchronized sliders and numeric inputs with an **Imperial (`ft`/`in` & `lbs`)** and **Metric (`cm` & `kg`)** toggle, live BMI, and inseam calculation.
- **Sartorial Preferences Quiz**: Tailoring block (`Womenswear`, `Menswear`, `Unisex / Editorial`), signature aesthetic, primary occasion, fit preference, and budget tier (`$`, `$$`, `$$$`).
- **AI Vision API + Built-in Anthropometric Engine**: Connects to Google Gemini Vision (`GEMINI_API_KEY`) or OpenAI Vision (`OPENAI_API_KEY`) when configured, with an automatic fallback to the built-in Atelier Colorimetry & Anthropometric Engine.
- **4-Tab Consultation Dossier**:
  1. Proportions & Sizing Guide (Tops, Waist, Inseam, Outerwear, Suit/Dress, 1/3-to-2/3 ratio, and tailoring notes)
  2. 12-Season Color Palette with interactive click-to-copy HEX swatches
  3. Curated 3-Outfit Lookbook with piece-by-piece sizing and brand suggestions
  4. Silhouette Rules & Interactive Capsule Shopping Checklist + Print/PDF export

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
