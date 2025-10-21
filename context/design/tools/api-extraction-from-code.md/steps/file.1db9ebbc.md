---
timestamp: 'Mon Oct 20 2025 17:06:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_170635.cf4d5be1.md]]'
content_id: 1db9ebbc9c388bb2621ecfe3920f5f70e3703706d773042832380b298cfeda13
---

# file: src/concepts/MediaLibrary/MediaLibraryConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**
 * Declares the collection prefix for MongoDB, using the concept name.
 * This helps in organizing collections uniquely per concept.
 */
const PREFIX = "MediaLibrary" + ".";

/**
 * Type parameters for the MediaLibrary concept.
 * These are generic IDs for external entities (e.g., from UserAuth, PlaceCatalog concepts).
 */
type User = ID;
type Place = ID;

/**
 * Interface representing a MediaItem as defined in the concept's state.
 * This directly maps to documents in the MongoDB 'mediaitems' collection.
 */
interface MediaItem {
  _id: ID; // Unique identifier for the media item
  placeId: Place; // The ID of the place this media item is associated with
  contributorId: User | null; // The ID of the user who contributed, or null if provider-sourced
  createdAt: Date; // Timestamp of when the media item was added
  imageUrl: string; // URL of the media image
  source: "provider" | "user"; // Indicates whether the media is from a provider or a user
}

/**
 * MediaLibraryConcept:
 *
 * purpose: store and retrieve media items for visual discovery
 * principle: only manages media data, not engagement or analytics
 *
 * This class implements the MediaLibrary concept, managing the state and behavior
 * related to storing and retrieving media items. It is designed to be independent
 * of other concepts, interacting through generic IDs.
 */
export default class MediaLibraryConcept {
  // The MongoDB collection for storing MediaItem documents.
  mediaItems: Collection<MediaItem>;

  /**
   * Constructs a new MediaLibraryConcept instance.
   * Initializes the MongoDB collection.
   * @param db The MongoDB database instance.
   */
  constructor(private readonly db: Db) {
    this.mediaItems = this.db.collection(PREFIX + "mediaitems");
  }

  /**
   * seedMedia (placeId: Id, urls: set String) : (count: Number)
   *
   * **requires** urls not empty, placeId provided
   *
   * **effects** inserts provider-sourced media items
   *
   * Inserts a batch of media items provided by an external source (e.g., a data provider)
   * for a specific place.
   *
   * // TODO: Use Google Places API to seed media.
   * @param {object} args - The arguments for the action.
   * @param {Place} args.placeId - The ID of the place to associate the media with.
   * @param {string[]} args.urls - A set of image URLs to be added as media.
   * @returns {Promise<{ count: number } | { error: string }>} The number of items inserted, or an error.
   */
  async seedMedia({
    placeId,
    urls,
  }: {
    placeId: Place;
    urls: string[];
  }): Promise<{ count: number } | { error: string }> {
    if (!placeId) {
      return { error: "placeId must be provided." };
    }
    if (!urls || urls.length === 0) {
      return { error: "URLs set cannot be empty." };
    }

    const itemsToInsert: MediaItem[] = urls.map((url) => ({
      _id: freshID(), // Generate a unique ID for each media item
      placeId: placeId,
      contributorId: null, // Provider-sourced media has no specific user contributor
      createdAt: new Date(),
      imageUrl: url,
      source: "provider",
    }));

    try {
      const result = await this.mediaItems.insertMany(itemsToInsert);
      return { count: result.insertedCount };
    } catch (error) {
      console.error("Error seeding media:", error);
      return { error: `Failed to seed media: ${(error as Error).message}` };
    }
  }

  /**
   * addMedia (userId: Id, placeId: Id, imageUrl: String) : (mediaId: Id)
   *
   * **requires** userId valid and imageUrl non-empty, placeId provided
   *
   * **effects** adds user-contributed media
   *
   * Adds a single media item contributed by a user for a specific place.
   * The concept does not validate the existence of `userId` in another concept,
   * relying on synchronization rules for such checks.
   * @param {object} args - The arguments for the action.
   * @param {User} args.userId - The ID of the user contributing the media.
   * @param {Place} args.placeId - The ID of the place this media item is associated with.
   * @param {string} args.imageUrl - The URL of the image contributed by the user.
   * @returns {Promise<{ mediaId: ID } | { error: string }>} The ID of the newly added media item, or an error.
   */
  async addMedia({
    userId,
    placeId,
    imageUrl,
  }: {
    userId: User;
    placeId: Place;
    imageUrl: string;
  }): Promise<{ mediaId: ID } | { error: string }> {
    if (!userId) {
      return { error: "userId must be provided." };
    }
    if (!placeId) {
      return { error: "placeId must be provided." };
    }
    if (!imageUrl || imageUrl.trim() === "") {
      return { error: "imageUrl cannot be empty." };
    }

    const newItem: MediaItem = {
      _id: freshID(), // Generate a unique ID for the new media item
      placeId: placeId,
      contributorId: userId, // The user ID is the contributor
      createdAt: new Date(),
      imageUrl: imageUrl,
      source: "user",
    };

    try {
      await this.mediaItems.insertOne(newItem);
      return { mediaId: newItem._id };
    } catch (error) {
      console.error("Error adding media:", error);
      return { error: `Failed to add media: ${(error as Error).message}` };
    }
  }

  /**
   * deleteMedia (userId: Id, mediaId: Id) : (success: Boolean)
   *
   * **requires** mediaId exists and userId matches contributorId of mediaId
   *
   * **effect** removes media item from the set
   */
  async deleteMedia(
    { userId, mediaId }: { userId: User; mediaId: ID },
  ): Promise<{ success: boolean } | { error: string }> {
    if (!userId) {
      return { error: "User ID cannot be empty" };
    }
    if (!mediaId) {
      return { error: "Media ID cannot be empty" };
    }

    // Check if mediaId exists and userId matches contributorId
    const existingMedia = await this.mediaItems.findOne({ _id: mediaId });

    if (!existingMedia) {
      // If mediaId does not exist, the 'requires' condition is not met.
      // Return success: false as per specification's Boolean return for non-exceptional failures.
      return { success: false };
    }

    // `contributorId` can be null for "provider" sourced media.
    // Only "user" sourced media can be deleted by a user.
    if (
      existingMedia.source === "provider" ||
      existingMedia.contributorId !== userId
    ) {
      // If the media is provider-sourced or the userId does not match the contributorId,
      // the 'requires' condition is not met.
      return { success: false };
    }

    try {
      const result = await this.mediaItems.deleteOne({
        _id: mediaId,
        contributorId: userId,
      });

      if (result.deletedCount === 1) {
        return { success: true };
      } else {
        // This case should ideally not happen if findOne was successful,
        // but good to handle for robustness, possibly indicating a concurrent delete or DB issue.
        return {
          error:
            "Failed to delete media item, item not found or user mismatch during delete operation.",
        };
      }
    } catch (e) {
      return {
        error: `An unexpected error occurred during deletion: ${
          (e as Error).message
        }`,
      };
    }
  }

  /**
   * _getMediaByPlace (placeId: Id) : (mediaIds: set Id)
   *
   * **requires** placeId provided
   *
   * **effects** returns media item IDs ordered by createdAt desc
   *
   * Retrieves all media item IDs associated with a specific place,
   * ordered by their creation date in descending order (most recent first).
   * As per implementation guidelines, queries return an array of dictionaries,
   * where each dictionary contains the specified return field (`mediaIds` in this case).
   * @param {object} args - The arguments for the query.
   * @param {Place} args.placeId - The ID of the place to retrieve media for.
   * @returns {Promise<Array<{ mediaIds: ID }> | { error: string }>} An array of objects, each containing a 'mediaIds' field with an ID, or an error.
   */
  async _getMediaByPlace({
    placeId,
  }: {
    placeId: Place;
  }): Promise<Array<{ mediaIds: ID }> | { error: string }> {
    if (!placeId) {
      return { error: "placeId must be provided." };
    }

    try {
      const mediaItems = await this.mediaItems
        .find({ placeId: placeId })
        .sort({ createdAt: -1 }) // Order by creation date, newest first
        .project({ _id: 1 }) // Only retrieve the _id field
        .toArray();

      // Transform the result to match the expected query return format:
      // an array of dictionaries, each with a 'mediaIds' field holding a single ID.
      return mediaItems.map((item) => ({ mediaIds: item._id }));
    } catch (error) {
      console.error("Error getting media by place:", error);
      return { error: `Failed to retrieve media: ${(error as Error).message}` };
    }
  }
}

```

Now, analyze the above Concept Implementation and generate a complete API documentation based on these instructions.
