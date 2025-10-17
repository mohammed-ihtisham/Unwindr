import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**
 * concept MediaAnalytics [User, MediaItem]
 * purpose record and compute engagement scores for media items
 * principle each interaction adds weight to engagement score; scores are queryable
 */
const PREFIX = "MediaAnalytics" + ".";

// Generic types of this concept
type User = ID;
type MediaItem = ID;

/**
 * a set of MediaInteractions with
 * an _id Id
 * a mediaItemId Id
 * a userId Id
 * a interactionType String // "view" | "tap" | "like" | "share"
 * a ts Date
 */
interface MediaInteractionDoc {
  _id: ID;
  mediaItemId: MediaItem;
  userId: User;
  interactionType: "view" | "tap" | "like" | "share";
  ts: Date;
}

/**
 * a set of MediaEngagement with
 * a mediaItemId Id
 * a score Number
 */
interface MediaEngagementDoc {
  _id: MediaItem; // Using mediaItemId as _id for uniqueness per media item
  score: number;
}

// Design Notes: Interaction types have different weights
const interactionWeights: Record<
  MediaInteractionDoc["interactionType"],
  number
> = {
  "view": 1,
  "tap": 2,
  "like": 5,
  "share": 10,
};

const validInteractionTypes = Object.keys(interactionWeights);

export default class MediaAnalyticsConcept {
  private mediaInteractions: Collection<MediaInteractionDoc>;
  private mediaEngagement: Collection<MediaEngagementDoc>;

  constructor(private readonly db: Db) {
    this.mediaInteractions = this.db.collection(PREFIX + "mediaInteractions");
    this.mediaEngagement = this.db.collection(PREFIX + "mediaEngagement");
  }

  /**
   * recordInteraction (userId: Id, mediaItemId: Id, interactionType: String): Empty | { error: String }
   *
   * **requires** interactionType of interaction is valid
   *
   * **effects** logs interaction and increments engagement score by weight(interactionType)
   */
  async recordInteraction(
    { userId, mediaItemId, interactionType }: {
      userId: User;
      mediaItemId: MediaItem;
      interactionType: string;
    },
  ): Promise<Empty | { error: string }> {
    if (!validInteractionTypes.includes(interactionType)) {
      return { error: `Invalid interaction type: ${interactionType}` };
    }

    const weight =
      interactionWeights[
        interactionType as MediaInteractionDoc["interactionType"]
      ];

    // Log interaction
    const newInteraction: MediaInteractionDoc = {
      _id: freshID(), // Generate a fresh ID for the interaction record
      mediaItemId,
      userId,
      interactionType:
        interactionType as MediaInteractionDoc["interactionType"],
      ts: new Date(),
    };
    await this.mediaInteractions.insertOne(newInteraction);

    // Increment engagement score, creating the entry if it doesn't exist
    await this.mediaEngagement.updateOne(
      { _id: mediaItemId },
      { $inc: { score: weight } },
      { upsert: true }, // Create the document if it does not exist
    );

    return {};
  }

  /**
   * _getEngagement (mediaItemId: Id) : ({ score: Number }[]) | { error: String }
   *
   * **requires** mediaItemId provided is valid (interpreted as a non-empty string ID)
   *
   * **effects** returns engagement score or 0 (if no engagement data is found for the item)
   */
  async _getEngagement(
    { mediaItemId }: { mediaItemId: MediaItem },
  ): Promise<{ score: number }[] | { error: string }> {
    if (!mediaItemId) {
      return { error: "mediaItemId must be provided" };
    }

    const engagement = await this.mediaEngagement.findOne({ _id: mediaItemId });

    // As per the concept, returns engagement score or 0 if no engagement
    return [{ score: engagement?.score || 0 }];
  }

  /**
   * recomputeScoresForPlace (placeId: Id, mediaItemIds: set Id): Empty | { error: String }
   *
   * **requires** placeId (contextual identifier) and mediaItemIds (items to recompute) must exist and be valid IDs
   *
   * **effects** recomputes scores for the specified media items from all logged interactions,
   *             resetting existing scores and updating them based on current interaction data.
   *             The 'placeId' is a contextual argument and not used to filter internal state within this concept
   *             due to concept independence.
   */
  async recomputeScoresForPlace(
    { placeId, mediaItemIds }: { placeId: ID; mediaItemIds: MediaItem[] },
  ): Promise<Empty | { error: string }> {
    if (!placeId) {
      return { error: "placeId must be provided" };
    }
    if (!mediaItemIds || mediaItemIds.length === 0) {
      // If no mediaItemIds are provided, there's nothing specific to recompute.
      // Treat this as a successful no-op rather than an error.
      return {};
    }

    // 1. Reset scores for the given mediaItemIds in MediaEngagement.
    // This ensures that items without recent interactions will correctly have a score of 0.
    // Using bulkWrite for efficiency if mediaItemIds is large.
    const resetOperations = mediaItemIds.map((id) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { score: 0 } },
        upsert: true, // Ensure the document exists, even if no interactions are found
      },
    }));
    if (resetOperations.length > 0) {
      await this.mediaEngagement.bulkWrite(resetOperations);
    }

    // 2. Fetch all MediaInteractions relevant to the specified mediaItemIds
    const interactions = await this.mediaInteractions.find({
      mediaItemId: { $in: mediaItemIds },
    }).toArray();

    // 3. Group interactions by mediaItemId and sum their weights to compute new scores
    const newScores: Map<MediaItem, number> = new Map();
    for (const interaction of interactions) {
      const weight = interactionWeights[interaction.interactionType];
      newScores.set(
        interaction.mediaItemId,
        (newScores.get(interaction.mediaItemId) || 0) + weight,
      );
    }

    // 4. Update MediaEngagement with these newly computed total scores.
    // Only update items that actually had interactions, as others were set to 0 above.
    const updateOperations = [];
    for (const [mediaItemId, score] of newScores.entries()) {
      updateOperations.push({
        updateOne: {
          filter: { _id: mediaItemId },
          update: { $set: { score: score } },
          upsert: true, // Still upsert, though they should exist from the reset step
        },
      });
    }

    if (updateOperations.length > 0) {
      await this.mediaEngagement.bulkWrite(updateOperations);
    }

    return {};
  }
}
