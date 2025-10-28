#!/usr/bin/env -S deno run --allow-all

/**
 * Test Seed Media Script
 *
 * This script uses Google Places API to fetch and add 2 images for a specific place.
 * It demonstrates how to integrate Google Places API with our place data.
 *
 * Usage:
 *   deno run --allow-all scripts/seed-media-test.ts
 *
 * Requirements:
 *   - GOOGLE_PLACES_API_KEY environment variable
 *   - MongoDB connection
 */

import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import PlaceCatalogConcept from "../src/concepts/PlaceCatalog/PlaceCatalogConcept.ts";
import { getDb } from "../src/utils/database.ts";

// Load environment variables from .env file
await load({ export: true });

console.log("📸 Test Seed Media Script");
console.log("=".repeat(50));
console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
console.log("=".repeat(50));
console.log();

// Test place data
const TEST_PLACE = {
  "_id": "019a1c0b-174e-7f4d-a616-98f204f03530",
  "name": "Swan Boats",
  "address": "4, Charles Street, Boston, MA, 02116",
  "category": "attraction",
  "verified": true,
  "addedBy": "system:osm",
  "location": {
    "type": "Point",
    "coordinates": [-71.0696551, 42.3540368],
  },
  "source": "provider",
};

interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

interface GooglePlaceDetails {
  place_id: string;
  name: string;
  photos?: GooglePlacePhoto[];
  formatted_address: string;
  description?: string; // Editorial description of the place
  editorial_summary?: {
    overview?: string; // Brief overview of the place
  };
  types?: string[]; // Array of place types
  rating?: number; // User rating (1-5)
  user_ratings_total?: number; // Total number of ratings
  business_status?: string; // OPERATIONAL, CLOSED_TEMPORARILY, etc.
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[]; // Array of opening hours
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GooglePlacesResponse {
  results: GooglePlaceDetails[];
  status: string;
}

interface GooglePlaceDetailsResponse {
  result: GooglePlaceDetails;
  status: string;
}

/**
 * Search for a place using Google Places API Text Search
 */
async function searchPlace(
  placeName: string,
  location: string,
): Promise<GooglePlaceDetails | null> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is required");
  }

  const query = `${placeName} ${location}`;
  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${
      encodeURIComponent(query)
    }&key=${apiKey}`;

  console.log(`🔍 Searching Google Places for: "${query}"`);

  try {
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== "OK") {
      console.log(`   ⚠️  Google Places API error: ${data.status}`);
      return null;
    }

    if (data.results.length === 0) {
      console.log(`   ❌ No results found for "${query}"`);
      return null;
    }

    const place = data.results[0];
    console.log(`   ✅ Found place: "${place.name}" (${place.place_id})`);
    return place;
  } catch (error) {
    console.log(`   ❌ Error searching places: ${error}`);
    return null;
  }
}

/**
 * Get place details with photos from Google Places API
 */
async function getPlaceDetails(
  placeId: string,
): Promise<GooglePlaceDetails | null> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is required");
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,photos,formatted_address,geometry,description,editorial_summary,types,rating,user_ratings_total,business_status,opening_hours&key=${apiKey}`;

  console.log(`📋 Getting place details for: ${placeId}`);

  try {
    const response = await fetch(url);
    const data: GooglePlaceDetailsResponse = await response.json();

    if (data.status !== "OK") {
      console.log(`   ⚠️  Google Places API error: ${data.status}`);
      return null;
    }

    console.log(
      `   ✅ Retrieved details with ${data.result.photos?.length || 0} photos`,
    );
    return data.result;
  } catch (error) {
    console.log(`   ❌ Error getting place details: ${error}`);
    return null;
  }
}

/**
 * Get photo URL from Google Places API
 */
async function downloadPhoto(
  photoReference: string,
  maxWidth: number = 400,
): Promise<string | null> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is required");
  }

  // Return URL instead of downloading the full image
  // This is much more efficient and prevents database bloat
  const url =
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;

  return url;
}

/**
 * Add media to a place in the database
 */
async function addMediaToPlace(
  placeCatalog: PlaceCatalogConcept,
  placeId: string,
  images: string[],
): Promise<boolean> {
  try {
    const result = await placeCatalog.places.updateOne(
      { _id: placeId },
      {
        $set: {
          media: {
            images: images,
            lastUpdated: new Date(),
          },
        },
      },
    );

    if (result.modifiedCount > 0) {
      console.log(`   ✅ Added ${images.length} images to place ${placeId}`);
      return true;
    } else {
      console.log(`   ⚠️  Place not found or not modified: ${placeId}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error adding media to place: ${error}`);
    return false;
  }
}

/**
 * Main function to seed media for test place
 */
async function seedMediaTest(): Promise<void> {
  try {
    // Check for API key
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error(
        "❌ GOOGLE_PLACES_API_KEY environment variable is required",
      );
      console.error("   Please set your Google Places API key:");
      console.error("   export GOOGLE_PLACES_API_KEY=your_api_key_here");
      Deno.exit(1);
    }

    // Connect to database
    console.log("🔌 Connecting to MongoDB...");
    const [db, client] = await getDb() as [any, any];
    console.log("✅ Connected to MongoDB");

    // Initialize PlaceCatalog
    const placeCatalog = new PlaceCatalogConcept(db);

    // Check if test place exists
    console.log("🔍 Checking if test place exists...");
    const existingPlace = await placeCatalog.places.findOne({
      _id: TEST_PLACE._id,
    });

    if (!existingPlace) {
      console.log("📝 Test place not found, creating it...");
      await placeCatalog.places.insertOne(TEST_PLACE);
      console.log("✅ Test place created");
    } else {
      console.log("✅ Test place found");
    }

    // Search for the place on Google Places
    const googlePlace = await searchPlace(TEST_PLACE.name, "Boston MA");
    if (!googlePlace) {
      console.log("❌ Could not find place on Google Places API");
      await client.close();
      return;
    }

    // Get detailed place information with photos
    const placeDetails = await getPlaceDetails(googlePlace.place_id);
    if (
      !placeDetails || !placeDetails.photos || placeDetails.photos.length === 0
    ) {
      console.log("❌ No photos available for this place");
      await client.close();
      return;
    }

    console.log(
      `📸 Found ${placeDetails.photos.length} photos, getting first 2 URLs...`,
    );

    // Get URLs for first 2 photos
    const images: string[] = [];
    const photosToDownload = Math.min(2, placeDetails.photos.length);

    for (let i = 0; i < photosToDownload; i++) {
      const photo = placeDetails.photos[i];
      console.log(`   📥 Getting photo URL ${i + 1}/${photosToDownload}...`);

      const imageUrl = await downloadPhoto(photo.photo_reference);
      if (imageUrl) {
        images.push(imageUrl);
        console.log(`   ✅ Photo ${i + 1} URL retrieved successfully`);
      } else {
        console.log(`   ❌ Failed to get photo ${i + 1} URL`);
      }
    }

    if (images.length === 0) {
      console.log("❌ No image URLs were successfully retrieved");
      await client.close();
      return;
    }

    // Add images to the place in database
    console.log(`💾 Adding ${images.length} images to database...`);
    const success = await addMediaToPlace(placeCatalog, TEST_PLACE._id, images);

    if (success) {
      console.log("\n" + "=".repeat(50));
      console.log("✅ Media Seeding Complete!");
      console.log("=".repeat(50));
      console.log(`📊 Place: ${TEST_PLACE.name}`);
      console.log(`📊 Images added: ${images.length}`);
      console.log(`📊 Place ID: ${TEST_PLACE._id}`);
      console.log(`⏰ Finished at: ${new Date().toLocaleString()}`);
      console.log("=".repeat(50));
    } else {
      console.log("❌ Failed to add media to place");
    }

    // Close database connection
    await client.close();
    console.log("\n✅ Database connection closed");
    console.log("\n🎉 Test media seeding complete!");
  } catch (error) {
    console.error("\n❌ Fatal error during media seeding:");
    console.error(error);
    Deno.exit(1);
  }
}

// Run the media seeding
await seedMediaTest();
