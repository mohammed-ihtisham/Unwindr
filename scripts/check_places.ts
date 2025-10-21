#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env --allow-sys

import PlaceCatalogConcept from "../src/concepts/PlaceCatalog/PlaceCatalogConcept.ts";
import { getDb } from "../src/utils/database.ts";

console.log("🔍 Checking imported places...\n");

const [db, client] = await getDb();
const placeCatalog = new PlaceCatalogConcept(db);

// Get total count
const totalCount = await placeCatalog.places.countDocuments();
console.log(`📊 Total places: ${totalCount.toLocaleString()}`);

// Count by category
const categoryCounts = await placeCatalog.places.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]).toArray();

console.log("\n📈 Places by category:");
for (const cat of categoryCounts) {
  console.log(`   ${cat._id}: ${cat.count.toLocaleString()}`);
}

// Sample some places
console.log("\n🏢 Sample places:");
const samples = await placeCatalog.places.find().limit(5).toArray();
for (const place of samples) {
  console.log(`   - ${place.name} (${place.category})`);
  console.log(`     ${place.address}`);
  console.log(`     ${place.location.coordinates}`);
}

await client.close();
console.log("\n✅ Done!");
