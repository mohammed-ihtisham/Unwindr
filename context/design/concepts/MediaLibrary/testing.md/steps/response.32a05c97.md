---
timestamp: 'Sun Oct 19 2025 20:21:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_202124.4ff16710.md]]'
content_id: 32a05c97821577ed4a63a84a0a40ddeec0c13f0cec1c4f8b6d6325092f32f7a0
---

# response:

To update the `MediaLibraryConcept` implementation, we need to add the `deleteMedia` action as specified, ensuring it respects the `requires` conditions and handles the `effects` by interacting with the MongoDB collection. We will also ensure the return types align with the concept design principles for actions and error handling.

Here's the updated `MediaLibraryConcept.ts` file:

```typescript
// file: src/concepts/MediaLibrary/MediaLibraryConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "MediaLibrary" + ".";

// Generic types of this concept
type User = ID;
type Place = ID;
type MediaItem = ID;

/**
 * a set of MediaItems with
 * an _id Id
 * a placeId Id
 * a contributorId Id // userId if source is "user", otherwise system/null
 * a createdAt Date
 * an imageUrl String
 * a source String // "provider" | "user"
 */
interface MediaItemDoc {
  _id: MediaItem;
  placeId: Place;
  contributorId: User | null; // userId if source is "user", otherwise system/null
  createdAt: Date;
  imageUrl: string;
  source: "provider" | "user";
}

export default class MediaLibraryConcept {
  mediaItems: Collection<MediaItemDoc>;

  constructor(private readonly db: Db) {
    this.mediaItems = this.db.collection(PREFIX + "mediaItems");
  }

  /**
   * seedMedia (placeId: Id, urls: set String) : (count: Number)
   *
   * **requires** urls not empty
   *
   * **effect** inserts provider-sourced media items, setting source to "provider"
   */
  async seedMedia({ placeId, urls }: { placeId: Place; urls: string[] }): Promise<{ count: number } | { error: string }> {
    if (!urls || urls.length === 0) {
      return { error: "URLs set cannot be empty" };
    }

    const newMediaItems = urls.map((url) => ({
      _id: freshID() as MediaItem,
      placeId,
      contributorId: null, // Provider-sourced
      createdAt: new Date(),
      imageUrl: url,
      source: "provider" as const,
    }));

    const result = await this.mediaItems.insertMany(newMediaItems);
    return { count: result.insertedCount };
  }

  /**
   * addMedia (userId: Id, placeId: Id, imageUrl: String) : (mediaId: Id)
   *
   * **requires** userId valid and imageUrl non-empty
   *
   * **effect** adds user-contributed media, setting source to "user" and contributorId to userId
   */
  async addMedia({ userId, placeId, imageUrl }: { userId: User; placeId: Place; imageUrl: string }): Promise<{ mediaId: MediaItem } | { error: string }> {
    if (!userId) {
      return { error: "User ID cannot be empty" };
    }
    if (!imageUrl || imageUrl.trim() === "") {
      return { error: "Image URL cannot be empty" };
    }

    const newMediaId = freshID() as MediaItem;
    const newMediaItem: MediaItemDoc = {
      _id: newMediaId,
      placeId,
      contributorId: userId,
      createdAt: new Date(),
      imageUrl,
      source: "user" as const,
    };

    try {
      await this.mediaItems.insertOne(newMediaItem);
      return { mediaId: newMediaId };
    } catch (e) {
      return { error: `Failed to add media: ${e.message}` };
    }
  }

  /**
   * deleteMedia (userId: Id, mediaId: Id) : (success: Boolean)
   *
   * **requires** mediaId exists and userId matches contributorId of mediaId
   *
   * **effect** removes media item from the set
   */
  async deleteMedia({ userId, mediaId }: { userId: User; mediaId: MediaItem }): Promise<{ success: boolean } | { error: string }> {
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
    if (existingMedia.source === "provider" || existingMedia.contributorId !== userId) {
      // If the media is provider-sourced or the userId does not match the contributorId,
      // the 'requires' condition is not met.
      return { success: false };
    }

    try {
      const result = await this.mediaItems.deleteOne({ _id: mediaId, contributorId: userId });

      if (result.deletedCount === 1) {
        return { success: true };
      } else {
        // This case should ideally not happen if findOne was successful,
        // but good to handle for robustness, possibly indicating a concurrent delete or DB issue.
        return { error: "Failed to delete media item, item not found or user mismatch during delete operation." };
      }
    } catch (e) {
      return { error: `An unexpected error occurred during deletion: ${e.message}` };
    }
  }


  /**
   * _getMediaByPlace (placeId: Id) : (mediaIds: set Id)
   *
   * **requires** placeId provided
   *
   * **effect** returns media item IDs ordered by createdAt desc
   */
  async _getMediaByPlace({ placeId }: { placeId: Place }): Promise<Array<{ mediaId: MediaItem }> | { error: string }> {
    if (!placeId) {
      return { error: "Place ID must be provided" };
    }

    try {
      const media = await this.mediaItems
        .find({ placeId })
        .sort({ createdAt: -1 })
        .project({ _id: 1 }) // Only project the _id
        .toArray();

      return media.map((doc) => ({ mediaId: doc._id }));
    } catch (e) {
      return { error: `Failed to retrieve media for place: ${e.message}` };
    }
  }
}
```
