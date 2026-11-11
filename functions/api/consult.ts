import { ConsultationRequest } from "../../src/types/consultation";
import { generateConsultationWithOptionalAI } from "../../src/lib/consultationEngine";

export interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  GEMINI_API_KEY?: string;
}

interface PagesEventContext<E = Env> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost(
  context: PagesEventContext<Env>
): Promise<Response> {
  try {
    const body = (await context.request.json()) as Partial<ConsultationRequest>;

    const heightCm = Number(body.heightCm);
    const weightKg = Number(body.weightKg);

    if (!body.imageBase64) {
      return Response.json(
        { error: "Please upload or select a photo to run the style analysis." },
        { status: 400, headers: CORS_HEADERS }
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
        { status: 400, headers: CORS_HEADERS }
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

    const report = await generateConsultationWithOptionalAI(sanitizedRequest, {
      openAiApiKey: context.env?.OPENAI_API_KEY,
      openAiModel: context.env?.OPENAI_MODEL,
      geminiApiKey: context.env?.GEMINI_API_KEY,
    });

    return Response.json(report, {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("Cloudflare Pages Function /api/consult error:", error);
    return Response.json(
      {
        error:
          "Unable to process style consultation request. Please check your inputs.",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
