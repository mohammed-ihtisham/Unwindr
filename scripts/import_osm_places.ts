#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env --allow-sys

/**
 * OSM Place Import Script
 *
 * This script imports places from an OpenStreetMap GeoJSON file into MongoDB.
 *
 * Usage:
 *   deno run --allow-all scripts/import_osm_places.ts <path-to-geojson-file>
 *
 * Example:
 *   deno run --allow-all scripts/import_osm_places.ts ./california-places.geojson
 */

import PlaceCatalogConcept from "../src/concepts/PlaceCatalog/PlaceCatalogConcept.ts";
import { getDb } from "../src/utils/database.ts";

const args = Deno.args;

if (args.length === 0) {
  console.error("❌ Error: Please provide the path to the GeoJSON file");
  console.log("\nUsage:");
  console.log(
    "  deno run --allow-all scripts/import_osm_places.ts <geojson-file>",
  );
  console.log("\nExample:");
  console.log(
    "  deno run --allow-all scripts/import_osm_places.ts ./us-places.geojson",
  );
  Deno.exit(1);
}

const geoJsonPath = args[0];

console.log("🚀 OSM Place Import Script");
console.log("=".repeat(50));
console.log(`📁 Input file: ${geoJsonPath}`);
console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
console.log("=".repeat(50));
console.log();

try {
  // Check if file exists
  try {
    const fileInfo = await Deno.stat(geoJsonPath);
    const fileSizeMB = (fileInfo.size / 1024 / 1024).toFixed(2);
    console.log(`✅ File found (${fileSizeMB} MB)`);
  } catch {
    console.error(`❌ Error: File not found: ${geoJsonPath}`);
    Deno.exit(1);
  }

  // Connect to database
  console.log("\n🔌 Connecting to MongoDB...");
  const [db, client] = await getDb();
  console.log("✅ Connected to MongoDB");

  // Initialize PlaceCatalog
  const placeCatalog = new PlaceCatalogConcept(db);

  // Check existing place count
  const existingCount = await placeCatalog.places.countDocuments();
  console.log(`📊 Existing places in database: ${existingCount}`);

  if (existingCount > 0) {
    console.log("\n⚠️  WARNING: Database already contains places!");
    console.log(
      "   This import will ADD to existing places (duplicates will be created).",
    );
    console.log("   Press Ctrl+C within 5 seconds to cancel...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("   Continuing with import...\n");
  }

  // Start import
  console.log("\n📥 Starting import...");
  console.log("   This may take several hours for large files.");
  console.log("   Progress will be logged every 1,000 places.\n");

  const startTime = Date.now();

  const result = await placeCatalog.bulkImportOSMPlaces({
    osmDataPath: geoJsonPath,
  });

  const endTime = Date.now();
  const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(2);

  if ("error" in result) {
    console.error(`\n❌ Import failed: ${result.error}`);
    Deno.exit(1);
  }

  // Get final count
  const finalCount = await placeCatalog.places.countDocuments();
  const importedCount = finalCount - existingCount;

  console.log("\n" + "=".repeat(50));
  console.log("✅ Import Complete!");
  console.log("=".repeat(50));
  console.log(`📊 Places imported: ${importedCount.toLocaleString()}`);
  console.log(`📊 Total places in DB: ${finalCount.toLocaleString()}`);
  console.log(`⏱️  Duration: ${durationMinutes} minutes`);
  console.log(`⏰ Finished at: ${new Date().toLocaleString()}`);
  console.log("=".repeat(50));

  // Close database connection
  await client.close();
  console.log("\n✅ Database connection closed");
  console.log("\n🎉 All done!");
} catch (error) {
  console.error("\n❌ Fatal error during import:");
  console.error(error);
  Deno.exit(1);
}
