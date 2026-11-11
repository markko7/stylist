import { HairstyleGridItem } from "../../src/types/consultation";

export interface Env {
  OPENAI_API_KEY?: string;
}

interface PagesEventContext<E = Env> {
  request: Request;
  env: E;
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
    const body = (await context.request.json()) as {
      hairstyleGrid?: HairstyleGridItem[];
      faceShapeSummary?: string;
      genderFit?: string;
      season?: string;
      clientApiKey?: string;
    };

    const openAiKey = body.clientApiKey?.trim().startsWith("sk-")
      ? body.clientApiKey.trim()
      : context.env?.OPENAI_API_KEY;

    if (!openAiKey) {
      return Response.json(
        {
          error:
            "OpenAI API key not configured. Use the built-in Studio 3×3 Grid Exporter or configure OPENAI_API_KEY.",
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const stylesList = (body.hairstyleGrid || [])
      .slice(0, 9)
      .map((item, idx) => `${idx + 1}. ${item.name} (${item.lengthAndCut})`)
      .join("; ");

    const prompt = `Editorial salon lookbook 3x3 grid composite featuring nine distinct complementary hairstyles for a ${
      body.genderFit || "contemporary"
    } client (${body.season || "neutral"} palette, ${
      body.faceShapeSummary || "balanced facial proportions"
    }): ${stylesList}. Clean studio lighting, warm alabaster background, high-fashion portrait photography, 3 rows by 3 columns grid layout.`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!response.ok) {
      const errData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return Response.json(
        {
          error:
            errData?.error?.message ||
            "OpenAI image generation request could not be completed.",
        },
        { status: response.status, headers: CORS_HEADERS }
      );
    }

    const data = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const imageUrl = data?.data?.[0]?.url;

    return Response.json(
      { imageUrl },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Cloudflare Pages Function /api/hairstyle-grid error:", error);
    return Response.json(
      { error: "Unable to generate AI 3x3 hairstyle sheet." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
