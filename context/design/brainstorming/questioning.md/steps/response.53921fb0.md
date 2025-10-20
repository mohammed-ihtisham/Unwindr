---
timestamp: 'Sun Oct 19 2025 20:37:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_203724.f23c5609.md]]'
content_id: 53921fb06358deda43742e91570bb9c6411f8ec005df8b60de747a378ef87088
---

# response:

To make the `MediaAnalytics` concept 100% complete for bare-minimum MVP functionality, we need to:

1. **Formalize Interaction Weights:** Move the `interactionType` weights from "Design Notes" into the concept definition, as they are crucial for the `recordInteraction` action. A `configuration` section is suitable for this.
2. **Refine `recomputeScores` Action:** The `placeId` in `recomputeScoresForPlace` introduces an external dependency not explicitly part of `MediaAnalytics`'s core state (`MediaInteraction` or `MediaEngagement`). For bare-minimum `MediaAnalytics` (focused on `MediaItem` and `User`), a more generic `recomputeScores` for a set of `mediaItemId`s is more appropriate and self-contained.
3. **Add Detail to `requires` and `effect`:** Be more explicit about preconditions and postconditions for core actions, especially how engagement scores are initialized or updated.

Here's the updated `MediaAnalytics` concept:

```concept
concept MediaAnalytics [User, MediaItem]
purpose record and compute engagement scores for media items
principle each interaction adds weight to engagement score; scores are queryable

configuration
  // Defines the scoring weights for each interaction type
  interactionWeights Map<String, Number> = {
    "view": 1,
    "tap": 2,
    "like": 5,
    "share": 10
  }

state
  // Stores raw interaction data for audit and recomputation
  a set of MediaInteractions with
    an _id Id // Unique identifier for the interaction
    a mediaItemId Id // Refers to the MediaItem being interacted with
    a userId Id // Refers to the User performing the interaction
    a interactionType String // "view" | "tap" | "like" | "share" (must be a key in interactionWeights)
    a ts Date // Timestamp of the interaction

  // Stores the current aggregated engagement score for each media item
  a set of MediaEngagement with
    a mediaItemId Id // Refers to the MediaItem
    a score Number // The current engagement score

actions
  recordInteraction (userId: Id, mediaItemId: Id, interactionType: String)
    requires
      interactionType is one of interactionWeights keys (i.e., "view", "tap", "like", "share")
      userId refers to an existing User
      mediaItemId refers to an existing MediaItem
    effect
      Let weight = interactionWeights[interactionType]
      Create new MediaInteraction { _id: generateId(), mediaItemId, userId, interactionType, ts: now() }
      Add this new MediaInteraction to the set of MediaInteractions.

      Find MediaEngagement for mediaItemId.
      If MediaEngagement for mediaItemId does not exist, initialize its score to 0.
      Update the score for MediaEngagement for mediaItemId by adding 'weight'.
      If it was new, insert it into the set of MediaEngagement; otherwise, update the existing entry.

  getEngagement (mediaItemId: Id) : (score: Number)
    requires
      mediaItemId provided refers to an existing MediaItem
    effect
      Returns the 'score' from the MediaEngagement entry for mediaItemId.
      If no MediaEngagement entry exists for mediaItemId, returns 0.

  recomputeScores (mediaItemIds: set Id)
    requires
      mediaItemIds must refer to existing MediaItems
      mediaItemIds set is not empty (for efficiency; empty set is a no-op)
    effect
      For each mediaItemId in the provided mediaItemIds:
        Calculate `totalScore = sum(interactionWeights[interaction.interactionType])`
          for all MediaInteractions where `interaction.mediaItemId == mediaItemId`.
        If MediaEngagement for mediaItemId exists, update its 'score' to `totalScore`.
        If MediaEngagement for mediaItemId does not exist and `totalScore > 0`, create a new MediaEngagement
          { mediaItemId, score: totalScore } and add it to the set.
        If MediaEngagement for mediaItemId exists and `totalScore == 0`, its score is set to 0.

## Design Notes

*   Interaction types have different weights as defined in `interactionWeights`.
*   Engagement scores are computed incrementally on each interaction via `recordInteraction`.
*   `recomputeScores` allows batch recalculation from raw interactions if needed (e.g., for data correction or historical analysis).
*   All interactions are logged with a timestamp for potential future analytics and auditability.
```
