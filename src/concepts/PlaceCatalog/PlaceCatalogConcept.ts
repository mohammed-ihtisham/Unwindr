import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "PlaceCatalog" + ".";

// Generic types of this concept
type User = ID;

/**
 * a set of Locations with
 *   a latitude Number
 *   a longitude Number
 *
 * This will be embedded within a Place document for geospatial indexing.
 * MongoDB GeoJSON Point format is [longitude, latitude].
 */
interface LocationData {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * a set of Places with
 *   an _id Id
 *   a name String
 *   an address String
 *   a category String
 *   a verified Flag
 *   an addedBy User
 *   a location Location
 *   a source String // "provider" or "user_added"
 */
interface PlaceDocument {
  _id: ID;
  name: string;
  address: string;
  category: string;
  verified: boolean;
  addedBy: User;
  location: LocationData;
  source: "provider" | "user_added";
  // Optional enrichment fields from Google Places API
  description?: string; // Editorial description
  editorialSummary?: string; // Brief overview
  googleRating?: number; // User rating (1-5)
  googleReviewCount?: number; // Total number of ratings
  businessStatus?: string; // OPERATIONAL, CLOSED_TEMPORARILY, etc.
  placeTypes?: string[]; // Array of place types
  openingHours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
}

// Helper for coordinate validation
function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export default class PlaceCatalogConcept {
  places: Collection<PlaceDocument>;

  constructor(private readonly db: Db) {
    this.places = this.db.collection(PREFIX + "places");
    // Ensure 2dsphere index for geospatial queries
    this.places.createIndex({ "location": "2dsphere" }).catch(() => {});
  }

  /**
   * bulkImportOSMPlaces (osmDataPath: String): Empty | {error: string}
   *
   * **requires** osmDataPath points to a valid GeoJSON file from OSM extract
   *
   * **effects** performs one-time bulk import of places from OpenStreetMap data.
   *             Download US data from: https://download.geofabrik.de/north-america/us-latest.osm.pbf
   *             Convert to GeoJSON using: osmium export us-latest.osm.pbf -o us-places.geojson
   *             Checks for duplicates before inserting.
   */
  async bulkImportOSMPlaces(
    { osmDataPath }: { osmDataPath: string },
  ): Promise<Empty | { error: string }> {
    try {
      const fileContent = await Deno.readTextFile(osmDataPath);
      const osmData = JSON.parse(fileContent);

      if (!osmData.features || !Array.isArray(osmData.features)) {
        return { error: "Invalid GeoJSON format: missing features array" };
      }

      const relevantAmenities = [
        "cafe",
        "restaurant",
        "bar",
        "museum",
        "library",
        "theatre",
        "cinema",
      ];
      const relevantLeisure = [
        "park",
        "playground",
        "garden",
        "nature_reserve",
      ];

      let imported = 0;
      let skipped = 0;
      const batchSize = 1000;
      let batch: PlaceDocument[] = [];

      for (const feature of osmData.features) {
        if (!feature.geometry || feature.geometry.type !== "Point") {
          continue; // Only process point features
        }

        const tags = feature.properties || {};
        const amenity = tags.amenity;
        const leisure = tags.leisure;

        // Filter for relevant places only
        if (
          !relevantAmenities.includes(amenity) &&
          !relevantLeisure.includes(leisure)
        ) {
          continue;
        }

        const name = tags.name || tags["name:en"] || "Unnamed Place";
        if (name === "Unnamed Place") continue; // Skip unnamed places

        const address = this.buildOSMAddress(tags);
        const category = this.mapOSMCategory(amenity, leisure);
        const [lng, lat] = feature.geometry.coordinates;

        if (!isValidCoordinates(lat, lng)) {
          continue;
        }

        // Check for duplicates
        const existing = await this.places.findOne({
          name,
          "location.coordinates": [lng, lat],
        });

        if (existing) {
          skipped++;
          continue;
        }

        batch.push({
          _id: freshID(),
          name,
          address,
          category,
          verified: true, // OSM data is community-verified
          addedBy: "system:osm" as User,
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
          source: "provider",
        });

        if (batch.length >= batchSize) {
          await this.places.insertMany(batch);
          imported += batch.length;
          batch = [];
        }
      }

      // Insert remaining places
      if (batch.length > 0) {
        await this.places.insertMany(batch);
        imported += batch.length;
      }

      return {};
    } catch (e) {
      return {
        error: `Failed to import OSM data: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  /**
   * seedPlaces (): Empty | {error: string}
   *
   * **effects** Initial one-time seed of places for Cambridge, MA and Boston, MA.
   *             Downloads data from OpenStreetMap Overpass API using bounding boxes.
   *             Should only be called once when database has 0 places.
   *             Checks for duplicates before inserting.
   */
  async seedPlaces(): Promise<Empty | { error: string }> {
    try {
      // Check if database already has places
      const existingCount = await this.places.countDocuments();
      if (existingCount > 0) {
        return {};
      }

      const cities = [
        {
          name: "Cambridge, MA",
          // Bounding box: [south, west, north, east]
          bbox: [42.35, -71.16, 42.40, -71.06],
        },
        {
          name: "Boston, MA",
          // Bounding box: [south, west, north, east]
          bbox: [42.23, -71.19, 42.40, -71.00],
        },
      ];

      const relevantAmenities =
        "cafe|restaurant|bar|museum|library|theatre|cinema";
      const relevantLeisure = "park|playground|garden|nature_reserve";

      let totalImported = 0;

      for (const city of cities) {
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

        // Retry logic for Overpass API
        const maxRetries = 3;
        let data: any = null;
        let lastError: string = "";

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
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
                // Retryable errors
                continue;
              }
              return {
                error: `Failed to fetch data for ${city.name}: ${lastError}`,
              };
            }

            data = await response.json();
            break; // Success!
          } catch (e) {
            lastError = e instanceof Error ? e.message : String(e);
          }
        }

        if (!data) {
          return {
            error:
              `Failed to fetch data for ${city.name} after ${maxRetries} attempts: ${lastError}`,
          };
        }

        const elements = data.elements || [];
        const placesToInsert: PlaceDocument[] = [];

        for (const element of elements) {
          const tags = element.tags || {};
          const name = tags.name || tags["name:en"];

          if (!name) continue; // Skip unnamed places

          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;

          if (!lat || !lon || !isValidCoordinates(lat, lon)) {
            continue;
          }

          // Check if place already exists at this location
          const existing = await this.places.findOne({
            name,
            "location.coordinates": [lon, lat],
          });

          if (existing) continue; // Skip duplicates

          const address = this.buildOSMAddress(tags);
          const category = this.mapOSMCategory(tags.amenity, tags.leisure);

          placesToInsert.push({
            _id: freshID(),
            name,
            address,
            category,
            verified: true,
            addedBy: "system:osm" as User,
            location: {
              type: "Point",
              coordinates: [lon, lat],
            },
            source: "provider",
          });
        }

        if (placesToInsert.length > 0) {
          await this.places.insertMany(placesToInsert);
          totalImported += placesToInsert.length;
        }

        // Be respectful to Overpass API - add delay between cities
        if (cities.indexOf(city) < cities.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      return {};
    } catch (e) {
      return {
        error: `Failed to seed places: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  /**
   * checkAreaCoverage (centerLat: Number, centerLng: Number, radius: Number): (placeCount: Number) | {error: string}
   *
   * **requires** coordinates are valid and radius > 0
   *
   * **effects** returns the number of places already in the database for this area.
   *             Useful to check if seeding is needed.
   */
  async checkAreaCoverage(
    { centerLat, centerLng, radius }: {
      centerLat: number;
      centerLng: number;
      radius: number;
    },
  ): Promise<{ placeCount: number } | { error: string }> {
    if (!isValidCoordinates(centerLat, centerLng) || radius <= 0) {
      return { error: "Invalid coordinates or radius must be positive." };
    }

    try {
      const EARTH_RADIUS_KM = 6371;
      const radiusInRadians = radius / EARTH_RADIUS_KM;

      const count = await this.places.countDocuments({
        location: {
          $geoWithin: {
            $centerSphere: [[centerLng, centerLat], radiusInRadians],
          },
        },
      });

      return { placeCount: count };
    } catch (e) {
      return {
        error: `Failed to check coverage: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  /**
   * Helper to build address string from OSM tags
   */
  buildOSMAddress(tags: Record<string, string>): string {
    const parts = [];

    if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
    if (tags["addr:street"]) parts.push(tags["addr:street"]);
    if (tags["addr:city"]) parts.push(tags["addr:city"]);
    if (tags["addr:state"]) parts.push(tags["addr:state"]);
    if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);

    return parts.length > 0 ? parts.join(", ") : "Address not available";
  }

  /**
   * Helper to map OSM categories to our category system
   */
  mapOSMCategory(amenity?: string, leisure?: string): string {
    if (amenity === "cafe") return "Cafe";
    if (amenity === "restaurant") return "Restaurant";
    if (amenity === "bar") return "Bar";
    if (amenity === "museum") return "Museum";
    if (amenity === "library") return "Library";
    if (amenity === "theatre" || amenity === "cinema") return "Entertainment";
    if (leisure === "park" || leisure === "garden") return "Park";
    if (leisure === "playground") return "Playground";
    if (leisure === "nature_reserve") return "Nature Reserve";
    return "Other";
  }

  /**
   * addPlace (userId: Id, name: String, address: String, category: String, lat: Number, lng: Number): (placeId: Id) | {error: string}
   *
   * **requires** user is authenticated (assumed here), name is not empty, and coordinates are valid
   *
   * **effects** creates a new user-added place and returns its ID.
   */
  async addPlace(
    { userId, name, address, category, lat, lng }: {
      userId: User;
      name: string;
      address: string;
      category: string;
      lat: number;
      lng: number;
    },
  ): Promise<{ placeId: ID } | { error: string }> {
    // Basic validation
    if (!userId) {
      return { error: "User ID is required." }; // Simulate auth, actual auth would be handled by syncs
    }
    if (!name || name.trim() === "") {
      return { error: "Place name cannot be empty." };
    }
    if (!isValidCoordinates(lat, lng)) {
      return { error: "Invalid coordinates." };
    }

    const newPlace: PlaceDocument = {
      _id: freshID(),
      name: name.trim(),
      address: address.trim(),
      category: category.trim(),
      verified: false, // Newly added places are initially unverified
      addedBy: userId,
      location: {
        type: "Point",
        coordinates: [lng, lat], // MongoDB stores as [longitude, latitude]
      },
      source: "user_added",
    };

    try {
      await this.places.insertOne(newPlace);
      return { placeId: newPlace._id };
    } catch (e) {
      return {
        error: `Failed to add place: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  /**
   * setPlaceVerificationStatus (placeId: Id, moderatorId: Id, isVerified: Boolean): Empty | {error: string}
   *
   * **requires** user has moderation privileges and place exists
   *
   * **effects** sets the verification status of the place (true for verified, false for unverified/deactivated).
   */
  async setPlaceVerificationStatus(
    { placeId, moderatorId, isVerified }: {
      placeId: ID;
      moderatorId: User;
      isVerified: boolean;
    },
  ): Promise<Empty | { error: string }> {
    // Assume moderatorId implies moderation privileges; actual check by sync
    if (!moderatorId) {
      return { error: "Moderator ID is required for verification." };
    }

    const result = await this.places.updateOne(
      { _id: placeId },
      { $set: { verified: isVerified } },
    );

    if (result.matchedCount === 0) {
      return { error: `Place with ID ${placeId} not found.` };
    }
    if (result.modifiedCount === 0) {
      // Place already has this verification status
      return {
        error:
          `Place with ID ${placeId} already has verification status: ${isVerified}.`,
      };
    }

    return {};
  }

  /**
   * updatePlace (placeId: Id, name: String, address: String, userId: Id): Empty | {error: string}
   *
   * **requires** place exists and user is authenticated (assumed here)
   *             (Further restrictions, e.g., only `addedBy` user can update, would be in syncs)
   *
   * **effects** updates the name and address of the specified place.
   */
  async updatePlace(
    { placeId, name, address, userId }: {
      placeId: ID;
      name: string;
      address: string;
      userId: User;
    },
  ): Promise<Empty | { error: string }> {
    if (!userId) {
      return { error: "User ID is required." }; // Simulate auth
    }
    if (!name || name.trim() === "") {
      return { error: "Place name cannot be empty." };
    }
    if (!address || address.trim() === "") {
      return { error: "Place address cannot be empty." };
    }

    const updateFields: Partial<PlaceDocument> = {
      name: name.trim(),
      address: address.trim(),
    };

    const result = await this.places.updateOne(
      { _id: placeId },
      { $set: updateFields },
    );

    if (result.matchedCount === 0) {
      return { error: `Place with ID ${placeId} not found.` };
    }
    if (result.modifiedCount === 0) {
      return {
        error: `Place with ID ${placeId} details are already up-to-date.`,
      };
    }

    return {};
  }

  /**
   * _getPlacesInArea (centerLat: Number, centerLng: Number, radius: Number): (places: set Id) | {error: string}
   *
   * **requires** coordinates are valid and radius > 0
   *
   * **effects** returns an array of IDs of places found within the specified circular area.
   *             The radius is in kilometers.
   */
  async _getPlacesInArea(
    { centerLat, centerLng, radius }: {
      centerLat: number;
      centerLng: number;
      radius: number;
    },
  ): Promise<{ places: ID[] } | { error: string }> {
    if (!isValidCoordinates(centerLat, centerLng) || radius <= 0) {
      return { error: "Invalid coordinates or radius must be positive." };
    }

    try {
      // MongoDB $centerSphere expects radius in radians, so convert km to radians
      // Earth's radius is approximately 6371 km
      const EARTH_RADIUS_KM = 6371;
      const radiusInRadians = radius / EARTH_RADIUS_KM;

      const foundPlaces = await this.places.find({
        location: {
          $geoWithin: {
            $centerSphere: [[centerLng, centerLat], radiusInRadians],
          },
        },
      }, { projection: { _id: 1 } }).toArray(); // Only return _id

      return { places: foundPlaces.map((p) => p._id) };
    } catch (e) {
      return {
        error: `Failed to retrieve places: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  /**
   * _getPlaceDetails (placeId: Id): (place: {name: String, address: String, ...}) | {error: string}
   *
   * This is an additional query to retrieve full details of a single place,
   * often useful for display after getting an ID from a list.
   *
   * **requires** place exists
   * **effects** returns the full details of the specified place.
   */
  async _getPlaceDetails(
    { placeId }: { placeId: ID },
  ): Promise<
    { place: Omit<PlaceDocument, "_id"> & { id: ID } } | { error: string }
  > {
    if (!placeId) {
      return { error: "Place ID is required." };
    }

    const place = await this.places.findOne({ _id: placeId });

    if (!place) {
      return { error: `Place with ID ${placeId} not found.` };
    }

    // Return the document without _id and with id as per common API patterns
    const { _id, ...rest } = place;
    return { place: { id: _id, ...rest } };
  }

  /**
   * getPlacesInViewport (southLat: Number, westLng: Number, northLat: Number, eastLng: Number): (places: Array<PlaceData>) | {error: string}
   *
   * **requires** coordinates are valid, forming a proper viewport rectangle
   *
   * **effects** returns places within the viewport with essential data for map display.
   *             Optimized for lazy loading - returns only fields needed for map markers.
   */
  async getPlacesInViewport(
    { southLat, westLng, northLat, eastLng }: {
      southLat: number;
      westLng: number;
      northLat: number;
      eastLng: number;
    },
  ): Promise<
    Array<{
      id: ID;
      name: string;
      category: string;
      lat: number;
      lng: number;
    }> | { error: string }
  > {
    if (
      !isValidCoordinates(southLat, westLng) ||
      !isValidCoordinates(northLat, eastLng)
    ) {
      return { error: "Invalid coordinates provided." };
    }
    if (southLat >= northLat || westLng >= eastLng) {
      return { error: "Invalid viewport bounds." };
    }

    try {
      const foundPlaces = await this.places.find({
        location: {
          $geoWithin: {
            $box: [
              [westLng, southLat], // Southwest corner [lng, lat]
              [eastLng, northLat], // Northeast corner [lng, lat]
            ],
          },
        },
      }, {
        projection: {
          _id: 1,
          name: 1,
          category: 1,
          location: 1,
        },
      }).toArray();

      // Transform to include lat/lng as separate fields for easier frontend consumption
      return foundPlaces.map((p) => ({
        id: p._id,
        name: p.name,
        category: p.category,
        lat: p.location.coordinates[1],
        lng: p.location.coordinates[0],
      }));
    } catch (e) {
      return {
        error: `Failed to retrieve places in viewport: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  /**
   * enrichPlace (placeId: Id, enrichmentData: EnrichmentData): Empty | {error: string}
   *
   * Updates a place with optional enrichment data from external APIs (e.g., Google Places)
   *
   * **requires** placeId exists
   * **effects** updates place with optional enrichment fields
   */
  async enrichPlace(
    {
      placeId,
      description,
      editorialSummary,
      googleRating,
      googleReviewCount,
      businessStatus,
      placeTypes,
      openingHours,
    }: {
      placeId: ID;
      description?: string;
      editorialSummary?: string;
      googleRating?: number;
      googleReviewCount?: number;
      businessStatus?: string;
      placeTypes?: string[];
      openingHours?: {
        open_now?: boolean;
        weekday_text?: string[];
      };
    },
  ): Promise<Empty | { error: string }> {
    if (!placeId) {
      return { error: "Place ID is required." };
    }

    const enrichmentFields: Partial<PlaceDocument> = {};

    if (description !== undefined) enrichmentFields.description = description;
    if (editorialSummary !== undefined) {
      enrichmentFields.editorialSummary = editorialSummary;
    }
    if (googleRating !== undefined) {
      enrichmentFields.googleRating = googleRating;
    }
    if (googleReviewCount !== undefined) {
      enrichmentFields.googleReviewCount = googleReviewCount;
    }
    if (businessStatus !== undefined) {
      enrichmentFields.businessStatus = businessStatus;
    }
    if (placeTypes !== undefined) enrichmentFields.placeTypes = placeTypes;
    if (openingHours !== undefined) {
      enrichmentFields.openingHours = openingHours;
    }

    // If no fields to update, return error
    if (Object.keys(enrichmentFields).length === 0) {
      return { error: "No enrichment data provided." };
    }

    try {
      const result = await this.places.updateOne(
        { _id: placeId },
        { $set: enrichmentFields },
      );

      if (result.matchedCount === 0) {
        return { error: `Place with ID ${placeId} not found.` };
      }

      return {};
    } catch (e) {
      return {
        error: `Failed to enrich place: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }
}
