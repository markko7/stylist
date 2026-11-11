"use client";

import React, { useState } from "react";
import { ConsultationReport, ExtractedPhotoMetrics } from "@/types/consultation";

interface ConsultationReportViewProps {
  report: ConsultationReport;
  imagePreview: string;
  photoMetrics: ExtractedPhotoMetrics;
  onReset: () => void;
}

export default function ConsultationReportView({
  report,
  imagePreview,
  photoMetrics,
  onReset,
}: ConsultationReportViewProps) {
  const [activeTab, setActiveTab] = useState<
    "proportions" | "colors" | "lookbook" | "shopping"
  >("proportions");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1600);
  };

  const toggleShopItem = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

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
          { id: "lookbook", label: "03. Curated Outfit Lookbook" },
          { id: "shopping", label: "04. Silhouette Rules & Capsule List" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id as "proportions" | "colors" | "lookbook" | "shopping"
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

      {/* TAB 3: CURATED OUTFIT LOOKBOOK */}
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
