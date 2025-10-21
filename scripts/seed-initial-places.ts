#!/usr/bin/env -S deno run --allow-all

/**
 * Initial Place Seed Script
 *
 * Seeds the database with places from Cambridge, MA and Boston, MA.
 * Only runs if database is empty.
 */

import PlaceCatalogConcept from "../src/concepts/PlaceCatalog/PlaceCatalogConcept.ts";
import { getDb } from "../src/utils/database.ts";

console.log("🗺️  Unwindr Place Catalog - Initial Seed");
console.log("==========================================\n");

try {
  // Initialize database connection
  const [db, client] = await getDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  // Run the seed
  const result = await placeCatalog.seedPlaces();

  if ("error" in result) {
    console.error(`\n❌ Seed failed: ${result.error}`);
    await client.close();
    Deno.exit(1);
  }

  // Get final statistics
  const totalCount = await placeCatalog.places.countDocuments();
  console.log(`\n📊 Database now has ${totalCount} places total`);

  // Show some sample places
  console.log("\n📍 Sample places:");
  const samples = await placeCatalog.places.find().limit(5).toArray();
  for (const place of samples) {
    console.log(
      `   - ${place.name} (${place.category}) in ${
        place.address || "Unknown location"
      }`,
    );
  }

  await client.close();
  console.log("\n✅ Seed complete! Database is ready.");
} catch (error) {
  console.error("\n❌ Error during seed:", error);
  Deno.exit(1);
}
