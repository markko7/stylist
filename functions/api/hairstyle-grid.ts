import { HairstyleGridItem } from "../../src/types/consultation";

export interface WorkersAI {
  run: (
    model: string,
    inputs: Record<string, unknown>
  ) => Promise<unknown>;
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBlob(base64Data: string, mimeType: string): Blob {
  const byteChars = atob(base64Data);
  const buffer = new ArrayBuffer(byteChars.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < byteChars.length; i++) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  return new Blob([buffer], { type: mimeType });
}

async function extractPersonDescription(
  imageBase64: string | undefined,
  openAiKey: string | undefined,
  geminiKey: string | undefined,
  fallbackSeason?: string
): Promise<string> {
  if (
    !imageBase64 ||
    !/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(imageBase64)
  ) {
    return `a stylish ${fallbackSeason || "warm-toned"} portrait subject with balanced facial features`;
  }

  const visionPrompt =
    "Describe the person in this photo in 2 detailed sentences for a portrait illustrator creating a 3x3 hairstyle lookbook of this exact person: include gender presentation, approximate age, ethnicity/skin tone, face shape, eye color, eyebrows, nose/lip structure, current hair color/texture, glasses if any, and expression. Do not include names.";

  // 1. Try OpenAI gpt-4o-mini Vision if available
  if (openAiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: visionPrompt },
                {
                  type: "image_url",
                  image_url: { url: imageBase64, detail: "low" },
                },
              ],
            },
          ],
          max_tokens: 180,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch {
      // Fall through to Gemini Vision
    }
  }

  // 2. Try Gemini 2.5 Flash Vision
  if (geminiKey) {
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
                  { text: visionPrompt },
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
      // Ignore
    }
  }

  return `a stylish ${fallbackSeason || "contemporary"} portrait subject with balanced facial features`;
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
          `Panel ${idx + 1} (Row ${Math.floor(idx / 3) + 1}, Col ${
            (idx % 3) + 1
          }): ${item.name} (${item.lengthAndCut})`
      )
      .join("; ");

    const hasRasterPhoto =
      Boolean(body.imageBase64) &&
      /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(body.imageBase64 || "");

    // 1. Try OpenAI gpt-image-1 Image Edit with the attached photo first (if OPENAI_API_KEY is present)
    if (openAiKey && hasRasterPhoto && body.imageBase64) {
      try {
        const mimeMatch = body.imageBase64.match(
          /^data:(image\/[\w+]+);base64,/i
        );
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        const base64Data = body.imageBase64.replace(
          /^data:image\/[\w+]+;base64,/i,
          ""
        );
        const imageBlob = base64ToBlob(base64Data, mimeType);
        const ext = mimeType.includes("png") ? "png" : "jpg";

        const editPrompt = `Create a seamless 3x3 grid (3 rows by 3 columns, 9 equal square panels filling the entire canvas with no outer border) featuring nine different hairstyles that best suit the person in the attached photo, preserving their exact facial identity and likeness in every panel: ${stylesList}. Photorealistic studio portrait lighting.`;

        const formData = new FormData();
        formData.append("model", "gpt-image-1");
        formData.append("image", imageBlob, `portrait.${ext}`);
        formData.append("prompt", editPrompt);
        formData.append("size", "1024x1024");

        const editRes = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
          },
          body: formData,
        });

        if (editRes.ok) {
          const editData = (await editRes.json()) as {
            data?: Array<{ b64_json?: string; url?: string }>;
          };
          const b64 = editData?.data?.[0]?.b64_json;
          const url = editData?.data?.[0]?.url;
          if (b64) {
            return Response.json(
              {
                imageUrl: `data:image/png;base64,${b64}`,
                provider: "openai-gpt-image-1",
              },
              { status: 200, headers: CORS_HEADERS }
            );
          }
          if (url) {
            return Response.json(
              {
                imageUrl: url,
                provider: "openai-gpt-image-1",
              },
              { status: 200, headers: CORS_HEADERS }
            );
          }
        }
      } catch (err) {
        console.warn("OpenAI gpt-image-1 edit fallback:", err);
      }
    }

    // 2. Try Gemini 2.5 Flash Image with the attached photo (if GEMINI_API_KEY is present)
    if (geminiKey) {
      try {
        const geminiPrompt = `Create a seamless 3x3 grid composite image (3 rows by 3 columns, 9 equal square panels) featuring nine different hairstyles that would best suit the person in the attached photo, preserving the person's facial identity and likeness in each of the 9 panels: ${stylesList}. Use clean studio portrait lighting on a warm neutral editorial background.`;

        const parts: Array<Record<string, unknown>> = [{ text: geminiPrompt }];

        if (hasRasterPhoto && body.imageBase64) {
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
        }
      } catch (err) {
        console.warn("Gemini image generation error:", err);
      }
    }

    // Extract detailed appearance description from the uploaded photo using Vision (OpenAI or Gemini)
    const personDesc = await extractPersonDescription(
      body.imageBase64,
      openAiKey,
      geminiKey,
      body.season
    );

    // 3. Try OpenAI DALL-E 3 (with b64_json so the image never expires and can be sliced into the 9 cards!)
    if (openAiKey) {
      try {
        const dallePrompt = `A seamless 3x3 grid contact sheet (3 rows by 3 columns, 9 equal square portrait panels filling the entire frame) showing the exact same person (${personDesc}) wearing 9 different complementary hairstyles: ${stylesList}. Photorealistic high-fashion salon lookbook photography, studio lighting, consistent face across all 9 panels.`;

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
              prompt: dallePrompt,
              n: 1,
              size: "1024x1024",
              response_format: "b64_json",
            }),
          }
        );

        if (response.ok) {
          const data = (await response.json()) as {
            data?: Array<{ url?: string; b64_json?: string }>;
          };
          const b64 = data?.data?.[0]?.b64_json;
          const url = data?.data?.[0]?.url;
          if (b64) {
            return Response.json(
              {
                imageUrl: `data:image/png;base64,${b64}`,
                provider: "openai-dalle3",
              },
              { status: 200, headers: CORS_HEADERS }
            );
          }
          if (url) {
            return Response.json(
              { imageUrl: url, provider: "openai-dalle3" },
              { status: 200, headers: CORS_HEADERS }
            );
          }
        }
      } catch (openAiErr) {
        console.warn("OpenAI DALL-E 3 error:", openAiErr);
      }
    }

    // 4. Fallback to Cloudflare Workers AI (Flux-1-Schnell or SDXL-Lightning)
    if (context.env?.AI) {
      const aiPrompt = `Seamless 3x3 grid contact sheet (3 rows by 3 columns, 9 equal square portrait panels) of the exact same person (${personDesc}), each panel showing a different complementary hairstyle: ${stylesList}. Warm cream studio background, editorial salon lookbook, photorealistic, sharp focus.`;

      try {
        const sdxlStream = await context.env.AI.run(
          "@cf/bytedance/stable-diffusion-xl-lightning",
          {
            prompt: aiPrompt,
          }
        );
        const ab = await new Response(sdxlStream as BodyInit).arrayBuffer();
        if (ab.byteLength > 0) {
          const b64 = arrayBufferToBase64(ab);
          return Response.json(
            {
              imageUrl: `data:image/png;base64,${b64}`,
              provider: "cloudflare-sdxl",
            },
            { status: 200, headers: CORS_HEADERS }
          );
        }
      } catch (sdxlErr) {
        console.warn("Workers AI SDXL fallback error:", sdxlErr);
      }
    }

    return Response.json(
      {
        error:
          "Could not generate AI 3×3 hairstyle sheet. Displaying the Atelier 3×3 Composite Sheet.",
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
