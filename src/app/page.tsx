"use client";

import React, { useState, useRef } from "react";
import {
  BudgetTier,
  ConsultationReport,
  ExtractedPhotoMetrics,
  FitPreference,
  GenderFit,
  StyleAesthetic,
  StyleOccasion,
  UnitSystem,
} from "@/types/consultation";
import {
  calculateBmi,
  cmToFtIn,
  ftInToCm,
  generateConsultationWithOptionalAI,
  kgToLbs,
  lbsToKg,
} from "@/lib/consultationEngine";
import {
  analyzeUploadedPhoto,
  DEMO_PRESETS,
  DemoPreset,
} from "@/lib/photoAnalyzer";
import ConsultationReportView from "@/components/ConsultationReportView";

export default function HomePage() {
  // Unit & Anthropometric State
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(65);

  // Photo & Extracted Colorimetry State
  const [imageBase64, setImageBase64] = useState<string>(
    DEMO_PRESETS[0].svgDataUrl
  );
  const [photoMetrics, setPhotoMetrics] = useState<ExtractedPhotoMetrics>(
    DEMO_PRESETS[0].metrics
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(
    DEMO_PRESETS[0].id
  );
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Style Quiz State
  const [genderFit, setGenderFit] = useState<GenderFit>("womenswear");
  const [aesthetic, setAesthetic] = useState<StyleAesthetic>("quiet-luxury");
  const [occasion, setOccasion] = useState<StyleOccasion>("everyday-elevated");
  const [fitPreference, setFitPreference] = useState<FitPreference>("tailored");
  const [budget, setBudget] = useState<BudgetTier>("contemporary");
  const [customNotes, setCustomNotes] = useState<string>("");

  // Optional API Key (Gemini or OpenAI)
  const [showApiConfig, setShowApiConfig] = useState<boolean>(false);
  const [clientApiKey, setClientApiKey] = useState<string>("");

  // Submission & Report State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<ConsultationReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Derived imperial values
  const { feet, inches } = cmToFtIn(heightCm);
  const weightLbs = kgToLbs(weightKg);
  const liveBmi = calculateBmi(heightCm, weightKg);

  const handleFileSelected = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }
    setErrorMsg(null);
    setIsAnalyzingPhoto(true);
    setActivePresetId(null);
    try {
      const result = await analyzeUploadedPhoto(file);
      setImageBase64(result.dataUrl);
      setPhotoMetrics(result.metrics);
    } catch {
      setErrorMsg("Could not process image. Please try another photo.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleSelectPreset = (preset: DemoPreset) => {
    setActivePresetId(preset.id);
    setImageBase64(preset.svgDataUrl);
    setPhotoMetrics(preset.metrics);
    setHeightCm(preset.heightCm);
    setWeightKg(preset.weightKg);
    setGenderFit(preset.genderFit);
    setAesthetic(preset.aesthetic);
    setOccasion(preset.occasion);
    setErrorMsg(null);
  };

  const handleFeetChange = (newFeet: number) => {
    const clampedFeet = Math.max(4, Math.min(7, newFeet));
    setHeightCm(ftInToCm(clampedFeet, inches));
  };

  const handleInchesChange = (newInches: number) => {
    const clampedInches = Math.max(0, Math.min(11, newInches));
    setHeightCm(ftInToCm(feet, clampedInches));
  };

  const handleLbsChange = (newLbs: number) => {
    const clampedLbs = Math.max(70, Math.min(450, newLbs));
    setWeightKg(lbsToKg(clampedLbs));
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!imageBase64) {
      setErrorMsg("Please upload or select a photo to run the style analysis.");
      return;
    }

    if (
      !Number.isFinite(heightCm) ||
      heightCm < 120 ||
      heightCm > 235 ||
      !Number.isFinite(weightKg) ||
      weightKg < 30 ||
      weightKg > 250
    ) {
      setErrorMsg(
        "Please enter valid height (120–235 cm / 4'0\"–7'8\") and weight (30–250 kg / 66–550 lbs) measurements."
      );
      return;
    }

    setIsGenerating(true);

    try {
      const generatedReport = await generateConsultationWithOptionalAI({
        imageBase64,
        photoMetrics,
        unitSystem,
        heightCm,
        weightKg,
        genderFit,
        aesthetic,
        occasion,
        budget,
        fitPreference,
        customNotes,
        clientApiKey: clientApiKey.trim() || undefined,
      });

      setReport(generatedReport);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrorMsg("Unable to generate your style dossier. Please check your inputs.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Editorial Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#F9F6F0]/90 border-b border-[#E6E0D5] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#181615] text-[#F9F6F0] flex items-center justify-center font-display text-lg font-semibold tracking-wider">
              AV
            </div>
            <div>
              <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight block leading-none">
                ATELIER VERA
              </span>
              <span className="text-[10px] font-mono-tech uppercase tracking-[0.2em] text-[#8C7A6B]">
                AI Personal Styling & Anthropometrics
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowApiConfig((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-full text-xs font-mono-tech border border-[#D5CEC2] bg-white hover:border-[#181615] transition cursor-pointer flex items-center gap-2"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  clientApiKey.trim() ? "bg-emerald-600" : "bg-[#C89D66]"
                }`}
              />
              {clientApiKey.trim()
                ? "Custom Vision Key Active"
                : "AI Vision Config"}
            </button>
          </div>
        </div>

        {/* Optional API Key Drawer */}
        {showApiConfig && (
          <div className="bg-[#181615] text-[#F9F6F0] border-b border-[#2E2A27] px-4 sm:px-8 py-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-[#C89D66] uppercase tracking-wider font-mono-tech">
                  Optional Live Vision API Key (Gemini or OpenAI)
                </p>
                <p className="text-[#B5ACA3]">
                  Paste a Gemini (`AIza...`) or OpenAI (`sk-...`) key for cloud LLM vision analysis, or leave blank to use the built-in Atelier Canvas Colorimetry & Anthropometric Engine.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="password"
                  value={clientApiKey}
                  onChange={(e) => setClientApiKey(e.target.value)}
                  placeholder="AIza... or sk-... (Optional)"
                  className="w-full sm:w-72 px-3.5 py-2 rounded-xl bg-[#221F1D] border border-[#3E3834] text-xs font-mono-tech text-white focus:outline-none focus:border-[#C89D66]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiConfig(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#C89D66] text-[#181615] text-xs font-semibold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {report ? (
          <ConsultationReportView
            report={report}
            imagePreview={imageBase64}
            photoMetrics={photoMetrics}
            onReset={() => setReport(null)}
          />
        ) : (
          <div className="space-y-10">
            {/* Hero Introduction */}
            <section className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#E2DCD3] text-[11px] font-mono-tech uppercase tracking-widest text-[#57504B]">
                <span>01 Photo Colorimetry</span>
                <span>·</span>
                <span>02 Height & Weight Proportions</span>
                <span>·</span>
                <span>03 Bespoke Lookbook</span>
              </div>
              <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-[#181615] leading-[1.08]">
                Precision styling calibrated to your exact proportions.
              </h1>
              <p className="text-base sm:text-lg text-[#57504B] leading-relaxed">
                Upload a portrait or full-length photo, enter your height and weight, and receive a bespoke consultation dossier covering your 12-season color palette, exact sizing across tops and trousers, tailoring instructions, and a curated 3-outfit lookbook.
              </p>
            </section>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-[#FDF2F2] border border-[#F2C6C6] text-[#8A1F1F] text-sm font-medium">
                {errorMsg}
              </div>
            )}

            {/* Consultation Studio Form */}
            <form
              onSubmit={handleSubmitConsultation}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* LEFT COLUMN: PHOTO UPLOAD & COLORIMETRY SCANNER (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E0D5] shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                        Step 01 // Visual Input
                      </span>
                      <h2 className="font-display text-2xl font-semibold mt-0.5">
                        Client Portrait & Undertone Scan
                      </h2>
                    </div>
                    {isAnalyzingPhoto && (
                      <span className="text-xs font-mono-tech text-[#C89D66] animate-pulse">
                        Scanning pigments...
                      </span>
                    )}
                  </div>

                  {/* Interactive Dropzone + Preview */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group rounded-2xl overflow-hidden border-2 border-dashed transition cursor-pointer ${
                      isDragging
                        ? "border-[#181615] bg-[#F4F0E8]"
                        : "border-[#D5CEC2] hover:border-[#181615] bg-[#F9F6F0]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                      className="hidden"
                    />

                    <div className="aspect-4/5 w-full relative overflow-hidden bg-[#181615]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageBase64}
                        alt="Selected client portrait"
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 flex flex-col justify-between p-4">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] font-mono-tech text-white uppercase tracking-wider">
                            {activePresetId
                              ? "Demo Reference Active"
                              : "Custom Photo Loaded"}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white/90 text-[#181615] text-xs font-semibold shadow-xs">
                            Replace Photo
                          </span>
                        </div>

                        <div className="text-white space-y-2">
                          <p className="text-xs text-white/85">
                            Click or drag & drop your photo (`JPG`, `PNG`, `WEBP`)
                          </p>
                          {/* Live Extracted Swatches Overlay */}
                          <div className="flex items-center gap-2 bg-black/65 backdrop-blur-xs p-2.5 rounded-xl border border-white/15">
                            <span className="text-[10px] font-mono-tech uppercase tracking-wider text-[#D8C3A5] shrink-0">
                              Detected Pigments:
                            </span>
                            <div className="flex items-center gap-1.5 flex-1">
                              {photoMetrics.dominantColors.map((hex, idx) => (
                                <div
                                  key={idx}
                                  className="flex-1 h-5 rounded border border-white/30"
                                  style={{ backgroundColor: hex }}
                                  title={hex}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Colorimetry Readout */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-[#F9F6F0] border border-[#E6E0D5]">
                      <span className="block text-[10px] font-mono-tech uppercase text-[#8C7A6B]">
                        Undertone Cast
                      </span>
                      <span className="text-xs font-semibold text-[#181615] mt-0.5 block">
                        {photoMetrics.warmthScore >= 10
                          ? `Warm (+${photoMetrics.warmthScore})`
                          : photoMetrics.warmthScore <= -10
                          ? `Cool (${photoMetrics.warmthScore})`
                          : `Neutral (${photoMetrics.warmthScore})`}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F9F6F0] border border-[#E6E0D5]">
                      <span className="block text-[10px] font-mono-tech uppercase text-[#8C7A6B]">
                        Contrast Index
                      </span>
                      <span className="text-xs font-semibold text-[#181615] mt-0.5 block">
                        {photoMetrics.contrastScore}/100
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F9F6F0] border border-[#E6E0D5]">
                      <span className="block text-[10px] font-mono-tech uppercase text-[#8C7A6B]">
                        Luminance
                      </span>
                      <span className="text-xs font-semibold text-[#181615] mt-0.5 block">
                        {photoMetrics.brightnessScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Quick Demo Profiles */}
                  <div className="space-y-2.5 pt-2 border-t border-[#EFECE6]">
                    <span className="block text-xs font-mono-tech uppercase tracking-wider text-[#8C7A6B]">
                      Or Test Instantly With a Demo Profile:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {DEMO_PRESETS.map((preset) => {
                        const selected = activePresetId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              selected
                                ? "bg-[#181615] text-[#F9F6F0] border-[#181615]"
                                : "bg-[#F9F6F0] text-[#181615] border-[#E6E0D5] hover:border-[#181615]"
                            }`}
                          >
                            <p className="text-xs font-semibold truncate">
                              {preset.name}
                            </p>
                            <p
                              className={`text-[10px] truncate mt-0.5 ${
                                selected ? "text-[#D8C3A5]" : "text-[#6E655F]"
                              }`}
                            >
                              {preset.subtitle}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: HEIGHT, WEIGHT & STYLE PREFERENCES QUIZ (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* STEP 2: HEIGHT & WEIGHT ANTHROPOMETRICS */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                        Step 02 // Body Metrics
                      </span>
                      <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-0.5">
                        Height & Weight Calibration
                      </h2>
                    </div>

                    {/* Imperial / Metric Segmented Toggle */}
                    <div className="inline-flex rounded-full p-1 bg-[#F4F1EA] border border-[#E2DCD3]">
                      <button
                        type="button"
                        onClick={() => setUnitSystem("imperial")}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                          unitSystem === "imperial"
                            ? "bg-[#181615] text-white shadow-xs"
                            : "text-[#57504B] hover:text-[#181615]"
                        }`}
                      >
                        Imperial (ft/in · lbs)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitSystem("metric")}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                          unitSystem === "metric"
                            ? "bg-[#181615] text-white shadow-xs"
                            : "text-[#57504B] hover:text-[#181615]"
                        }`}
                      >
                        Metric (cm · kg)
                      </button>
                    </div>
                  </div>

                  {/* Height Input */}
                  <div className="p-5 rounded-2xl bg-[#F9F6F0] border border-[#E6E0D5] space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#181615]">
                        Height Measurement
                      </label>
                      <span className="text-sm font-mono-tech font-semibold text-[#181615] bg-white px-3 py-1 rounded-lg border border-[#E2DCD3]">
                        {feet}&apos;{inches}&quot; ({heightCm} cm)
                      </span>
                    </div>

                    <input
                      type="range"
                      min={140}
                      max={210}
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full accent-[#181615] cursor-pointer"
                    />

                    {unitSystem === "imperial" ? (
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className="block text-xs text-[#57504B] mb-1">
                            Feet (ft)
                          </label>
                          <input
                            type="number"
                            min={4}
                            max={7}
                            value={feet}
                            onChange={(e) => handleFeetChange(Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5CEC2] text-sm font-mono-tech"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#57504B] mb-1">
                            Inches (in)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={11}
                            value={inches}
                            onChange={(e) => handleInchesChange(Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5CEC2] text-sm font-mono-tech"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-[#57504B] mb-1">
                          Centimeters (cm)
                        </label>
                        <input
                          type="number"
                          min={125}
                          max={230}
                          value={heightCm}
                          onChange={(e) =>
                            setHeightCm(
                              Math.max(125, Math.min(230, Number(e.target.value)))
                            )
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5CEC2] text-sm font-mono-tech"
                        />
                      </div>
                    )}
                  </div>

                  {/* Weight Input */}
                  <div className="p-5 rounded-2xl bg-[#F9F6F0] border border-[#E6E0D5] space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#181615]">
                        Weight Measurement
                      </label>
                      <span className="text-sm font-mono-tech font-semibold text-[#181615] bg-white px-3 py-1 rounded-lg border border-[#E2DCD3]">
                        {weightLbs} lbs ({weightKg} kg)
                      </span>
                    </div>

                    <input
                      type="range"
                      min={40}
                      max={150}
                      step={0.5}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full accent-[#181615] cursor-pointer"
                    />

                    {unitSystem === "imperial" ? (
                      <div>
                        <label className="block text-xs text-[#57504B] mb-1">
                          Pounds (lbs)
                        </label>
                        <input
                          type="number"
                          min={75}
                          max={400}
                          value={weightLbs}
                          onChange={(e) => handleLbsChange(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5CEC2] text-sm font-mono-tech"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-[#57504B] mb-1">
                          Kilograms (kg)
                        </label>
                        <input
                          type="number"
                          min={35}
                          max={180}
                          step={0.5}
                          value={weightKg}
                          onChange={(e) =>
                            setWeightKg(
                              Math.max(35, Math.min(180, Number(e.target.value)))
                            )
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5CEC2] text-sm font-mono-tech"
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Proportion Preview Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-[#181615] text-[#F9F6F0] text-xs">
                    <span className="font-mono-tech uppercase tracking-wider text-[#C89D66]">
                      Live Anthropometric Index
                    </span>
                    <div className="flex items-center gap-4 font-mono-tech">
                      <span>BMI: {liveBmi}</span>
                      <span>·</span>
                      <span>
                        Est. Inseam: {Math.round(((heightCm * 0.45) / 2.54) * 2) / 2}&quot;
                      </span>
                    </div>
                  </div>
                </div>

                {/* STEP 3: STYLE PREFERENCES & OCCASION QUIZ */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-6">
                  <div>
                    <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                      Step 03 // Sartorial Direction
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-0.5">
                      Style & Wardrobe Preferences
                    </h2>
                  </div>

                  {/* Tailoring Block */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono-tech uppercase tracking-wider text-[#57504B]">
                      Tailoring Block & Sizing System
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: "womenswear", label: "Womenswear" },
                        { id: "menswear", label: "Menswear" },
                        { id: "androgynous", label: "Unisex / Editorial" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setGenderFit(opt.id as GenderFit)}
                          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium border transition cursor-pointer ${
                            genderFit === opt.id
                              ? "bg-[#181615] text-white border-[#181615]"
                              : "bg-[#F9F6F0] text-[#2E2A27] border-[#E6E0D5] hover:border-[#181615]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aesthetic Direction */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono-tech uppercase tracking-wider text-[#57504B]">
                      Signature Aesthetic
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: "quiet-luxury",
                          title: "Quiet Luxury",
                          desc: "Cashmere, tonal drape, understated sophistication",
                        },
                        {
                          id: "minimalist-tailored",
                          title: "Minimalist Tailored",
                          desc: "Sharp lines, monochrome structure, architectural",
                        },
                        {
                          id: "street-editorial",
                          title: "Street Editorial",
                          desc: "Relaxed volume, contemporary proportions, layered",
                        },
                        {
                          id: "parisian-classic",
                          title: "Parisian Classic",
                          desc: "Effortless blazers, straight denim, timeless loafers",
                        },
                        {
                          id: "relaxed-coastal",
                          title: "Relaxed Sartorial",
                          desc: "Breathable linens, unlined jackets, warm neutrals",
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAesthetic(opt.id as StyleAesthetic)}
                          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                            aesthetic === opt.id
                              ? "bg-[#181615] text-white border-[#181615]"
                              : "bg-[#F9F6F0] text-[#181615] border-[#E6E0D5] hover:border-[#181615]"
                          }`}
                        >
                          <p className="text-sm font-semibold">{opt.title}</p>
                          <p
                            className={`text-xs mt-0.5 ${
                              aesthetic === opt.id
                                ? "text-[#D8C3A5]"
                                : "text-[#6E655F]"
                            }`}
                          >
                            {opt.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Occasion & Fit Preference */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-mono-tech uppercase tracking-wider text-[#57504B]">
                        Primary Occasion Focus
                      </label>
                      <select
                        value={occasion}
                        onChange={(e) =>
                          setOccasion(e.target.value as StyleOccasion)
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F6F0] border border-[#D5CEC2] text-sm font-medium focus:outline-none focus:border-[#181615]"
                      >
                        <option value="everyday-elevated">
                          Elevated Daily Uniform
                        </option>
                        <option value="executive-office">
                          Executive & Boardroom
                        </option>
                        <option value="evening-event">
                          Evening & Social Events
                        </option>
                        <option value="smart-travel">
                          First-Class Travel Capsule
                        </option>
                        <option value="capsule-reset">
                          Full Seasonal Wardrobe Reset
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-mono-tech uppercase tracking-wider text-[#57504B]">
                        Silhouette Fit Preference
                      </label>
                      <select
                        value={fitPreference}
                        onChange={(e) =>
                          setFitPreference(e.target.value as FitPreference)
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F6F0] border border-[#D5CEC2] text-sm font-medium focus:outline-none focus:border-[#181615]"
                      >
                        <option value="tailored">
                          Tailored & Crisp (Close to frame)
                        </option>
                        <option value="relaxed">
                          Relaxed & Fluid (Easy drape)
                        </option>
                        <option value="structured-oversized">
                          Structured Oversized (Editorial volume)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Budget Tier */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono-tech uppercase tracking-wider text-[#57504B]">
                      Brand & Budget Tier
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        {
                          id: "accessible",
                          label: "Accessible ($)",
                          sub: "UNIQLO U, ARKET, Mango",
                        },
                        {
                          id: "contemporary",
                          label: "Contemporary ($$)",
                          sub: "COS, Theory, SuitSupply",
                        },
                        {
                          id: "luxury",
                          label: "Luxury ($$$)",
                          sub: "The Row, Lemaire, Totême",
                        },
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setBudget(tier.id as BudgetTier)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            budget === tier.id
                              ? "bg-[#181615] text-white border-[#181615]"
                              : "bg-[#F9F6F0] text-[#181615] border-[#E6E0D5] hover:border-[#181615]"
                          }`}
                        >
                          <p className="text-xs sm:text-sm font-semibold">
                            {tier.label}
                          </p>
                          <p
                            className={`text-[11px] mt-0.5 truncate ${
                              budget === tier.id
                                ? "text-[#D8C3A5]"
                                : "text-[#6E655F]"
                            }`}
                          >
                            {tier.sub}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Stylist Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono-tech uppercase tracking-wider text-[#57504B]">
                      Additional Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="e.g., Broad shoulders, prefer ankle-length trousers, upcoming wedding in Milan..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F9F6F0] border border-[#D5CEC2] text-sm focus:outline-none focus:border-[#181615]"
                    />
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-4 px-6 rounded-2xl bg-[#181615] hover:bg-[#2C2623] disabled:opacity-60 text-[#F9F6F0] font-medium text-sm sm:text-base tracking-wide transition shadow-lg cursor-pointer flex items-center justify-center gap-3"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-[#C89D66] border-t-transparent rounded-full animate-spin" />
                        <span>
                          Calibrating Proportions, Color Season & Lookbook...
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Generate Bespoke Styling Consultation</span>
                        <span className="text-[#C89D66] font-mono-tech">→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6E0D5] py-6 px-4 sm:px-8 text-xs text-[#6E655F] no-print mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-display text-sm font-semibold text-[#181615]">
            ATELIER VERA — Personal Styling & Anthropometric Consulting
          </span>
          <span className="font-mono-tech">
            12-Season Colorimetry · Vertical Rule of Thirds · Bespoke Lookbook
          </span>
        </div>
      </footer>
    </div>
  );
}
