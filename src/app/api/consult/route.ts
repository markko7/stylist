import { NextRequest } from "next/server";
import { ConsultationRequest } from "@/types/consultation";
import { generateConsultationWithOptionalAI } from "@/lib/consultationEngine";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ConsultationRequest>;

    const heightCm = Number(body.heightCm);
    const weightKg = Number(body.weightKg);

    if (!body.imageBase64) {
      return Response.json(
        { error: "Please upload or select a photo to run the style analysis." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(heightCm) ||
      heightCm < 120 ||
      heightCm > 235 ||
      !Number.isFinite(weightKg) ||
      weightKg < 30 ||
      weightKg > 250
    ) {
      return Response.json(
        {
          error:
            "Please enter valid height (120–235 cm / 4'0\"–7'8\") and weight (30–250 kg / 66–550 lbs) measurements.",
        },
        { status: 400 }
      );
    }

    const sanitizedRequest: ConsultationRequest = {
      imageBase64: body.imageBase64,
      photoMetrics: body.photoMetrics ?? {
        dominantColors: ["#2E221D", "#C19A6B", "#EDE6D6", "#A84A32"],
        warmthScore: 18,
        contrastScore: 55,
        brightnessScore: 48,
      },
      unitSystem: body.unitSystem ?? "imperial",
      heightCm,
      weightKg,
      genderFit: body.genderFit ?? "womenswear",
      aesthetic: body.aesthetic ?? "quiet-luxury",
      occasion: body.occasion ?? "everyday-elevated",
      budget: body.budget ?? "contemporary",
      fitPreference: body.fitPreference ?? "tailored",
      customNotes: body.customNotes ?? "",
      clientApiKey: body.clientApiKey ?? "",
    };

    const report = await generateConsultationWithOptionalAI(sanitizedRequest);

    return Response.json(report);
  } catch (error) {
    console.error("Consultation API error:", error);
    return Response.json(
      { error: "Unable to process consultation request. Please check your inputs." },
      { status: 500 }
    );
  }
}
