import { NextRequest, NextResponse } from "next/server";
import { findMatchingMalaysianIngredient, MALAYSIAN_INGREDIENTS_DB } from "@/utils/malaysianIngredients";

// Active candidate models in order of priority (handles transient 503 or quota limits)
const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

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

    if (!activeKey || activeKey.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "NO_API_KEY",
          message: "No Gemini API key found. Please set GEMINI_API_KEY in .env.local or enter your key in settings.",
          suggestedFallback: MALAYSIAN_INGREDIENTS_DB.slice(0, 5),
        },
        { status: 401 }
      );
    }

    const trimmedKey = activeKey.trim();

    const PROMPT = `You are an expert Malaysian culinary inventory and vision AI for the "ZeroWaste Chef" system in Malaysia.
Analyze this kitchen photograph.

STEP 1 - FOOD VALIDATION GATE:
Determine if the primary subject in the photograph is an edible food, cooking ingredient, raw produce (vegetable, fruit, herb, spice), protein (meat, poultry, seafood, eggs), dairy, beverage, or packaged grocery item (sauces, pastes, seasonings, canned goods).
- If the subject is clearly NOT food or cooking ingredient (e.g. laptop, computer, mobile phone, keyboard, shoe, watch, clothing, electronic device, furniture, human face, pet animal, toy, household tool):
  Return strictly:
  {
    "isFood": false,
    "reason": "Clear, friendly explanation of what non-food object was detected (e.g. 'Laptop detected. Please scan fresh produce or kitchen ingredients.')"
  }

STEP 2 - MALAYSIAN CULINARY RECOGNITION (Only if isFood is true):
1. Identify the GENERIC food/ingredient name. DO NOT include commercial brand names, manufacturer logos, or slogans in "name" or "nameMalay" (e.g. for "Habhal's Cap Kipas Udang Kicap Manis", the food name is strictly "Sweet Soy Sauce" and "Kicap Manis", NEVER Udang or Habhal!).
2. Extract the brand name separately into the "brand" field (e.g. "Habhal's Cap Kipas Udang", "Ayam Brand", "Adabi", "Maggi", "Mahsuri", or null if unbranded fresh produce).
3. Set "category" to one of:
   "Vegetables & Greens", "Aromatics & Spices", "Pantry & Seasonings", "Proteins & Seafood", "Citrus & Fruits", "Herbs & Leaves", "Dairy & Bakery", "Grains & Rice".
4. Provide appropriate Malaysian culinary "emoji", "suggestedQuantity" (integer, default 1 or reasonable portion), and "suggestedUnit" (e.g. "biji", "batang", "ikat", "botol", "tin", "kotak", "paket", "kg", "g").
5. Provide a brief "culinaryNote" highlighting common Malaysian dishes (e.g. "Essential aromatic for Rendang, Laksa, and Tom Yam.").

Respond with STRICT JSON only (no markdown, no backticks, no code fence). Format:
{
  "isFood": true,
  "id": "serai",
  "name": "Lemongrass",
  "nameMalay": "Serai",
  "brand": null,
  "emoji": "🌿",
  "category": "Aromatics & Spices",
  "confidence": 98,
  "suggestedQuantity": 3,
  "suggestedUnit": "batang",
  "culinaryNote": "Essential Malaysian aromatic used in Rendang, Tom Yam, and Sambal."
}`;

    let lastError: string | null = null;
    let lastStatusCode = 500;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: PROMPT },
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

            // Step 1 Check: Non-food reject
            if (parsed.isFood === false) {
              return NextResponse.json({
                success: true,
                isFood: false,
                reason: parsed.reason || "The item scanned does not appear to be an edible food or kitchen ingredient.",
              });
            }

            // Step 2: Food item matched against Malaysian DB
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
              isFood: true,
              engine: `Gemini Vision AI (${model})`,
              data: parsed,
            });
          }
        } else {
          lastStatusCode = response.status;
          lastError = await response.text();
          console.warn(`Gemini model ${model} returned HTTP ${response.status}:`, lastError.slice(0, 200));
          // If rate limited or service unavailable, loop will try next candidate model
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`Failed calling Gemini model ${model}:`, lastError);
      }
    }

    // If all models failed
    return NextResponse.json(
      {
        success: false,
        error: "CLOUD_VISION_FAILED",
        message: "Gemini Vision cloud service is temporarily busy or rate-limited. Please retry in a moment.",
        details: lastError?.slice(0, 150),
      },
      { status: lastStatusCode >= 400 && lastStatusCode < 600 ? lastStatusCode : 503 }
    );
  } catch (error) {
    console.error("Classification route error:", error);
    return NextResponse.json(
      { error: "Internal classification failure" },
      { status: 500 }
    );
  }
}
