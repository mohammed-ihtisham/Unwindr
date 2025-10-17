[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

[@example-tests](../../../src/concepts/UserAuth/UserAuthConcept.test.ts)

# test: MediaAnalytics similar to the format of example-tests (multiple tests and helpful input/output print statements)
# response:

```typescript
// src/concepts/MediaAnalytics/MediaAnalyticsConcept.test.ts
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts"; // For generating IDs
import MediaAnalyticsConcept from "./MediaAnalyticsConcept.ts";

// Helper for checking if a result is an error
const isError = (result: any): result is { error: string } =>
  result && typeof result === "object" && "error" in result;

// Define interaction weights for easy reference in tests
const INTERACTION_WEIGHTS = {
  "view": 1,
  "tap": 2,
  "like": 5,
  "share": 10,
};

Deno.test("Principle: Each interaction adds weight to engagement score; scores are queryable", async () => {
  console.log("\n=== Testing Principle Fulfillment for MediaAnalytics ===");
  const [db, client] = await testDb();
  const concept = new MediaAnalyticsConcept(db);

  try {
    const userA = freshID();
    const userB = freshID();
    const mediaItem1 = freshID();
    const mediaItem2 = freshID(); // For a separate item to check isolation

    console.log(`\n[SETUP] Users: ${userA}, ${userB}`);
    console.log(`[SETUP] Media Items: ${mediaItem1}, ${mediaItem2}`);

    // Initial check: engagement score for mediaItem1 should be 0
    console.log(
      `\n[QUERY] _getEngagement for ${mediaItem1} (initial)`,
    );
    const initialEngagement = await concept._getEngagement({
      mediaItemId: mediaItem1,
    });
    console.log("  Output:", initialEngagement);
    assertEquals(isError(initialEngagement), false);
    assertEquals(
      (initialEngagement as { score: number }[])[0].score,
      0,
      "Initial engagement score should be 0.",
    );
    console.log(`  ✓ Initial score for ${mediaItem1} is 0`);

    // 1. UserA views mediaItem1
    console.log(
      `\n[ACTION] recordInteraction: ${userA} 'view' ${mediaItem1}`,
    );
    const viewResult = await concept.recordInteraction({
      userId: userA,
      mediaItemId: mediaItem1,
      interactionType: "view",
    });
    console.log("  Output:", viewResult);
    assertEquals(isError(viewResult), false, "View interaction should succeed.");
    console.log(`  ✓ Recorded 'view' interaction`);

    // Check engagement for mediaItem1
    console.log(
      `\n[QUERY] _getEngagement for ${mediaItem1} after 'view'`,
    );
    const engagementAfterView = await concept._getEngagement({
      mediaItemId: mediaItem1,
    });
    console.log("  Output:", engagementAfterView);
    assertEquals(isError(engagementAfterView), false);
    assertEquals(
      (engagementAfterView as { score: number }[])[0].score,
      INTERACTION_WEIGHTS.view,
      `Score should be ${INTERACTION_WEIGHTS.view} after 'view'.`,
    );
    console.log(
      `  ✓ Engagement for ${mediaItem1} updated to ${INTERACTION_WEIGHTS.view}`,
    );

    // 2. UserA taps mediaItem1
    console.log(
      `\n[ACTION] recordInteraction: ${userA} 'tap' ${mediaItem1}`,
    );
    const tapResult = await concept.recordInteraction({
      userId: userA,
      mediaItemId: mediaItem1,
      interactionType: "tap",
    });
    console.log("  Output:", tapResult);
    assertEquals(isError(tapResult), false, "Tap interaction should succeed.");
    console.log(`  ✓ Recorded 'tap' interaction`);

    // Check engagement for mediaItem1
    console.log(
      `\n[QUERY] _getEngagement for ${mediaItem1} after 'tap'`,
    );
    const engagementAfterTap = await concept._getEngagement({
      mediaItemId: mediaItem1,
    });
    console.log("  Output:", engagementAfterTap);
    assertEquals(isError(engagementAfterTap), false);
    assertEquals(
      (engagementAfterTap as { score: number }[])[0].score,
      INTERACTION_WEIGHTS.view + INTERACTION_WEIGHTS.tap,
      `Score should be ${
        INTERACTION_WEIGHTS.view + INTERACTION_WEIGHTS.tap
      } after 'view' and 'tap'.`,
    );
    console.log(
      `  ✓ Engagement for ${mediaItem1} updated to ${
        INTERACTION_WEIGHTS.view + INTERACTION_WEIGHTS.tap
      }`,
    );

    // 3. UserB likes mediaItem1
    console.log(
      `\n[ACTION] recordInteraction: ${userB} 'like' ${mediaItem1}`,
    );
    const likeResult = await concept.recordInteraction({
      userId: userB,
      mediaItemId: mediaItem1,
      interactionType: "like",
    });
    console.log("  Output:", likeResult);
    assertEquals(isError(likeResult), false, "Like interaction should succeed.");
    console.log(`  ✓ Recorded 'like' interaction`);

    // Check final engagement for mediaItem1
    const expectedFinalScore = INTERACTION_WEIGHTS.view +
      INTERACTION_WEIGHTS.tap + INTERACTION_WEIGHTS.like;
    console.log(
      `\n[QUERY] _getEngagement for ${mediaItem1} after 'like'`,
    );
    const finalEngagement = await concept._getEngagement({
      mediaItemId: mediaItem1,
    });
    console.log("  Output:", finalEngagement);
    assertEquals(isError(finalEngagement), false);
    assertEquals(
      (finalEngagement as { score: number }[])[0].score,
      expectedFinalScore,
      `Final score for ${mediaItem1} should be ${expectedFinalScore}.`,
    );
    console.log(
      `  ✓ Final engagement for ${mediaItem1} is ${expectedFinalScore}`,
    );

    // Verify mediaItem2 still has 0 engagement (isolation)
    console.log(
      `\n[QUERY] _getEngagement for ${mediaItem2} (checking isolation)`,
    );
    const item2Engagement = await concept._getEngagement({
      mediaItemId: mediaItem2,
    });
    console.log("  Output:", item2Engagement);
    assertEquals(isError(item2Engagement), false);
    assertEquals(
      (item2Engagement as { score: number }[])[0].score,
      0,
      `Engagement for ${mediaItem2} should remain 0.`,
    );
    console.log(`  ✓ Engagement for ${mediaItem2} correctly remains 0`);

    console.log(
      "\n✅ Principle demonstrated: Interactions add to engagement score, and scores are queryable and isolated.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: recordInteraction successfully logs interactions and updates engagement scores", async () => {
  console.log("\n=== Testing recordInteraction Action ===");
  const [db, client] = await testDb();
  const concept = new MediaAnalyticsConcept(db);

  try {
    const user = freshID();
    const item1 = freshID();
    const item2 = freshID();

    // Test successful recording of 'view'
    console.log("\n[TEST] Record 'view' interaction for item1");
    console.log(
      `  Input: { userId: ${user}, mediaItemId: ${item1}, interactionType: "view" }`,
    );
    const viewResult = await concept.recordInteraction({
      userId: user,
      mediaItemId: item1,
      interactionType: "view",
    });
    console.log("  Output:", viewResult);
    assertEquals(isError(viewResult), false, "View interaction should succeed.");

    // Verify interaction is logged
    const interactions1 = await concept["mediaInteractions"].find({
      mediaItemId: item1,
    }).toArray();
    assertEquals(interactions1.length, 1, "One interaction should be logged.");
    assertEquals(
      interactions1[0].interactionType,
      "view",
      "Logged interaction type should be 'view'.",
    );
    console.log(`  ✓ Interaction logged for item1`);

    // Verify engagement score
    const engagement1 = await concept._getEngagement({ mediaItemId: item1 });
    assertEquals(isError(engagement1), false);
    assertEquals(
      (engagement1 as { score: number }[])[0].score,
      INTERACTION_WEIGHTS.view,
      `Score should be ${INTERACTION_WEIGHTS.view}.`,
    );
    console.log(
      `  ✓ Engagement score for item1 updated to ${INTERACTION_WEIGHTS.view}`,
    );

    // Test successful recording of multiple different interaction types for item2
    console.log("\n[TEST] Record multiple interactions for item2");
    await concept.recordInteraction({
      userId: user,
      mediaItemId: item2,
      interactionType: "tap",
    });
    await concept.recordInteraction({
      userId: user,
      mediaItemId: item2,
      interactionType: "like",
    });
    await concept.recordInteraction({
      userId: user,
      mediaItemId: item2,
      interactionType: "share",
    });
    console.log(`  ✓ Multiple interactions recorded for item2`);

    // Verify engagement score for item2
    const expectedScoreItem2 = INTERACTION_WEIGHTS.tap +
      INTERACTION_WEIGHTS.like + INTERACTION_WEIGHTS.share;
    const engagement2 = await concept._getEngagement({ mediaItemId: item2 });
    assertEquals(isError(engagement2), false);
    assertEquals(
      (engagement2 as { score: number }[])[0].score,
      expectedScoreItem2,
      `Score for item2 should be ${expectedScoreItem2}.`,
    );
    console.log(
      `  ✓ Engagement score for item2 updated to ${expectedScoreItem2}`,
    );

    // Test rejection of invalid interaction type
    console.log("\n[TEST] Reject invalid interaction type");
    console.log(
      `  Input: { userId: ${user}, mediaItemId: ${item1}, interactionType: "invalid" }`,
    );
    const invalidInteractionResult = await concept.recordInteraction({
      userId: user,
      mediaItemId: item1,
      interactionType: "invalid",
    });
    console.log("  Output:", invalidInteractionResult);
    assertEquals(
      isError(invalidInteractionResult),
      true,
      "Invalid interaction should return an error.",
    );
    assertEquals(
      (invalidInteractionResult as { error: string }).error,
      "Invalid interaction type: invalid",
      "Error message should indicate invalid type.",
    );
    console.log(`  ✓ Correctly rejected invalid interaction type`);

    // Verify no change in score for item1 after invalid interaction attempt
    const engagement1AfterInvalid = await concept._getEngagement({
      mediaItemId: item1,
    });
    assertEquals(isError(engagement1AfterInvalid), false);
    assertEquals(
      (engagement1AfterInvalid as { score: number }[])[0].score,
      INTERACTION_WEIGHTS.view, // Should remain unchanged
      `Score for item1 should remain ${INTERACTION_WEIGHTS.view} after failed attempt.`,
    );
    console.log(
      `  ✓ Engagement score for item1 remained unchanged after invalid attempt`,
    );

    console.log("\n✅ All recordInteraction requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getEngagement accurately retrieves engagement scores", async () => {
  console.log("\n=== Testing _getEngagement Query ===");
  const [db, client] = await testDb();
  const concept = new MediaAnalyticsConcept(db);

  try {
    const user = freshID();
    const mediaItemA = freshID();
    const mediaItemB = freshID(); // No interactions for this item
    const mediaItemC = freshID(); // Item that will exist but have score 0 initially

    // Setup: Record some interactions for mediaItemA
    console.log("\n[SETUP] Record interactions for mediaItemA");
    await concept.recordInteraction({
      userId: user,
      mediaItemId: mediaItemA,
      interactionType: "view",
    });
    await concept.recordInteraction({
      userId: user,
      mediaItemId: mediaItemA,
      interactionType: "like",
    });
    const expectedScoreA = INTERACTION_WEIGHTS.view + INTERACTION_WEIGHTS.like;
    console.log(
      `  ✓ mediaItemA set up with score ${expectedScoreA}`,
    );

    // Setup: Explicitly create a MediaEngagement entry for mediaItemC with score 0
    await concept["mediaEngagement"].insertOne({ _id: mediaItemC, score: 0 });
    console.log(`  ✓ mediaItemC created with initial score 0`);

    // Test retrieving engagement for mediaItemA (existing, score > 0)
    console.log("\n[TEST] _getEngagement for existing item with score > 0");
    console.log(`  Input: { mediaItemId: ${mediaItemA} }`);
    const engagementA = await concept._getEngagement({ mediaItemId: mediaItemA });
    console.log("  Output:", engagementA);
    assertEquals(isError(engagementA), false);
    assertEquals(
      (engagementA as { score: number }[])[0].score,
      expectedScoreA,
      `Engagement for mediaItemA should be ${expectedScoreA}.`,
    );
    console.log(`  ✓ Retrieved correct score for mediaItemA`);

    // Test retrieving engagement for mediaItemB (no interactions, no explicit entry)
    console.log("\n[TEST] _getEngagement for non-existent item (no interactions)");
    console.log(`  Input: { mediaItemId: ${mediaItemB} }`);
    const engagementB = await concept._getEngagement({ mediaItemId: mediaItemB });
    console.log("  Output:", engagementB);
    assertEquals(isError(engagementB), false);
    assertEquals(
      (engagementB as { score: number }[])[0].score,
      0,
      "Engagement for non-existent item should be 0.",
    );
    console.log(`  ✓ Retrieved 0 score for non-existent item`);

    // Test retrieving engagement for mediaItemC (existing, score 0)
    console.log("\n[TEST] _getEngagement for existing item with score 0");
    console.log(`  Input: { mediaItemId: ${mediaItemC} }`);
    const engagementC = await concept._getEngagement({ mediaItemId: mediaItemC });
    console.log("  Output:", engagementC);
    assertEquals(isError(engagementC), false);
    assertEquals(
      (engagementC as { score: number }[])[0].score,
      0,
      "Engagement for item with 0 score should be 0.",
    );
    console.log(`  ✓ Retrieved 0 score for itemC`);

    // Test with invalid mediaItemId (e.g., empty string)
    console.log("\n[TEST] _getEngagement with invalid mediaItemId (empty string)");
    console.log('  Input: { mediaItemId: "" }');
    const invalidEngagement = await concept._getEngagement({ mediaItemId: "" as ID });
    console.log("  Output:", invalidEngagement);
    assertEquals(isError(invalidEngagement), true);
    assertEquals(
      (invalidEngagement as { error: string }).error,
      "mediaItemId must be provided",
      "Error message should indicate missing ID.",
    );
    console.log(`  ✓ Correctly rejected empty mediaItemId`);

    console.log("\n✅ All _getEngagement requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Action: recomputeScoresForPlace recalculates engagement scores correctly", async () => {
  console.log("\n=== Testing recomputeScoresForPlace Action ===");
  const [db, client] = await testDb();
  const concept = new MediaAnalyticsConcept(db);

  try {
    const user1 = freshID();
    const user2 = freshID();
    const placeId = freshID();
    const mediaItemX = freshID();
    const mediaItemY = freshID();
    const mediaItemZ = freshID(); // No interactions for this one

    // Setup: Initial interactions for mediaItemX and mediaItemY
    console.log("\n[SETUP] Record initial interactions");
    await concept.recordInteraction({
      userId: user1,
      mediaItemId: mediaItemX,
      interactionType: "view",
    }); // Score: 1
    await concept.recordInteraction({
      userId: user1,
      mediaItemId: mediaItemY,
      interactionType: "tap",
    }); // Score: 2
    await concept.recordInteraction({
      userId: user2,
      mediaItemId: mediaItemY,
      interactionType: "like",
    }); // Score: 2 + 5 = 7

    let scoreX = (await concept._getEngagement({ mediaItemId: mediaItemX }) as { score: number }[])[0].score;
    let scoreY = (await concept._getEngagement({ mediaItemId: mediaItemY }) as { score: number }[])[0].score;
    assertEquals(scoreX, 1);
    assertEquals(scoreY, 7);
    console.log(`  ✓ Initial scores: mediaItemX = ${scoreX}, mediaItemY = ${scoreY}`);

    // Test recomputation for items with existing interactions
    console.log(
      "\n[TEST] Recompute scores for mediaItemX and mediaItemY",
    );
    console.log(
      `  Input: { placeId: ${placeId}, mediaItemIds: [${mediaItemX}, ${mediaItemY}] }`,
    );
    const recomputeResult1 = await concept.recomputeScoresForPlace({
      placeId,
      mediaItemIds: [mediaItemX, mediaItemY],
    });
    console.log("  Output:", recomputeResult1);
    assertEquals(
      isError(recomputeResult1),
      false,
      "Recomputation should succeed.",
    );

    scoreX = (await concept._getEngagement({ mediaItemId: mediaItemX }) as { score: number }[])[0].score;
    scoreY = (await concept._getEngagement({ mediaItemId: mediaItemY }) as { score: number }[])[0].score;
    assertEquals(scoreX, 1, "mediaItemX score should be 1 after recompute.");
    assertEquals(scoreY, 7, "mediaItemY score should be 7 after recompute.");
    console.log(`  ✓ Recomputed scores match original (no new interactions): mediaItemX = ${scoreX}, mediaItemY = ${scoreY}`);

    // Test recomputation for an item with no interactions (should be 0)
    console.log(
      "\n[TEST] Recompute score for mediaItemZ (no interactions)",
    );
    console.log(
      `  Input: { placeId: ${placeId}, mediaItemIds: [${mediaItemZ}] }`,
    );
    const recomputeResultZ = await concept.recomputeScoresForPlace({
      placeId,
      mediaItemIds: [mediaItemZ],
    });
    console.log("  Output:", recomputeResultZ);
    assertEquals(isError(recomputeResultZ), false);
    const scoreZ = (await concept._getEngagement({ mediaItemId: mediaItemZ }) as { score: number }[])[0].score;
    assertEquals(scoreZ, 0, "mediaItemZ score should be 0 after recompute.");
    console.log(`  ✓ Recomputed score for mediaItemZ is 0`);

    // Add new interactions and recompute again to verify updates
    console.log("\n[SETUP] Add new interactions for mediaItemX");
    await concept.recordInteraction({
      userId: user2,
      mediaItemId: mediaItemX,
      interactionType: "share",
    }); // mediaItemX score becomes 1 (initial) + 10 (share) = 11
    console.log(`  ✓ Added 'share' interaction to mediaItemX`);

    console.log(
      "\n[TEST] Recompute scores for mediaItemX after new interaction",
    );
    console.log(
      `  Input: { placeId: ${placeId}, mediaItemIds: [${mediaItemX}] }`,
    );
    const recomputeResult2 = await concept.recomputeScoresForPlace({
      placeId,
      mediaItemIds: [mediaItemX],
    });
    console.log("  Output:", recomputeResult2);
    assertEquals(isError(recomputeResult2), false);

    scoreX = (await concept._getEngagement({ mediaItemId: mediaItemX }) as { score: number }[])[0].score;
    const expectedNewScoreX = INTERACTION_WEIGHTS.view + INTERACTION_WEIGHTS.share;
    assertEquals(
      scoreX,
      expectedNewScoreX,
      `mediaItemX score should be ${expectedNewScoreX} after recompute.`,
    );
    console.log(`  ✓ mediaItemX score correctly recomputed to ${scoreX}`);

    // Test with an empty mediaItemIds array (should be a no-op, not an error)
    console.log(
      "\n[TEST] recomputeScoresForPlace with empty mediaItemIds array",
    );
    console.log(
      `  Input: { placeId: ${placeId}, mediaItemIds: [] }`,
    );
    const emptyRecomputeResult = await concept.recomputeScoresForPlace({
      placeId,
      mediaItemIds: [],
    });
    console.log("  Output:", emptyRecomputeResult);
    assertEquals(
      isError(emptyRecomputeResult),
      false,
      "Empty mediaItemIds should not cause an error.",
    );
    console.log(`  ✓ Empty mediaItemIds array handled as no-op`);

    // Test with invalid placeId (concept independence means this just needs to be non-empty)
    console.log("\n[TEST] recomputeScoresForPlace with invalid placeId (empty string)");
    console.log(
      `  Input: { placeId: "" }`,
    );
    const invalidPlaceIdResult = await concept.recomputeScoresForPlace({
      placeId: "" as ID,
      mediaItemIds: [mediaItemX],
    });
    console.log("  Output:", invalidPlaceIdResult);
    assertEquals(
      isError(invalidPlaceIdResult),
      true,
      "Should return an error for invalid placeId.",
    );
    assertEquals(
      (invalidPlaceIdResult as { error: string }).error,
      "placeId must be provided",
      "Error message should indicate missing placeId.",
    );
    console.log(`  ✓ Correctly rejected empty placeId`);

    console.log("\n✅ All recomputeScoresForPlace requirements verified");
  } finally {
    await client.close();
  }
});
```