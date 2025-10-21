#!/usr/bin/env -S deno run --allow-all

/**
 * Load Boston & Cambridge Places
 *
 * Directly loads place data from OSM Overpass API for Boston and Cambridge.
 * No database checks - always attempts to load data.
 */

import PlaceCatalogConcept from "../src/concepts/PlaceCatalog/PlaceCatalogConcept.ts";
import { getDb } from "../src/utils/database.ts";
import { freshID } from "../src/utils/database.ts";

console.log("🗺️  Loading Boston & Cambridge Places");
console.log("======================================\n");

try {
  const [db, client] = await getDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  const cities = [
    {
      name: "Cambridge, MA",
      bbox: [42.35, -71.16, 42.40, -71.06],
    },
    {
      name: "Boston, MA",
      bbox: [42.23, -71.19, 42.40, -71.00],
    },
  ];

  const relevantAmenities = "cafe|restaurant|bar|museum|library|theatre|cinema";
  const relevantLeisure = "park|playground|garden|nature_reserve";

  let totalImported = 0;

  for (const city of cities) {
    console.log(`\n📍 Fetching ${city.name}...`);

    const [south, west, north, east] = city.bbox;
    const overpassUrl = "https://overpass-api.de/api/interpreter";

    const query = `
      [out:json][timeout:90];
      (
        node["amenity"~"${relevantAmenities}"](${south},${west},${north},${east});
        node["leisure"~"${relevantLeisure}"](${south},${west},${north},${east});
        way["amenity"~"${relevantAmenities}"](${south},${west},${north},${east});
        way["leisure"~"${relevantLeisure}"](${south},${west},${north},${east});
      );
      out center;
    `;

    // Retry logic
    const maxRetries = 3;
    let data: any = null;
    let lastError = "";

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
          console.log(
            `   ⏳ Retry ${attempt + 1}/${maxRetries} (waiting ${
              waitTime / 1000
            }s)...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        const response = await fetch(overpassUrl, {
          method: "POST",
          body: "data=" + encodeURIComponent(query),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        if (!response.ok) {
          lastError = `${response.status} ${response.statusText}`;
          if (response.status === 504 || response.status === 429) {
            continue; // Retry
          }
          throw new Error(lastError);
        }

        data = await response.json();
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt === maxRetries - 1) {
          console.error(
            `   ❌ Failed after ${maxRetries} attempts: ${lastError}`,
          );
        }
      }
    }

    if (!data) {
      console.log(`   ⚠️  Skipping ${city.name} due to API errors\n`);
      continue;
    }

    const elements = data.elements || [];
    console.log(`   Found ${elements.length} raw elements`);

    const placesToInsert = [];

    for (const element of elements) {
      const tags = element.tags || {};
      const name = tags.name || tags["name:en"];
      if (!name) continue;

      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      if (!lat || !lon) continue;

      // Check for duplicates
      const existing = await placeCatalog.places.findOne({
        name,
        "location.coordinates": [lon, lat],
      });
      if (existing) continue;

      // Use existing methods from PlaceCatalogConcept
      const address = placeCatalog.buildOSMAddress(tags);
      const category = placeCatalog.mapOSMCategory(tags.amenity, tags.leisure);

      placesToInsert.push({
        _id: freshID(),
        name,
        address,
        category,
        verified: true,
        addedBy: "system:osm",
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
        source: "provider",
      });
    }

    if (placesToInsert.length > 0) {
      await placeCatalog.places.insertMany(placesToInsert);
      console.log(`   ✅ Imported ${placesToInsert.length} places`);
      totalImported += placesToInsert.length;
    } else {
      console.log(`   ℹ️  No new places to import`);
    }

    // Be nice to the API
    if (cities.indexOf(city) < cities.length - 1) {
      console.log(`   ⏳ Waiting 3 seconds before next city...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  const finalCount = await placeCatalog.places.countDocuments();
  console.log(`\n🎉 Complete!`);
  console.log(`   - Imported: ${totalImported} new places`);
  console.log(`   - Total in DB: ${finalCount} places`);

  await client.close();
} catch (error) {
  console.error("\n❌ Error:", error);
  Deno.exit(1);
}
