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
    this.places.createIndex({ "location": "2dsphere" }).catch(console.error);
  }

  /**
   * seedPlaces (centerLat: Number, centerLng: Number, radius: Number): Empty | {error: string}
   *
   * **requires** coordinates are valid and radius > 0
   *
   * **effects** loads places from provider within specified area.
   *             (For this implementation, it adds a few dummy places if none exist,
   *             to simulate seeding from a provider.)
   */
  async seedPlaces(
    { centerLat, centerLng, radius }: {
      centerLat: number;
      centerLng: number;
      radius: number;
    },
  ): Promise<Empty | { error: string }> {
    if (!isValidCoordinates(centerLat, centerLng) || radius <= 0) {
      return { error: "Invalid coordinates or radius must be positive." };
    }

    // Simulate seeding: add some dummy places if the collection is empty (Temporary)
    // TODO: Use Google Places API to seed places.
    const existingPlacesCount = await this.places.countDocuments();
    if (existingPlacesCount === 0) {
      const dummyPlaces: Omit<PlaceDocument, "_id">[] = [
        {
          name: "Local Cafe",
          address: "123 Coffee St",
          category: "Cafe",
          verified: true,
          addedBy: "system:provider" as User,
          location: {
            type: "Point",
            coordinates: [centerLng + 0.01, centerLat + 0.01],
          },
          source: "provider",
        },
        {
          name: "City Park",
          address: "Green Ave",
          category: "Park",
          verified: true,
          addedBy: "system:provider" as User,
          location: {
            type: "Point",
            coordinates: [centerLng - 0.02, centerLat + 0.005],
          },
          source: "provider",
        },
        {
          name: "Tech Hub Office",
          address: "456 Innovation Dr",
          category: "Office",
          verified: false, // Could be unverified provider data
          addedBy: "system:provider" as User,
          location: {
            type: "Point",
            coordinates: [centerLng, centerLat - 0.015],
          },
          source: "provider",
        },
      ];
      const placesToInsert = dummyPlaces.map((p) => ({ ...p, _id: freshID() }));
      await this.places.insertMany(placesToInsert);
      console.log(`Seeded ${placesToInsert.length} dummy places.`);
    } else {
      console.log("Places already exist, skipping seeding.");
    }
    return {};
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
      console.error("Error adding place:", e);
      return {
        error: `Failed to add place: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  /**
   * verifyPlace (placeId: Id, moderatorId: Id): Empty | {error: string}
   *
   * **requires** place exists and user has moderation privileges (assumed here)
   *
   * **effects** marks the specified place as verified.
   */
  async verifyPlace(
    { placeId, moderatorId }: { placeId: ID; moderatorId: User },
  ): Promise<Empty | { error: string }> {
    // Assume moderatorId implies moderation privileges; actual check by sync
    if (!moderatorId) {
      return { error: "Moderator ID is required for verification." };
    }

    const result = await this.places.updateOne(
      { _id: placeId },
      { $set: { verified: true } },
    );

    if (result.matchedCount === 0) {
      return { error: `Place with ID ${placeId} not found.` };
    }
    if (result.modifiedCount === 0) {
      // Place already verified or no change
      return { error: `Place with ID ${placeId} is already verified.` };
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
      console.error("Error fetching places in area:", e);
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
}
