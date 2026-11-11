import { HairstyleGridItem } from "../../src/types/consultation";

export interface Env {
  GEMINI_API_KEY?: string;
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
      imageBase64?: string;
      hairstyleGrid?: HairstyleGridItem[];
      faceShapeSummary?: string;
      genderFit?: string;
      season?: string;
      clientApiKey?: string;
    };

    const geminiKey = body.clientApiKey?.trim().startsWith("AIza")
      ? body.clientApiKey.trim()
      : context.env?.GEMINI_API_KEY;

    const openAiKey = body.clientApiKey?.trim().startsWith("sk-")
      ? body.clientApiKey.trim()
      : context.env?.OPENAI_API_KEY;

    if (!geminiKey && !openAiKey) {
      return Response.json(
        {
          error:
            "Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured in Cloudflare Pages.",
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const stylesList = (body.hairstyleGrid || [])
      .slice(0, 9)
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.name} (${item.lengthAndCut}): ${item.styleDescription}`
      )
      .join("\n");

    // 1. Prefer Gemini 2.5 Flash Image (multimodal photo-to-3x3 hairstyle grid)
    if (geminiKey) {
      const geminiPrompt = `Create a 3x3 grid composite image featuring nine different hairstyles that would best suit the person in the attached photo, preserving the person's facial identity and likeness in each of the 9 panels.
Label each panel subtly from 1 to 9 corresponding to these nine complementary hairstyles:
${stylesList}
Use clean, flattering studio portrait lighting on a warm neutral editorial background.`;

      const parts: Array<Record<string, unknown>> = [{ text: geminiPrompt }];

      if (
        body.imageBase64 &&
        /^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,/i.test(
          body.imageBase64
        )
      ) {
        const mimeMatch = body.imageBase64.match(
          /^data:(image\/[\w+]+);base64,/i
        );
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const base64Data = body.imageBase64.replace(
          /^data:image\/[\w+]+;base64,/i,
          ""
        );
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data,
          },
        });
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errData = (await geminiRes.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        return Response.json(
          {
            error:
              errData?.error?.message ||
              "Gemini image generation request could not be completed.",
          },
          { status: geminiRes.status, headers: CORS_HEADERS }
        );
      }

      const geminiData = (await geminiRes.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
              inlineData?: { mimeType?: string; data?: string };
              inline_data?: { mime_type?: string; data?: string };
            }>;
          };
        }>;
      };

      const candidateParts =
        geminiData?.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        const inline = part.inlineData || part.inline_data;
        const b64 = inline?.data;
        const mime =
          (part.inlineData && part.inlineData.mimeType) ||
          (part.inline_data && part.inline_data.mime_type) ||
          "image/png";
        if (b64) {
          return Response.json(
            {
              imageUrl: `data:${mime};base64,${b64}`,
              provider: "gemini-2.5-flash-image",
            },
            { status: 200, headers: CORS_HEADERS }
          );
        }
      }

      return Response.json(
        {
          error:
            "Gemini responded without an inline image part. Try regenerating with a clear portrait photo.",
        },
        { status: 422, headers: CORS_HEADERS }
      );
    }

    // 2. Fallback to OpenAI DALL-E 3 if OPENAI_API_KEY is configured
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
      { imageUrl, provider: "openai-dalle3" },
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
