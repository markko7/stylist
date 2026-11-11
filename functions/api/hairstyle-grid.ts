import { HairstyleGridItem } from "../../src/types/consultation";

export interface WorkersAI {
  run: (
    model: string,
    inputs: Record<string, unknown>
  ) => Promise<{ image?: string } | ReadableStream | Uint8Array>;
}

export interface Env {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AI?: WorkersAI;
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

async function extractPersonPortraitDescriptionWithGemini(
  geminiKey: string,
  imageBase64?: string,
  fallbackSeason?: string
): Promise<string> {
  if (
    !imageBase64 ||
    !/^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,/i.test(imageBase64)
  ) {
    return `a stylish ${fallbackSeason || "warm-toned"} portrait model with balanced facial features`;
  }

  try {
    const mimeMatch = imageBase64.match(/^data:(image\/[\w+]+);base64,/i);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Data = imageBase64.replace(/^data:image\/[\w+]+;base64,/i, "");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Describe the person in this portrait in 1 concise sentence for an artist creating a hairstyle reference sheet (mention approximate age range, gender presentation, skin tone, face shape, eye color, hair color, and expression, without any names or PII).",
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    }
  } catch {
    // Ignore and use fallback
  }

  return `a stylish ${fallbackSeason || "contemporary"} portrait model with balanced facial features`;
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

    const stylesList = (body.hairstyleGrid || [])
      .slice(0, 9)
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.name} (${item.lengthAndCut})`
      )
      .join(", ");

    let geminiQuotaMessage = "";

    // 1. Try Gemini 2.5 Flash Image first if GEMINI_API_KEY is present
    if (geminiKey) {
      const geminiPrompt = `Create a 3x3 grid composite image featuring nine different hairstyles that would best suit the person in the attached photo, preserving the person's facial identity and likeness in each of the 9 panels: ${stylesList}. Use clean studio portrait lighting on a warm neutral editorial background.`;

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

      if (geminiRes.ok) {
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
      } else {
        const errData = (await geminiRes.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        geminiQuotaMessage =
          errData?.error?.message ||
          `Gemini returned HTTP ${geminiRes.status}`;
      }
    }

    // 2. If Gemini Image model hit Free Tier quota (limit: 0 on Free Tier),
    // use Gemini 2.5 Flash Vision (Free Tier supported) + Cloudflare Workers AI Flux-1-Schnell!
    if (context.env?.AI) {
      const personDesc = geminiKey
        ? await extractPersonPortraitDescriptionWithGemini(
            geminiKey,
            body.imageBase64,
            body.season
          )
        : `a stylish ${body.genderFit || "contemporary"} model (${
            body.season || "neutral undertone"
          })`;

      const fluxPrompt = `High-fashion studio photography 3x3 grid contact sheet of 9 head-and-shoulders portraits of the exact same person (${personDesc}), each panel showing a different complementary hairstyle: ${stylesList}. Symmetrical 3 rows by 3 columns layout, warm cream studio background, editorial salon lookbook, photorealistic, sharp focus.`;

      const aiResult = (await context.env.AI.run(
        "@cf/black-forest-labs/flux-1-schnell",
        {
          prompt: fluxPrompt,
          num_steps: 4,
        }
      )) as { image?: string };

      if (aiResult && typeof aiResult.image === "string" && aiResult.image) {
        return Response.json(
          {
            imageUrl: `data:image/jpeg;base64,${aiResult.image}`,
            provider: "gemini-vision+cloudflare-flux",
          },
          { status: 200, headers: CORS_HEADERS }
        );
      }
    }

    // 3. Fallback to OpenAI DALL-E 3 if OPENAI_API_KEY is present
    if (openAiKey) {
      const prompt = `Editorial salon lookbook 3x3 grid composite featuring nine distinct complementary hairstyles for a ${
        body.genderFit || "contemporary"
      } client (${body.season || "neutral"} palette, ${
        body.faceShapeSummary || "balanced facial proportions"
      }): ${stylesList}. Clean studio lighting, warm alabaster background, high-fashion portrait photography, 3 rows by 3 columns grid layout.`;

      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
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
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          data?: Array<{ url?: string; b64_json?: string }>;
        };
        const imageUrl = data?.data?.[0]?.url;
        if (imageUrl) {
          return Response.json(
            { imageUrl, provider: "openai-dalle3" },
            { status: 200, headers: CORS_HEADERS }
          );
        }
      }
    }

    return Response.json(
      {
        error:
          geminiQuotaMessage ||
          "Gemini Free Tier has limit: 0 for gemini-2.5-flash-image. Enable billing in Google AI Studio or use the built-in 3×3 Poster Generator.",
      },
      { status: 429, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Cloudflare Pages Function /api/hairstyle-grid error:", error);
    return Response.json(
      { error: "Unable to generate AI 3x3 hairstyle sheet." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
