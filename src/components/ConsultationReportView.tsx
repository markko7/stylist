"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConsultationReport, ExtractedPhotoMetrics } from "@/types/consultation";

interface ConsultationReportViewProps {
  report: ConsultationReport;
  imagePreview: string;
  photoMetrics: ExtractedPhotoMetrics;
  clientApiKey?: string;
  onReset: () => void;
}

export default function ConsultationReportView({
  report,
  imagePreview,
  photoMetrics,
  clientApiKey,
  onReset,
}: ConsultationReportViewProps) {
  const [activeTab, setActiveTab] = useState<
    "proportions" | "colors" | "hairstyles" | "lookbook" | "shopping"
  >("hairstyles");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [selectedHairstyleId, setSelectedHairstyleId] = useState<string | null>(
    report.hairstyleGrid?.[0]?.id || null
  );
  const [isExportingGrid, setIsExportingGrid] = useState<boolean>(false);
  const [isGeneratingAiGrid, setIsGeneratingAiGrid] = useState<boolean>(false);
  const [aiGridImageUrl, setAiGridImageUrl] = useState<string | null>(null);
  const [aiGridProvider, setAiGridProvider] = useState<string | null>(null);
  const [aiGridError, setAiGridError] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1600);
  };

  const toggleShopItem = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderHairstyleSilhouetteSvg = (variant: number, toneHex: string) => {
    const v = ((variant - 1) % 9) + 1;
    switch (v) {
      case 1:
        // Clavicle Lob / Executive Taper contour
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M42,95 C40,42 72,22 100,22 C128,22 160,42 158,95 C157,132 152,165 144,182 C140,148 142,102 134,68 C118,52 82,52 66,68 C58,102 60,148 56,182 C48,165 43,132 42,95 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
      case 2:
        // Voluminous Blowout / Soft Curtain Flow
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M32,105 C28,40 66,16 100,18 C134,16 172,40 168,105 C165,148 156,182 142,196 C140,152 146,102 130,64 C112,48 100,58 100,58 C100,58 88,48 70,64 C54,102 60,152 58,196 C44,182 35,148 32,105 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
      case 3:
        // French Bob / Architectural Crop with Fringe
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M46,88 C44,38 70,22 100,22 C130,22 156,38 154,88 C153,118 146,138 136,146 C136,112 134,84 128,68 L72,68 C66,84 64,112 64,146 C54,138 47,118 46,88 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
      case 4:
        // Butterfly Layers / Swept-Back Wave
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M36,96 C34,36 68,18 100,20 C132,18 166,36 164,96 C160,136 150,174 136,192 C136,154 142,110 128,72 C110,54 90,54 72,72 C58,110 64,154 64,192 C50,174 40,136 36,96 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
      case 5:
        // Sleek Sculpted Crown / Elevated Quiff
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M52,82 C50,32 74,12 100,12 C126,12 150,32 148,82 C146,96 142,106 138,112 C136,78 122,52 100,50 C78,52 64,78 62,112 C58,106 54,96 52,82 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
      case 6:
        // Bixie / Mod Textured Crop
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M44,84 C40,34 68,18 100,18 C132,18 160,34 156,84 C154,108 146,126 136,134 C136,98 128,66 100,58 C72,66 64,98 64,134 C54,126 46,108 44,84 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
      case 7:
        // S-Wave Midi Shag / Side-Part Ivy
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M40,92 C38,38 68,20 100,20 C132,20 162,38 160,92 C156,128 148,158 138,172 C138,134 136,90 122,62 C104,50 78,56 68,72 C58,104 62,138 62,172 C52,158 44,128 40,92 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
      case 8:
        // Side-Swept Asymmetrical / Collarbone Flow
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M36,98 C34,36 72,16 106,18 C136,20 164,42 162,98 C160,140 152,174 140,188 C138,144 140,96 124,64 C102,48 72,62 64,84 C56,118 60,156 58,188 C46,174 38,140 36,98 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
      default:
        // Crown-Lift Bardot / Pure Bone Structure Contour
        return (
          <svg viewBox="0 0 200 220" className="w-full h-full pointer-events-none">
            <path
              d="M44,90 C42,32 70,14 100,14 C130,14 158,32 156,90 C154,132 148,168 138,184 C136,142 138,94 126,64 C110,50 90,50 74,64 C62,94 64,142 62,184 C52,168 46,132 44,90 Z"
              fill={toneHex}
              fillOpacity="0.48"
              stroke="#F9F6F0"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </svg>
        );
    }
  };

  const buildCanvas3x3DataUrl = useCallback(async (): Promise<string | null> => {
    if (!report.hairstyleGrid?.length) return null;
    const canvas = document.createElement("canvas");
    const width = 1560;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    ctx.fillStyle = "#F9F6F0";
    ctx.fillRect(0, 0, width, height);

    // Header Bar
    ctx.fillStyle = "#181615";
    ctx.fillRect(0, 0, width, 150);
    ctx.fillStyle = "#C89D66";
    ctx.font = "600 16px monospace";
    ctx.fillText("ATELIER VERA // BESPOKE 3×3 HAIRSTYLE MATRIX", 48, 52);
    ctx.fillStyle = "#F9F6F0";
    ctx.font = "600 34px Georgia, serif";
    ctx.fillText(
      `9 Complementary Hairstyles — ${report.clientTitle}`,
      48,
      98
    );
    ctx.fillStyle = "#B5ACA3";
    ctx.font = "400 16px sans-serif";
    ctx.fillText(report.faceShapeSummary || "", 48, 128);

    // Load client image
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = imagePreview;
    });

    const cols = 3;
    const padX = 48;
    const padY = 180;
    const gap = 28;
    const cardW = Math.floor((width - padX * 2 - gap * (cols - 1)) / cols);
    const cardH = 536;

    const wrapText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
      maxLines: number
    ) => {
      const words = text.split(" ");
      let line = "";
      let linesDrawn = 0;
      let curY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          linesDrawn++;
          if (linesDrawn >= maxLines) {
            ctx.fillText(line.trim() + "…", x, curY);
            return curY + lineHeight;
          }
          ctx.fillText(line.trim(), x, curY);
          line = words[n] + " ";
          curY += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), x, curY);
        curY += lineHeight;
      }
      return curY;
    };

    report.hairstyleGrid.slice(0, 9).forEach((item, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = padX + col * (cardW + gap);
      const y = padY + row * (cardH + gap);

      // Card Box
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = "#E2DCD3";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cardW, cardH);

      // Portrait Thumbnail Top Area
      const imgH = 215;
      ctx.fillStyle = "#221F1D";
      ctx.fillRect(x + 16, y + 16, cardW - 32, imgH);
      if (img.width > 0 && img.height > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 16, y + 16, cardW - 32, imgH);
        ctx.clip();
        const scale = Math.max((cardW - 32) / img.width, imgH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = x + 16 + (cardW - 32 - drawW) / 2;
        const drawY = y + 16 + (imgH - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Subtle hair tone halo at top of portrait
        const grad = ctx.createLinearGradient(x + 16, y + 16, x + 16, y + 130);
        grad.addColorStop(0, item.recommendedToneHex + "99");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(x + 16, y + 16, cardW - 32, 115);
        ctx.restore();
      }

      // Number Badge
      ctx.fillStyle = "#181615";
      ctx.fillRect(x + 26, y + 26, 48, 28);
      ctx.fillStyle = "#C89D66";
      ctx.font = "600 13px monospace";
      ctx.fillText(`0${idx + 1}`, x + 40, y + 45);

      // Tone Swatch Pill
      ctx.fillStyle = "rgba(24, 22, 21, 0.82)";
      ctx.fillRect(x + 26, y + imgH - 18, cardW - 52, 26);
      ctx.fillStyle = item.recommendedToneHex;
      ctx.fillRect(x + 34, y + imgH - 12, 14, 14);
      ctx.fillStyle = "#F9F6F0";
      ctx.font = "500 12px monospace";
      ctx.fillText(
        `${item.recommendedToneName} · ${item.lengthAndCut}`.slice(0, 48),
        x + 56,
        y + imgH - 1
      );

      // Category & Name
      ctx.fillStyle = "#8C7A6B";
      ctx.font = "600 12px monospace";
      ctx.fillText(item.category.toUpperCase(), x + 20, y + imgH + 40);

      ctx.fillStyle = "#181615";
      ctx.font = "600 22px Georgia, serif";
      ctx.fillText(item.name.slice(0, 32), x + 20, y + imgH + 68);

      // Style Description
      ctx.fillStyle = "#8C7A6B";
      ctx.font = "600 11px monospace";
      ctx.fillText("THE STYLE:", x + 20, y + imgH + 96);
      ctx.fillStyle = "#2E2A27";
      ctx.font = "400 14px sans-serif";
      const nextY = wrapText(
        item.styleDescription,
        x + 20,
        y + imgH + 116,
        cardW - 40,
        20,
        3
      );

      // Why It Complements
      ctx.fillStyle = "#8C7A6B";
      ctx.font = "600 11px monospace";
      ctx.fillText("WHY IT COMPLEMENTS YOU:", x + 20, nextY + 12);
      ctx.fillStyle = "#4A443F";
      ctx.font = "400 14px sans-serif";
      wrapText(
        item.whyItComplements,
        x + 20,
        nextY + 32,
        cardW - 40,
        20,
        4
      );
    });

    return canvas.toDataURL("image/png");
  }, [imagePreview, report.clientTitle, report.faceShapeSummary, report.hairstyleGrid]);

  const handleDownload3x3GridPoster = async () => {
    setIsExportingGrid(true);
    try {
      const dataUrl = await buildCanvas3x3DataUrl();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = "atelier-vera-3x3-hairstyles.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExportingGrid(false);
    }
  };

  const rasterizePreviewIfNeeded = useCallback(async (src: string): Promise<string> => {
    if (!src.startsWith("data:image/svg")) {
      return src;
    }
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 640;
        c.height = 800;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/png"));
        } else {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  }, []);

  const handleGenerateAi3x3Sheet = useCallback(async () => {
    setIsGeneratingAiGrid(true);
    setAiGridError(null);
    try {
      const rasterImage = await rasterizePreviewIfNeeded(imagePreview);
      const res = await fetch("/api/hairstyle-grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: rasterImage,
          hairstyleGrid: report.hairstyleGrid,
          faceShapeSummary: report.faceShapeSummary,
          season: report.colorAnalysis.season,
          clientApiKey: clientApiKey?.trim() || undefined,
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const fallbackUrl = await buildCanvas3x3DataUrl();
        if (fallbackUrl) setAiGridImageUrl(fallbackUrl);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.imageUrl) {
        const fallbackUrl = await buildCanvas3x3DataUrl();
        if (fallbackUrl) {
          setAiGridImageUrl(fallbackUrl);
          setAiGridProvider(null);
        }
        setAiGridError(
          data.error ||
            "Gemini Free Tier quota reached for direct image generation; displaying Atelier 3×3 Composite Sheet."
        );
      } else {
        setAiGridImageUrl(data.imageUrl);
        setAiGridProvider(data.provider || "ai-grid");
      }
    } catch {
      const fallbackUrl = await buildCanvas3x3DataUrl();
      if (fallbackUrl) {
        setAiGridImageUrl(fallbackUrl);
        setAiGridProvider(null);
      }
    } finally {
      setIsGeneratingAiGrid(false);
    }
  }, [
    buildCanvas3x3DataUrl,
    clientApiKey,
    imagePreview,
    rasterizePreviewIfNeeded,
    report.colorAnalysis.season,
    report.faceShapeSummary,
    report.hairstyleGrid,
  ]);

  useEffect(() => {
    handleGenerateAi3x3Sheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.generatedAt]);

  const sourceBadge =
    report.source === "gemini-vision"
      ? "Gemini Multimodal Vision + Anthropometrics"
      : report.source === "openai-vision"
      ? "OpenAI GPT-4o Vision + Anthropometrics"
      : "Atelier Colorimetry & Anthropometric Engine";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Executive Summary Banner */}
      <div className="bg-[#181615] text-[#F9F6F0] rounded-3xl p-6 sm:p-10 shadow-xl border border-[#2E2A27]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#332E2A]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest bg-[#2C2623] text-[#D8C3A5] border border-[#443B35]">
              <span className="w-2 h-2 rounded-full bg-[#C89D66]" />
              {sourceBadge}
            </span>
            <span className="text-xs font-mono-tech text-[#9E958E]">
              REF // {new Date(report.generatedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-3 no-print">
            <button
              type="button"
              onClick={() => setActiveTab("hairstyles")}
              className="px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider bg-[#2C2623] hover:bg-[#3A322E] text-[#C89D66] border border-[#C89D66]/40 transition cursor-pointer"
            >
              3×3 Hairstyle Grid
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider bg-[#2C2623] hover:bg-[#3A322E] text-[#F9F6F0] border border-[#443B35] transition cursor-pointer"
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider bg-[#C89D66] hover:bg-[#B88B52] text-[#181615] font-semibold transition cursor-pointer"
            >
              New Consultation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
          {/* Client Portrait & Sampled Pigments */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center gap-5 bg-[#221F1D] p-4 rounded-2xl border border-[#332E2A]">
            <div className="relative w-36 h-44 sm:w-40 sm:h-48 rounded-xl overflow-hidden shrink-0 border border-[#443B35]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Client reference"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md flex items-center justify-between text-[11px] font-mono-tech">
                <span>{report.metricsAnalysis.heightDisplay.split(" ")[0]}</span>
                <span>·</span>
                <span>{report.metricsAnalysis.weightDisplay.split(" ")[0]} {report.metricsAnalysis.weightDisplay.split(" ")[1]}</span>
              </div>
            </div>

            <div className="w-full space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#B5ACA3]">
                <span className="uppercase tracking-wider">Sampled Photo Tones</span>
                <span className="font-mono-tech">
                  {photoMetrics.warmthScore >= 0 ? `Warm (+${photoMetrics.warmthScore})` : `Cool (${photoMetrics.warmthScore})`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {photoMetrics.dominantColors.map((hex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCopyHex(hex)}
                    title={`Click to copy ${hex}`}
                    className="group flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span
                      className="w-full h-7 rounded-md border border-white/20 transition transform group-hover:scale-105"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-[10px] font-mono-tech text-[#B5ACA3]">
                      {copiedHex === hex ? "Copied" : hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Executive Assessment */}
          <div className="lg:col-span-8 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C89D66] mb-1">
                Personal Sartorial & Anthropometric Dossier
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                {report.clientTitle}
              </h2>
            </div>

            <p className="text-base sm:text-lg text-[#E6E0D6] leading-relaxed">
              {report.stylistSummary}
            </p>

            {/* Key Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#221F1D] p-3.5 rounded-xl border border-[#332E2A]">
                <span className="block text-[11px] uppercase tracking-wider text-[#9E958E]">
                  Frame Silhouette
                </span>
                <span className="mt-1 block text-sm font-semibold text-[#F9F6F0]">
                  {report.metricsAnalysis.frameProfile}
                </span>
              </div>
              <div className="bg-[#221F1D] p-3.5 rounded-xl border border-[#332E2A]">
                <span className="block text-[11px] uppercase tracking-wider text-[#9E958E]">
                  Color Season
                </span>
                <span className="mt-1 block text-sm font-semibold text-[#C89D66]">
                  {report.colorAnalysis.season}
                </span>
              </div>
              <div className="bg-[#221F1D] p-3.5 rounded-xl border border-[#332E2A]">
                <span className="block text-[11px] uppercase tracking-wider text-[#9E958E]">
                  Body Mass Index
                </span>
                <span className="mt-1 block text-sm font-mono-tech font-semibold text-[#F9F6F0]">
                  {report.metricsAnalysis.bmi} ({report.metricsAnalysis.bmiCategory.split(" ")[0]})
                </span>
              </div>
              <div className="bg-[#221F1D] p-3.5 rounded-xl border border-[#332E2A]">
                <span className="block text-[11px] uppercase tracking-wider text-[#9E958E]">
                  Core Size Anchor
                </span>
                <span className="mt-1 block text-sm font-mono-tech font-semibold text-[#F9F6F0]">
                  {report.metricsAnalysis.recommendedSizes.dressOrSuitSize}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2DCD3] pb-3 no-print">
        {[
          { id: "proportions", label: "01. Proportions & Sizing Guide" },
          { id: "colors", label: "02. Seasonal Color Palette" },
          { id: "hairstyles", label: "03. 3×3 Hairstyle Matrix (9 Cuts)" },
          { id: "lookbook", label: "04. Curated Outfit Lookbook" },
          { id: "shopping", label: "05. Silhouette Rules & Capsule List" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | "proportions"
                    | "colors"
                    | "hairstyles"
                    | "lookbook"
                    | "shopping"
                )
              }
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer ${
                isActive
                  ? "bg-[#181615] text-[#F9F6F0] shadow-sm"
                  : "bg-white text-[#57504B] hover:bg-[#EFECE6] border border-[#E2DCD3]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROPORTIONS & SIZING GUIDE */}
      {activeTab === "proportions" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Sizing Matrix */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-6">
            <div>
              <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                Anthropometric Calibration
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
                Bespoke Sizing & Fit Matrix
              </h3>
              <p className="text-sm text-[#57504B] mt-1">
                Calibrated for {report.metricsAnalysis.heightDisplay} and{" "}
                {report.metricsAnalysis.weightDisplay} ({report.metricsAnalysis.bmiCategory}).
              </p>
            </div>

            <div className="divide-y divide-[#EFECE6] border-t border-b border-[#EFECE6]">
              {[
                {
                  label: "Tops, Knitwear & Shirting",
                  value: report.metricsAnalysis.recommendedSizes.tops,
                },
                {
                  label: "Trouser Waist & Rise",
                  value: report.metricsAnalysis.recommendedSizes.bottomsWaist,
                },
                {
                  label: "Recommended Inseam Length",
                  value: report.metricsAnalysis.recommendedSizes.bottomsInseam,
                },
                {
                  label: "Blazers, Coats & Outerwear",
                  value: report.metricsAnalysis.recommendedSizes.outerwear,
                },
                {
                  label: "Suiting / Dress Reference",
                  value: report.metricsAnalysis.recommendedSizes.dressOrSuitSize,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                >
                  <span className="text-sm font-medium text-[#57504B]">
                    {row.label}
                  </span>
                  <span className="text-sm font-mono-tech font-semibold text-[#181615] bg-[#F9F6F0] px-3 py-1 rounded-lg border border-[#E6E0D5]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#F9F6F0] rounded-2xl p-5 border border-[#E6E0D5]">
              <h4 className="text-xs font-mono-tech uppercase tracking-wider text-[#8C7A6B] mb-2">
                Vertical Rule of Thirds Strategy
              </h4>
              <p className="text-sm text-[#2E2A27] leading-relaxed">
                {report.metricsAnalysis.verticalRuleOfThirds}
              </p>
            </div>
          </div>

          {/* Right: Visual Proportion Diagram & Tailor Notes */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold">
                  1/3 to 2/3 Visual Ratio
                </h3>
                <span className="text-xs font-mono-tech px-2.5 py-1 rounded-md bg-[#F9F6F0] border border-[#E6E0D5]">
                  Golden Proportion
                </span>
              </div>

              {/* Architectural Proportion Graphic */}
              <div className="flex items-stretch gap-4 bg-[#F9F6F0] p-5 rounded-2xl border border-[#E6E0D5]">
                <div className="w-16 flex flex-col items-center">
                  <div
                    className="w-full h-20 rounded-t-xl flex items-center justify-center text-xs font-mono-tech text-white font-semibold"
                    style={{
                      backgroundColor:
                        report.colorAnalysis.neutrals[2]?.hex || "#EDE6D6",
                      color: "#181615",
                      border: "1px solid #D5CEC2",
                    }}
                  >
                    1/3 Top
                  </div>
                  <div
                    className="w-full h-36 rounded-b-xl flex items-center justify-center text-xs font-mono-tech text-white font-semibold"
                    style={{
                      backgroundColor:
                        report.colorAnalysis.neutrals[0]?.hex || "#2E221D",
                    }}
                  >
                    2/3 Leg
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between text-xs text-[#4A443F] py-1">
                  <div>
                    <span className="font-semibold text-[#181615] block">
                      Upper Torso Zone (1/3)
                    </span>
                    Tuck shirts or choose cropped/waist-skimming knitwear so the visual waist begins higher.
                  </div>
                  <div className="border-t border-dashed border-[#D5CEC2] pt-3">
                    <span className="font-semibold text-[#181615] block">
                      Lower Column Zone (2/3)
                    </span>
                    High-to-mid rise trousers hemmed cleanly to{" "}
                    {report.metricsAnalysis.recommendedSizes.bottomsInseam.split(" ")[0]}{" "}
                    create an uninterrupted vertical line.
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono-tech uppercase tracking-wider text-[#8C7A6B]">
                  Instructions for Your Tailor
                </h4>
                <ul className="space-y-2.5">
                  {report.metricsAnalysis.tailoringNotes.map((note, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-sm text-[#2E2A27]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#181615] text-[#F9F6F0] text-xs font-mono-tech flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEASONAL COLOR PALETTE */}
      {activeTab === "colors" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EFECE6] pb-6">
              <div>
                <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                  Chromatic Harmony Profile
                </span>
                <h3 className="font-display text-3xl font-semibold mt-1">
                  {report.colorAnalysis.season}
                </h3>
                <p className="text-sm text-[#57504B] mt-2 max-w-2xl">
                  {report.colorAnalysis.rationale}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#F9F6F0] border border-[#E6E0D5] text-xs font-medium">
                  {report.colorAnalysis.undertone}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-[#F9F6F0] border border-[#E6E0D5] text-xs font-medium">
                  {report.colorAnalysis.contrastLevel}
                </span>
              </div>
            </div>

            {/* Power Colors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-xl font-semibold">
                  Signature Power Colors (Wear Near Face)
                </h4>
                <span className="text-xs text-[#8C7A6B]">
                  Click any swatch to copy HEX
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.colorAnalysis.powerColors.map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => handleCopyHex(swatch.hex)}
                    className="text-left group bg-[#F9F6F0] rounded-2xl p-4 border border-[#E6E0D5] hover:border-[#181615] transition cursor-pointer"
                  >
                    <div
                      className="w-full h-24 rounded-xl mb-3 shadow-inner border border-black/10 flex items-end justify-end p-2.5"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      <span className="px-2 py-0.5 rounded bg-black/65 text-white text-[11px] font-mono-tech">
                        {copiedHex === swatch.hex ? "COPIED!" : swatch.hex}
                      </span>
                    </div>
                    <p className="font-semibold text-base text-[#181615]">
                      {swatch.name}
                    </p>
                    <p className="text-xs text-[#57504B] mt-1">{swatch.usage}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Neutrals */}
            <div className="space-y-3 pt-2">
              <h4 className="font-display text-xl font-semibold">
                Foundational Suiting & Base Neutrals
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.colorAnalysis.neutrals.map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => handleCopyHex(swatch.hex)}
                    className="text-left group bg-[#F9F6F0] rounded-2xl p-4 border border-[#E6E0D5] hover:border-[#181615] transition cursor-pointer"
                  >
                    <div
                      className="w-full h-20 rounded-xl mb-3 border border-black/10 flex items-end justify-end p-2.5"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      <span className="px-2 py-0.5 rounded bg-black/65 text-white text-[11px] font-mono-tech">
                        {copiedHex === swatch.hex ? "COPIED!" : swatch.hex}
                      </span>
                    </div>
                    <p className="font-semibold text-base text-[#181615]">
                      {swatch.name}
                    </p>
                    <p className="text-xs text-[#57504B] mt-1">{swatch.usage}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Accents & Avoid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h4 className="font-display text-xl font-semibold">
                  Hardware, Jewelry & Accent Notes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.colorAnalysis.accentColors.map((swatch) => (
                    <div
                      key={swatch.name}
                      className="bg-[#F9F6F0] rounded-2xl p-3.5 border border-[#E6E0D5] flex items-center gap-3.5"
                    >
                      <div
                        className="w-12 h-12 rounded-xl shrink-0 border border-black/10"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <div>
                        <p className="text-sm font-semibold">{swatch.name}</p>
                        <p className="text-xs text-[#57504B]">{swatch.usage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-display text-xl font-semibold text-[#7A2727]">
                  Shades to Avoid Near the Collarbone
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.colorAnalysis.colorsToAvoid.map((swatch) => (
                    <div
                      key={swatch.name}
                      className="bg-[#FDF8F7] rounded-2xl p-3.5 border border-[#EED9D6] flex items-center gap-3.5"
                    >
                      <div
                        className="w-12 h-12 rounded-xl shrink-0 border border-black/10 relative overflow-hidden"
                        style={{ backgroundColor: swatch.hex }}
                      >
                        <div className="w-full h-0.5 bg-red-600 rotate-45 translate-y-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#4A1C1C]">
                          {swatch.name}
                        </p>
                        <p className="text-xs text-[#6E3B3B]">{swatch.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 3×3 HAIRSTYLE MATRIX */}
      {activeTab === "hairstyles" && (
        <div className="space-y-6">
          {/* Header & Export Bar */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#EFECE6] pb-6">
              <div className="space-y-1.5">
                <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                  Cranial Geometry & Grooming // 3×3 Lookbook Matrix
                </span>
                <h3 className="font-display text-3xl font-semibold text-[#181615]">
                  Nine Complementary Hairstyles for Your Portrait
                </h3>
                <p className="text-sm text-[#57504B] max-w-3xl">
                  {report.faceShapeSummary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 no-print">
                <button
                  type="button"
                  onClick={handleDownload3x3GridPoster}
                  disabled={isExportingGrid}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#181615] hover:bg-[#2E2A27] text-[#F9F6F0] transition cursor-pointer disabled:opacity-60"
                >
                  {isExportingGrid
                    ? "Rendering 3×3 Poster..."
                    : "Download 3×3 Grid Poster (PNG)"}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAi3x3Sheet}
                  disabled={isGeneratingAiGrid}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#F9F6F0] hover:bg-[#EFECE6] text-[#181615] border border-[#D5CEC2] transition cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingAiGrid
                    ? "Generating AI 3×3 Hairstyle Sheet..."
                    : aiGridImageUrl
                    ? "Regenerate AI 3×3 Sheet (Gemini / OpenAI)"
                    : "Generate AI 3×3 Sheet (Gemini / OpenAI)"}
                </button>
              </div>
            </div>

            {aiGridError && (
              <div className="p-4 rounded-2xl bg-[#FDF8F7] border border-[#EED9D6] text-xs text-[#6E3B3B]">
                {aiGridError}
              </div>
            )}

            {isGeneratingAiGrid && !aiGridImageUrl && (
              <div className="p-6 rounded-2xl bg-[#181615] text-[#F9F6F0] border border-[#332E2A] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono-tech uppercase tracking-widest text-[#C89D66] block animate-pulse">
                    Gemini 2.5 Flash Image // Synthesizing 3×3 Hairstyle Portrait Grid...
                  </span>
                  <p className="text-xs text-[#B5ACA3]">
                    Generating nine complementary hairstyles tailored to your uploaded photo and facial geometry.
                  </p>
                </div>
              </div>
            )}

            {aiGridImageUrl && (
              <div className="p-4 rounded-2xl bg-[#181615] text-[#F9F6F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tech uppercase tracking-widest text-[#C89D66]">
                    AI Generated 3×3 Hairstyle Composite (Gemini / OpenAI)
                  </span>
                  <a
                    href={aiGridImageUrl}
                    download="atelier-vera-ai-3x3-hairstyles.png"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline text-[#D8C3A5]"
                  >
                    Download / Open Full Size
                  </a>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aiGridImageUrl}
                  alt="AI 3x3 Hairstyle Lookbook"
                  className="w-full max-w-2xl mx-auto rounded-xl border border-[#332E2A]"
                />
              </div>
            )}

            {/* 3×3 Grid of 9 Hairstyles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(report.hairstyleGrid || []).slice(0, 9).map((style, idx) => {
                const isSelected = selectedHairstyleId === style.id;
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const hasAiTile = Boolean(aiGridImageUrl && aiGridProvider);
                return (
                  <div
                    key={style.id || idx}
                    onClick={() => setSelectedHairstyleId(style.id)}
                    className={`group rounded-2xl p-5 border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? "bg-[#181615] text-[#F9F6F0] border-[#181615] shadow-md"
                        : "bg-[#F9F6F0] text-[#181615] border-[#E6E0D5] hover:border-[#181615]"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Visual Portrait Preview: AI 3×3 Tile or Portrait + Contour Overlay */}
                      <div className="relative h-60 rounded-xl overflow-hidden bg-[#221F1D] border border-black/15">
                        {hasAiTile ? (
                          <div
                            className="w-full h-full bg-no-repeat transition duration-500 group-hover:scale-105"
                            style={{
                              backgroundImage: `url("${aiGridImageUrl}")`,
                              backgroundSize: "300% 300%",
                              backgroundPosition: `${col * 50}% ${row * 50}%`,
                            }}
                          />
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreview}
                              alt={style.name}
                              className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                            />

                            {/* Subtle Hair Tone Lighting Gradient */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: `linear-gradient(180deg, ${style.recommendedToneHex}75 0%, transparent 55%, rgba(18,16,15,0.82) 100%)`,
                              }}
                            />

                            {/* Architectural Hairstyle Silhouette Overlay */}
                            <div className="absolute inset-0 flex items-start justify-center opacity-85">
                              {renderHairstyleSilhouetteSvg(
                                style.silhouetteVariant || idx + 1,
                                style.recommendedToneHex
                              )}
                            </div>
                          </>
                        )}

                        {isGeneratingAiGrid && (
                          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-full bg-black/80 text-[11px] font-mono-tech text-[#C89D66] border border-[#C89D66]/40 animate-pulse">
                              Synthesizing Style 0{idx + 1}...
                            </span>
                          </div>
                        )}

                        {/* Top Grid Cell Number & Category Badge */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-mono-tech font-semibold text-[#C89D66] border border-white/15">
                            0{idx + 1} / 09
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono-tech text-[#F9F6F0] truncate border border-white/15">
                            {style.lengthAndCut}
                          </span>
                        </div>

                        {/* Bottom Hair Gloss Tone Swatch */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-black/75 backdrop-blur-xs border border-white/15">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/40"
                              style={{
                                backgroundColor: style.recommendedToneHex,
                              }}
                            />
                            <span className="text-[11px] font-mono-tech text-[#E6E0D6] truncate">
                              {style.recommendedToneName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono-tech text-[#C89D66] shrink-0">
                            {style.recommendedToneHex}
                          </span>
                        </div>
                      </div>

                      {/* Title & Category */}
                      <div>
                        <span
                          className={`text-[11px] font-mono-tech uppercase tracking-wider block ${
                            isSelected ? "text-[#C89D66]" : "text-[#8C7A6B]"
                          }`}
                        >
                          {style.category}
                        </span>
                        <h4 className="font-display text-xl font-semibold mt-0.5">
                          {style.name}
                        </h4>
                      </div>

                      {/* Brief Description of the Style */}
                      <div className="space-y-1">
                        <span
                          className={`text-[10px] font-mono-tech uppercase tracking-widest block ${
                            isSelected ? "text-[#D8C3A5]" : "text-[#8C7A6B]"
                          }`}
                        >
                          The Style & Structure
                        </span>
                        <p
                          className={`text-xs leading-relaxed ${
                            isSelected ? "text-[#E6E0D6]" : "text-[#2E2A27]"
                          }`}
                        >
                          {style.styleDescription}
                        </p>
                      </div>
                    </div>

                    {/* Why It Complements the Person's Appearance */}
                    <div
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        isSelected
                          ? "bg-[#221F1D] border-[#3A322E] text-[#F9F6F0]"
                          : "bg-white border-[#E6E0D5] text-[#4A443F]"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-mono-tech uppercase tracking-wider block mb-1 font-semibold ${
                          isSelected ? "text-[#C89D66]" : "text-[#181615]"
                        }`}
                      >
                        Why It Complements Your Appearance
                      </span>
                      {style.whyItComplements}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CURATED OUTFIT LOOKBOOK */}
      {activeTab === "lookbook" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {report.curatedLookbook.map((outfit, index) => (
            <div
              key={outfit.id}
              className="bg-white rounded-3xl p-6 border border-[#E6E0D5] shadow-xs flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                    LOOK 0{index + 1} // {outfit.occasionLabel}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-semibold text-[#181615]">
                    {outfit.title}
                  </h3>
                  <p className="text-xs text-[#57504B] mt-1">{outfit.vibe}</p>
                </div>

                {/* Color Harmony Strip */}
                <div className="flex h-6 rounded-xl overflow-hidden border border-black/10">
                  {outfit.pieces.map((p, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{ backgroundColor: p.colorHex }}
                      title={`${p.colorName} (${p.colorHex})`}
                    />
                  ))}
                </div>

                {/* Outfit Pieces */}
                <div className="space-y-3 pt-2">
                  {outfit.pieces.map((piece, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-[#F9F6F0] border border-[#E6E0D5] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono-tech uppercase tracking-wider text-[#8C7A6B]">
                          {piece.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2E2A27]">
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: piece.colorHex }}
                          />
                          {piece.colorName}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#181615]">
                        {piece.item}
                      </p>
                      <p className="text-xs text-[#57504B]">{piece.fitNote}</p>
                      <p className="text-[11px] font-mono-tech text-[#8C7A6B] pt-0.5">
                        Suggested Label: {piece.brandSuggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#181615] text-[#F9F6F0] text-xs leading-relaxed">
                <span className="font-mono-tech uppercase tracking-wider text-[#C89D66] block mb-1">
                  Stylist Proportion Note
                </span>
                {outfit.stylistTip}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: SILHOUETTE RULES & CAPSULE SHOPPING LIST */}
      {activeTab === "shopping" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-6">
            <div>
              <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                Architectural Guidelines
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
                Silhouette, Fabric & Cut Rules
              </h3>
            </div>

            <div className="space-y-4">
              {report.silhouetteAndFit.keyPrinciples.map((principle, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F9F6F0] border border-[#E6E0D5]"
                >
                  <h4 className="font-semibold text-sm text-[#181615]">
                    {principle.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57504B] mt-1 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-[#E6E0D5]">
                <h4 className="text-xs font-mono-tech uppercase tracking-wider text-[#8C7A6B] mb-2">
                  Ideal Fabric Weights
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-[#2E2A27]">
                  {report.silhouetteAndFit.fabricRecommendations.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-[#E6E0D5]">
                <h4 className="text-xs font-mono-tech uppercase tracking-wider text-[#8C7A6B] mb-2">
                  Best Necklines & Collars
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-[#2E2A27]">
                  {report.silhouetteAndFit.necklinesAndCollars.map((n, i) => (
                    <li key={i}>• {n}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EFECE6] border border-[#E2DCD3]">
              <h4 className="text-xs font-mono-tech uppercase tracking-wider text-[#57504B] mb-1">
                Trouser Rise & Hem Specification
              </h4>
              <p className="text-xs sm:text-sm text-[#181615]">
                {report.silhouetteAndFit.trouserAndHemGuide}
              </p>
            </div>
          </div>

          {/* Interactive Capsule Shopping List */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-6">
            <div>
              <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8C7A6B]">
                Acquisition Roadmap
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
                Prioritized Capsule Checklist
              </h3>
              <p className="text-sm text-[#57504B] mt-1">
                Check off pieces as you build your personalized capsule wardrobe.
              </p>
            </div>

            <div className="space-y-3">
              {report.shoppingChecklist.map((item, idx) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleShopItem(idx)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                      isChecked
                        ? "bg-[#F4F1EA] border-[#D5CEC2] opacity-70"
                        : "bg-[#F9F6F0] border-[#E6E0D5] hover:border-[#181615]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 accent-[#181615] rounded cursor-pointer"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isChecked ? "line-through text-[#8C7A6B]" : "text-[#181615]"
                          }`}
                        >
                          {item.item}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tech bg-white border border-[#E2DCD3]">
                          {item.priority} · {item.estimatedPriceRange}
                        </span>
                      </div>
                      <p className="text-xs text-[#57504B]">
                        {item.specification}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
