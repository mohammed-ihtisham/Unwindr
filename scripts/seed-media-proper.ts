#!/usr/bin/env -S deno run --allow-all

/**
 * Proper Media Seeding Script using MediaLibrary Concept
 *
 * This script uses the MediaLibrary concept to properly seed media items
 * for places, following the concept architecture.
 *
 * Usage:
 *   deno run --allow-all scripts/seed-media-proper.ts
 */

import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import PlaceCatalogConcept from "../src/concepts/PlaceCatalog/PlaceCatalogConcept.ts";
import MediaLibraryConcept from "../src/concepts/MediaLibrary/MediaLibraryConcept.ts";
import { getDb } from "../src/utils/database.ts";

// Load environment variables from .env file
await load({ export: true });

console.log("📸 Proper Media Seeding Script (using MediaLibrary)");
console.log("=".repeat(50));
console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
console.log("=".repeat(50));
console.log();

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
  editorial_summary?: string; // Editorial summary - single string field
  types?: string[]; // Array of place types (e.g., ["attraction", "tourist_attraction"])
  rating?: number; // User rating (1-5)
  user_ratings_total?: number; // Total number of ratings
  business_status?: string; // OPERATIONAL, CLOSED_TEMPORARILY, etc.
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[]; // Array of opening hours for each day
  };
  reviews?: Array<{
    text: string;
    rating: number;
    author_name: string;
  }>;
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

  // Request all necessary fields - editorial_summary is not available via API, we'll use reviews instead
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,photos,formatted_address,geometry,rating,user_ratings_total,reviews&key=${apiKey}`;

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
  maxWidth: number = 1600,
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
 * Main function to seed media using MediaLibrary concept
 */
async function seedMediaProper(): Promise<void> {
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

    // Initialize concepts
    const placeCatalog = new PlaceCatalogConcept(db);
    const mediaLibrary = new MediaLibraryConcept(db);

    // Test place data
    const TEST_PLACE_ID = "019a1c0b-174e-7f4d-a616-98f204f03530";

    // Check if test place exists
    console.log("🔍 Checking if test place exists...");
    const existingPlace = await placeCatalog.places.findOne({
      _id: TEST_PLACE_ID,
    });

    if (!existingPlace) {
      console.log(
        "❌ Test place not found. Please run the import script first.",
      );
      await client.close();
      return;
    }

    console.log(`✅ Test place found: ${existingPlace.name}`);

    // Search for the place on Google Places
    const googlePlace = await searchPlace(existingPlace.name, "Boston MA");
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
      `📸 Found ${placeDetails.photos.length} photos, downloading first 5...`,
    );

    // Log place description if available
    if (placeDetails.description) {
      console.log(`📝 Place description: ${placeDetails.description}`);
    }
    if (placeDetails.editorial_summary) {
      console.log(`📖 Editorial summary: ${placeDetails.editorial_summary}`);
    }
    if (placeDetails.rating) {
      console.log(
        `⭐ Rating: ${placeDetails.rating}/5 (${placeDetails.user_ratings_total} reviews)`,
      );
    }

    // Get URLs for exactly 5 photos (or all available if less than 5)
    const imageUrls: string[] = [];
    const photosToDownload = Math.min(5, placeDetails.photos.length);

    for (let i = 0; i < photosToDownload; i++) {
      const photo = placeDetails.photos[i];
      console.log(`   📥 Getting photo URL ${i + 1}/${photosToDownload}...`);

      const imageUrl = await downloadPhoto(photo.photo_reference);
      if (imageUrl) {
        imageUrls.push(imageUrl);
        console.log(`   ✅ Photo ${i + 1} URL retrieved successfully`);
      } else {
        console.log(`   ❌ Failed to get photo ${i + 1} URL`);
      }
    }

    if (imageUrls.length === 0) {
      console.log("❌ No image URLs were successfully retrieved");
      await client.close();
      return;
    }

    // Use MediaLibrary concept to seed media
    console.log(
      `💾 Seeding ${imageUrls.length} images using MediaLibrary concept...`,
    );
    const result = await mediaLibrary.seedMedia({
      placeId: TEST_PLACE_ID,
      urls: imageUrls,
    });

    if ("error" in result) {
      console.log(`❌ Failed to seed media: ${result.error}`);
    } else {
      console.log(`✅ Successfully seeded ${result.count} media items`);
    }

    // Update PlaceCatalog with Google Places enrichment data
    console.log("📝 Updating place with Google Places enrichment data...");
    const enrichmentResult = await placeCatalog.enrichPlace({
      placeId: TEST_PLACE_ID,
      description: placeDetails.description,
      editorialSummary: placeDetails.editorial_summary ||
        placeDetails.reviews?.[0]?.text?.substring(0, 500),
      googleRating: placeDetails.rating,
      googleReviewCount: placeDetails.user_ratings_total,
      // Note: businessStatus, placeTypes, and openingHours are not stored
      businessStatus: undefined,
      placeTypes: undefined,
      openingHours: undefined,
    });

    if ("error" in enrichmentResult) {
      console.log(`⚠️  Failed to enrich place: ${enrichmentResult.error}`);
    } else {
      console.log("✅ Successfully enriched place data");
    }

    // Verify the media was added
    console.log("🔍 Verifying media was added to MediaLibrary...");
    const mediaItems = await mediaLibrary.mediaItems.find({
      placeId: TEST_PLACE_ID,
    }).toArray();
    console.log(`📊 Found ${mediaItems.length} media items for this place:`);

    mediaItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item._id}`);
      console.log(`      Source: ${item.source}`);
      console.log(`      Created: ${item.createdAt}`);
      console.log(`      Image URL length: ${item.imageUrl.length} characters`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("✅ Proper Media Seeding Complete!");
    console.log("=".repeat(50));
    console.log(`📊 Place: ${existingPlace.name}`);
    console.log(`📊 Media items added: ${result.count || 0}`);
    console.log(`📊 Place ID: ${TEST_PLACE_ID}`);
    console.log(`⏰ Finished at: ${new Date().toLocaleString()}`);
    console.log("=".repeat(50));

    // Close database connection
    await client.close();
    console.log("\n✅ Database connection closed");
    console.log("\n🎉 Proper media seeding complete!");
  } catch (error) {
    console.error("\n❌ Fatal error during media seeding:");
    console.error(error);
    Deno.exit(1);
  }
}

// Run the media seeding
await seedMediaProper();
