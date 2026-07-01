import { NextResponse } from "next/server";

type Marketplace = "Amazon" | "Flipkart" | "Meesho" | "Myntra" | "Other";

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function titleFromSlug(value: string) {
  return decodeURIComponent(value)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function detectLink(rawUrl: string) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported URL protocol");
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const pathParts = url.pathname.split("/").filter(Boolean);
  const slugCandidate = pathParts.find((part) => !["dp", "gp", "product", "p", "itm"].includes(part.toLowerCase()));
  let marketplace: Marketplace = "Other";
  let externalId = url.searchParams.get("pid") || url.searchParams.get("lid") || "";

  if (host.includes("amazon.")) {
    marketplace = "Amazon";
    externalId = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1] || externalId;
  } else if (host.includes("flipkart.")) {
    marketplace = "Flipkart";
    externalId = url.searchParams.get("pid") || pathParts.at(-1) || externalId;
  } else if (host.includes("meesho.")) {
    marketplace = "Meesho";
    externalId = pathParts.at(-1) || externalId;
  } else if (host.includes("myntra.")) {
    marketplace = "Myntra";
    externalId = pathParts.findLast((part) => /^\d+$/.test(part)) || externalId;
  }

  return {
    marketplace,
    externalId,
    fallbackName: titleFromSlug(slugCandidate || `${marketplace} Product`),
    sourceUrl: url.toString()
  };
}

function metaContent(html: string, pattern: RegExp) {
  return cleanText(html.match(pattern)?.[1]?.replace(/&quot;/g, "\"").replace(/&amp;/g, "&"));
}

function parsePrice(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  const { url: rawUrl } = await request.json();
  if (!rawUrl || typeof rawUrl !== "string") {
    return NextResponse.json({ error: "Product URL is required" }, { status: 400 });
  }

  let detected;
  try {
    detected = detectLink(rawUrl);
  } catch {
    return NextResponse.json({ error: "Enter a valid product URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = windowlessTimeout(() => controller.abort(), 8000);
    const response = await fetch(detected.sourceUrl, {
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en-IN,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
      }
    });
    clearTimeout(timeout);

    const html = await response.text();
    const rawTitle =
      metaContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      metaContent(html, /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      metaContent(html, /<title[^>]*>([^<]+)<\/title>/i);
    const blockedOrMissingTitle = /page not found|robot check|captcha|access denied/i.test(rawTitle);
    const title = blockedOrMissingTitle ? detected.fallbackName : rawTitle || detected.fallbackName;
    const image =
      metaContent(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      metaContent(html, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const priceText =
      metaContent(html, /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      metaContent(html, /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["'][^>]*>/i);

    return NextResponse.json({
      ...detected,
      name: title,
      imageUrl: image,
      price: parsePrice(priceText)
    });
  } catch {
    return NextResponse.json({
      ...detected,
      name: detected.fallbackName,
      imageUrl: "",
      price: 0,
      warning: "Marketplace metadata could not be read. A draft was created from the URL."
    });
  }
}

function windowlessTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}
