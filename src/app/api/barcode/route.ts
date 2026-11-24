import { NextRequest, NextResponse } from "next/server";
import { findMatchingMalaysianIngredient } from "@/utils/malaysianIngredients";

function inferCategoryAndEmoji(tags: string[], name: string): {
  category: string;
  emoji: string;
  unit: string;
} {
  const joined = `${tags.join(" ")} ${name}`.toLowerCase();

  if (/milk|dairy|yogurt|cheese|butter|cream|santan|coconut milk/.test(joined)) {
    return { category: "Dairy & Eggs", emoji: "🥛", unit: "kotak" };
  }
  if (/egg/.test(joined)) {
    return { category: "Dairy & Eggs", emoji: "🥚", unit: "biji" };
  }
  if (/chicken|beef|meat|fish|tuna|sardine|prawn|seafood|tofu|tempeh/.test(joined)) {
    return { category: "Proteins", emoji: "🍗", unit: "tin" };
  }
  if (/sauce|kicap|paste|spice|seasoning|curry|chilli|chili|soy|vinegar|oil|salt|sugar|pepper/.test(joined)) {
    return { category: "Seasoning", emoji: "🧂", unit: "botol" };
  }
  if (/fruit|apple|banana|orange|lemon|lime|mango/.test(joined)) {
    return { category: "Produce", emoji: "🍎", unit: "biji" };
  }
  if (/veg|spinach|tomato|potato|onion|garlic|carrot|cabbage|broccoli|corn/.test(joined)) {
    return { category: "Produce", emoji: "🥬", unit: "g" };
  }
  if (/noodle|pasta|rice|flour|bread|biscuit|cereal|oat/.test(joined)) {
    return { category: "Staples", emoji: "🌾", unit: "bungkus" };
  }
  if (/drink|tea|coffee|milo|water|juice|beverage/.test(joined)) {
    return { category: "Staples", emoji: "🧃", unit: "kotak" };
  }
  return { category: "Staples", emoji: "📦", unit: "pcs" };
}

function parseNetQuantity(rawQty?: string, fallbackUnit = "pcs"): {
  suggestedQuantity: number;
  suggestedUnit: string;
} {
  if (!rawQty) return { suggestedQuantity: 1, suggestedUnit: fallbackUnit };
  const m = rawQty.trim().match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|pcs)\b/i);
  if (m) {
    const val = Number(m[1]);
    const u = m[2].toLowerCase();
    if (u === "kg" || u === "l") {
      return { suggestedQuantity: Math.max(1, Math.round(val)), suggestedUnit: u };
    }
    if (u === "g" || u === "ml") {
      return { suggestedQuantity: Math.round(val), suggestedUnit: u };
    }
  }
  return { suggestedQuantity: 1, suggestedUnit: fallbackUnit };
}

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") || "").replace(/\s+/g, "").trim();

  if (!/^\d{6,14}$/.test(code)) {
    return NextResponse.json(
      { found: false, error: "Please enter a valid 6–14 digit barcode." },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_en,generic_name,brands,quantity,categories_tags,image_front_small_url,image_url`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "ZeroWasteChef/3.0 (kitchen-pantry-scanner)",
        },
      }
    );
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({ found: false, barcode: code, error: "Barcode lookup failed." }, { status: 404 });
    }

    const json = await res.json();
    if (json.status !== 1 || !json.product) {
      return NextResponse.json(
        { found: false, barcode: code, error: `No product found for barcode ${code}.` },
        { status: 404 }
      );
    }

    const p = json.product;
    const rawName: string =
      p.product_name_en || p.product_name || p.generic_name || "";

    if (!rawName.trim()) {
      return NextResponse.json(
        { found: false, barcode: code, error: `Product ${code} has no listed name.` },
        { status: 404 }
      );
    }

    const cleanName = rawName.trim();
    const brand = typeof p.brands === "string" && p.brands.trim() ? p.brands.split(",")[0].trim() : "";
    const localMatch = findMatchingMalaysianIngredient(cleanName);
    const inferred = inferCategoryAndEmoji(Array.isArray(p.categories_tags) ? p.categories_tags : [], cleanName);
    const parsedQty = parseNetQuantity(p.quantity, localMatch?.defaultUnit || inferred.unit);

    return NextResponse.json({
      found: true,
      barcode: code,
      engine: "Open Food Facts Barcode DB",
      data: {
        name: cleanName,
        nameMalay: localMatch?.nameMalay || (brand ? brand : ""),
        brand: brand || null,
        category: localMatch?.category || inferred.category,
        emoji: localMatch?.emoji || inferred.emoji,
        confidence: 99,
        suggestedQuantity: parsedQty.suggestedQuantity,
        suggestedUnit: parsedQty.suggestedUnit,
        imageUrl: p.image_front_small_url || p.image_url || undefined,
        culinaryNote: brand
          ? `${brand} (${p.quantity || parsedQty.suggestedUnit}) • Scanned barcode #${code}`
          : `Scanned barcode #${code}${p.quantity ? ` (${p.quantity})` : ""}`,
      },
    });
  } catch (err) {
    console.warn("Barcode API error:", err);
    return NextResponse.json(
      { found: false, barcode: code, error: "Barcode service timed out or offline." },
      { status: 502 }
    );
  }
}
