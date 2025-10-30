#!/usr/bin/env -S deno run --allow-all

/**
 * Enrich media for places using DuckDuckGo image results (UNOFFICIAL)
 * - Fetches up to 5 image URLs (not binaries) per place
 * - Saves URLs to MediaLibrary via seedMedia
 * - Server-side only; add small delays to avoid throttling
 *
 * Usage:
 *   deno run --allow-all scripts/enrich-media-from-ddg.ts [limit]
 *   If limit is omitted, processes ALL places without media
 */

import PlaceCatalogConcept from "../src/concepts/PlaceCatalog/PlaceCatalogConcept.ts";
import MediaLibraryConcept from "../src/concepts/MediaLibrary/MediaLibraryConcept.ts";
import { getDb } from "../src/utils/database.ts";

// Remove limit to process all places, or optionally set a limit via CLI arg
const limit = Deno.args[0] ? parseInt(Deno.args[0]) : undefined;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getVqdToken(query: string): Promise<string | null> {
  const url = `https://duckduckgo.com/?q=${
    encodeURIComponent(query)
  }&iax=images&ia=images`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://duckduckgo.com/",
    },
  });
  const html = await res.text();
  // vqd is embedded in page scripts, extract via regex (can contain letters, numbers, dashes)
  let match = html.match(/vqd\s*[:=]\s*['\"]([A-Za-z0-9-]+)['\"]/);
  if (match?.[1]) return match[1];
  // fallback pattern
  match = html.match(/\bvqd=([A-Za-z0-9-]+)/);
  return match?.[1] ?? null;
}

interface DdgImageResult {
  image?: string;
  thumbnail?: string;
}
interface DdgResponse {
  results?: DdgImageResult[];
  next?: string;
}

async function ddgImages(query: string, max: number): Promise<string[]> {
  const vqd = await getVqdToken(query);
  if (!vqd) return [];
  const api = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${
    encodeURIComponent(query)
  }&vqd=${vqd}&f=type:photo,size:Large&iax=images&ia=images&p=1`;
  try {
    const res = await fetch(api, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://duckduckgo.com/",
      },
    });
    if (!res.ok) return [];
    const data: DdgResponse = await res.json() as unknown as DdgResponse;
    const results: DdgImageResult[] = data?.results ?? [];
    const urls: string[] = [];
    for (const r of results) {
      if (typeof r.image === "string") urls.push(r.image);
      if (urls.length >= max) break;
    }
    // Attempt a second page if not enough and next link available
    if (urls.length < max && typeof data?.next === "string") {
      try {
        const res2 = await fetch(data.next, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://duckduckgo.com/",
          },
        });
        if (res2.ok) {
          const data2: DdgResponse = await res2
            .json() as unknown as DdgResponse;
          const results2: DdgImageResult[] = data2?.results ?? [];
          for (const r of results2) {
            if (typeof r.image === "string") urls.push(r.image);
            if (urls.length >= max) break;
          }
        }
      } catch {
        // ignore pagination errors
      }
    }
    return urls.slice(0, max);
  } catch (_e) {
    return [];
  }
}

function buildQuery(name: string, address: string): string {
  const coarseLocation = address.split(",").slice(-2).join(", ").trim();
  return coarseLocation ? `${name} ${coarseLocation}` : name;
}

function buildGoogleImagesUrl(name: string, address: string): string {
  const query = buildQuery(name, address);
  return `https://www.google.com/search?tbm=isch&q=${
    encodeURIComponent(query)
  }`;
}

async function main() {
  console.log("🦆 DDG Media Enrichment (Unofficial)");
  console.log("=".repeat(60));
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log(`📊 Limit: ${limit ? limit : "ALL PLACES"}`);
  console.log("=".repeat(60));

  const [db, client] = await getDb() as [unknown, unknown] as [
    import("npm:mongodb").Db,
    import("npm:mongodb").MongoClient,
  ];
  const placeCatalog = new PlaceCatalogConcept(db);
  const mediaLibrary = new MediaLibraryConcept(db);

  const aggregationPipeline: import("npm:mongodb").Document[] = [
    {
      $lookup: {
        from: "MediaLibrary.mediaitems",
        localField: "_id",
        foreignField: "placeId",
        as: "media",
      },
    },
    { $match: { media: { $size: 0 } } },
    { $project: { _id: 1, name: 1, address: 1, category: 1 } },
  ];

  // Only add $limit if explicitly provided
  if (limit !== undefined) {
    aggregationPipeline.push({ $limit: limit });
  }

  const places = await placeCatalog.places.aggregate(aggregationPipeline)
    .toArray();

  console.log(`📍 Found ${places.length} places lacking media`);

  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    console.log(`\n[${i + 1}/${places.length}] ${p.name} (${p.category})`);

    const query = buildQuery(p.name, p.address);
    let urls = await ddgImages(query, 4);
    if (urls.length === 0) {
      // fallback try with name only
      urls = await ddgImages(p.name, 4);
    }

    if (urls.length === 0) {
      console.log("   ⏭️  No images found via DDG");
      skipped++;
      continue;
    }

    const result = await mediaLibrary.seedMedia({ placeId: p._id, urls });
    if ("error" in result) {
      console.log(`   ❌ Failed to save media: ${result.error}`);
      errors++;
    } else {
      console.log(`   ✅ Saved ${result.count} image URLs`);
      enriched++;
    }

    // Update place with imagesUrl for Google Images search
    const imagesUrl = buildGoogleImagesUrl(p.name, p.address);
    await placeCatalog.enrichPlace({ placeId: p._id, imagesUrl });

    await delay(350);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ DDG media enrichment complete");
  console.log(`📈 Enriched: ${enriched}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log("=".repeat(60));

  await client.close();
  console.log("\n✅ Database connection closed");
}

await main();
