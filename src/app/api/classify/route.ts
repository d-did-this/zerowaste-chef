import { NextRequest, NextResponse } from "next/server";
import { findMatchingMalaysianIngredient, MALAYSIAN_INGREDIENTS_DB } from "@/utils/malaysianIngredients";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Extract base64 and mime type
    const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    const mimeType = match ? match[1] : "image/jpeg";
    const base64Data = match ? match[2] : image;

    // Determine active API key (Client override -> Header -> Environment variable)
    const activeKey =
      apiKey ||
      req.headers.get("x-gemini-key") ||
      process.env.GEMINI_API_KEY;

    if (activeKey && activeKey.trim() !== "") {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeKey.trim()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert Malaysian culinary botanist and food inventory vision AI for the "ZeroWaste Chef" system in Malaysia. 
Analyze this kitchen ingredient photograph. Identify the specific raw ingredient according to Malaysian market & cooking standards (e.g. specifically recognize Serai, Lengkuas, Halia, Kunyit, Bawang Merah, Bawang Holland, Cili Padi, Cili Merah, Bendi, Kangkung, Daun Kesum, Bunga Kantan, Ikan Bilis, Tauhu, etc.).

Respond with STRICT JSON only (no markdown, no backticks, no markdown codeblock). Format:
{
  "id": "serai",
  "name": "Lemongrass",
  "nameMalay": "Serai",
  "emoji": "🌾",
  "category": "Aromatics & Spices",
  "confidence": 96,
  "suggestedQuantity": 3,
  "suggestedUnit": "batang",
  "culinaryNote": "Pounded or bruised for fragrant curries, rendang, and tomyam."
}`,
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
              generationConfig: {
                temperature: 0.1,
                response_mime_type: "application/json",
              },
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);

            // Cross-reference with our Malaysian DB for consistency if possible
            const matchedDb = findMatchingMalaysianIngredient(parsed.name || parsed.nameMalay);
            if (matchedDb) {
              parsed.emoji = matchedDb.emoji;
              parsed.nameMalay = matchedDb.nameMalay;
              parsed.suggestedUnit = parsed.suggestedUnit || matchedDb.defaultUnit;
            }

            return NextResponse.json({
              success: true,
              engine: "Gemini Vision AI (Malaysian Culinary Engine)",
              data: parsed,
            });
          }
        } else {
          const errText = await response.text();
          console.warn("Gemini Vision API error:", errText);
        }
      } catch (geminiError) {
        console.warn("Failed calling Gemini Vision API:", geminiError);
      }
    }

    // Fallback: If no API key or vision call failed, provide helpful guidance
    return NextResponse.json({
      success: false,
      message: "No Gemini API key provided. Set GEMINI_API_KEY or enter your key in settings.",
      suggestedFallback: MALAYSIAN_INGREDIENTS_DB.slice(0, 5),
    });
  } catch (error) {
    console.error("Classification route error:", error);
    return NextResponse.json(
      { error: "Internal classification failure" },
      { status: 500 }
    );
  }
}
