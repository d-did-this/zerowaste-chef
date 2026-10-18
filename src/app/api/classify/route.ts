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

    const activeKey =
      apiKey ||
      req.headers.get("x-gemini-key") ||
      process.env.GEMINI_API_KEY;

    if (activeKey && activeKey.trim() !== "") {
      try {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": activeKey.trim(),
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert Malaysian culinary inventory and vision AI for the "ZeroWaste Chef" system in Malaysia.
Analyze this kitchen photograph. The image may contain raw produce (e.g. Serai, Bawang, Cili, Bendi, Halia, Sayur) OR packaged grocery/pantry essentials (e.g. bottles of Kicap Manis, Sos Tiram, Minyak Masak, Santan kotak, Belacan, Susu Pekat).

CRITICAL INSTRUCTION - DEFENSE-IN-DEPTH FOOD vs BRAND SEPARATION:
1. Identify the GENERIC food/ingredient name. DO NOT include commercial brand names, manufacturer logos, or slogans in "name" or "nameMalay" (e.g. for "Habhal's Cap Kipas Udang Kicap Manis", the food name is strictly "Sweet Soy Sauce" and "Kicap Manis", NEVER Udang!).
2. Extract the brand name separately into the "brand" field (e.g. "Habhal's Cap Kipas Udang", "Ayam Brand", "Adabi", "Maggi", or null if unbranded fresh produce).
3. Set "category" to one of: "Pantry & Seasonings", "Vegetables & Greens", "Aromatics & Spices", "Proteins & Seafood", "Citrus & Fruits", "Herbs & Leaves".

Respond with STRICT JSON only (no markdown, no backticks, no markdown codeblock). Format:
{
  "id": "kicap_manis",
  "name": "Sweet Soy Sauce",
  "nameMalay": "Kicap Manis",
  "brand": "Habhal's Cap Kipas Udang",
  "emoji": "🍾",
  "category": "Pantry & Seasonings",
  "confidence": 98,
  "suggestedQuantity": 1,
  "suggestedUnit": "botol",
  "culinaryNote": "Essential Malaysian seasoning used for Ayam Masak Kicap, Nasi Goreng, and dipping sauces."
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

            // Layer 2 & 3: Match against Malaysian DB using Longest Match + Category Domain
            const queryCandidate = parsed.nameMalay || parsed.name;
            const matchedDb = findMatchingMalaysianIngredient(queryCandidate, parsed.category);
            if (matchedDb) {
              parsed.id = matchedDb.id;
              parsed.emoji = matchedDb.emoji;
              parsed.nameMalay = matchedDb.nameMalay;
              parsed.name = matchedDb.name;
              parsed.category = matchedDb.category;
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
