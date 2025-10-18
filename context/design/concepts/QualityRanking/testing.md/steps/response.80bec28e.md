---
timestamp: 'Fri Oct 17 2025 20:35:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_203557.e3e7a19f.md]]'
content_id: 80bec28ebb3bd3a661e3f6de84495543ca397dfed17e73fff9939f841cd8f846
---

# response:

```typescript
// file: src/concepts/QualityRanking/QualityRankingConcept.test.ts
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import QualityRankingConcept from "./QualityRankingConcept.ts";

// Helper for checking if a result is an error
const isError = (result: any): result is { error: string } =>
  result && typeof result === "object" && "error" in result;

// Define generic types for clarity in tests
type Place = ID;
type User = ID;

Deno.test("Principle: QualityRanking promotes well-loved places regardless of popularity, helping users discover authentic local favorites", async () => {
  console.log(
    "\n=== Testing QualityRanking Principle Fulfillment: Discovering Hidden Gems ===",
  );
  const [db, client] = await testDb();
  const concept = new QualityRankingConcept(db);

  try {
    // 1. Setup: Define several places and their raw metrics
    const placeA_id = freshID() as Place; // Popular place: high visits, high engagement -> moderate score
    const placeB_id = freshID() as Place; // Hidden gem: low visits, high engagement -> high score
    const placeC_id = freshID() as Place; // Low quality/low engagement: low visits, low engagement -> low score
    const placeD_id = freshID() as Place; // Medium popularity: medium visits, medium engagement -> medium score

    console.log(`\n[SETUP] Registering places and updating initial metrics:`);
    console.log(`  Place A (Popular): ID ${placeA_id}`);
    console.log(`  Place B (Hidden Gem): ID ${placeB_id}`);
    console.log(`  Place C (Low Quality): ID ${placeC_id}`);
    console.log(`  Place D (Medium): ID ${placeD_id}`);

    // Update metrics for Place A (Popular)
    console.log(
      `  [ACTION] updateMetrics({ placeId: ${placeA_id}, visits: 500, engagement: 400 })`,
    );
    await concept.updateMetrics({ placeId: placeA_id, visits: 500, engagement: 400 });
    // Update metrics for Place B (Hidden Gem - low visits, high engagement)
    console.log(
      `  [ACTION] updateMetrics({ placeId: ${placeB_id}, visits: 20, engagement: 100 })`,
    );
    await concept.updateMetrics({ placeId: placeB_id, visits: 20, engagement: 100 });
    // Update metrics for Place C (Low Quality)
    console.log(
      `  [ACTION] updateMetrics({ placeId: ${placeC_id}, visits: 10, engagement: 5 })`,
    );
    await concept.updateMetrics({ placeId: placeC_id, visits: 10, engagement: 5 });
    // Update metrics for Place D (Medium quality, medium volume)
    console.log(
      `  [ACTION] updateMetrics({ placeId: ${placeD_id}, visits: 100, engagement: 100 })`,
    );
    await concept.updateMetrics({ placeId: placeD_id, visits: 100, engagement: 100 });
    console.log(`  ✓ Initial metrics updated for all places.`);

    // 2. Action: Calculate Quality Scores for all places
    console.log(`\n[ACTION] Calculating quality scores for all places:`);
    const scoreA_res = await concept.calculateQualityScore({ placeId: placeA_id });
    const scoreB_res = await concept.calculateQualityScore({ placeId: placeB_id });
    const scoreC_res = await concept.calculateQualityScore({ placeId: placeC_id });
    const scoreD_res = await concept.calculateQualityScore({ placeId: placeD_id });

    assertEquals(isError(scoreA_res), false, "Score A calculation should succeed.");
    assertEquals(isError(scoreB_res), false, "Score B calculation should succeed.");
    assertEquals(isError(scoreC_res), false, "Score C calculation should succeed.");
    assertEquals(isError(scoreD_res), false, "Score D calculation should succeed.");

    const scoreA = (scoreA_res as { score: number }).score; // 400 / 500 = 0.8
    const scoreB = (scoreB_res as { score: number }).score; // 100 / 20 = 5.0
    const scoreC = (scoreC_res as { score: number }).score; // 5 / 10 = 0.5
    const scoreD = (scoreD_res as { score: number }).score; // 100 / 100 = 1.0

    console.log(`  Place A Quality Score: ${scoreA} (Engagement: 400, Visits: 500)`);
    console.log(`  Place B Quality Score: ${scoreB} (Engagement: 100, Visits: 20)`);
    console.log(`  Place C Quality Score: ${scoreC} (Engagement: 5, Visits: 10)`);
    console.log(`  Place D Quality Score: ${scoreD} (Engagement: 100, Visits: 100)`);
    console.log(`  ✓ Quality scores computed and updated in state.`);

    // 3. Setup: Define two users with different preferences
    const userStandard_id = freshID() as User; // Prefers standard ranking (by quality score)
    const userEmergent_id = freshID() as User; // Prefers emergent places (lower visitor volume)

    console.log(`\n[SETUP] Setting ranking preferences for two users:`);
    console.log(
      `  [ACTION] setPreferences({ userId: ${userStandard_id}, prefersEmergent: false, radius: 100 })`,
    );
    await concept.setPreferences({
      userId: userStandard_id,
      prefersEmergent: false,
      radius: 100,
    });
    console.log(
      `  [ACTION] setPreferences({ userId: ${userEmergent_id}, prefersEmergent: true, radius: 100 })`,
    );
    await concept.setPreferences({
      userId: userEmergent_id,
      prefersEmergent: true,
      radius: 100,
    });
    console.log(`  ✓ User preferences set.`);

    // 4. Query: Get recommendations for the standard user (prioritize by quality score, descending)
    console.log(
      `\n[QUERY] Getting recommendations for User Standard (prefersEmergent: false):`,
    );
    console.log(
      "  NOTE: centerLat, centerLng, and radius are currently ignored for geo-filtering.",
    );
    const standardRecs_res = await concept._getRecommendedPlaces({
      userId: userStandard_id,
      centerLat: 0,
      centerLng: 0,
    });
    assertEquals(
      isError(standardRecs_res),
      false,
      "Standard user recommendations query should succeed.",
    );
    const standardRecs = (standardRecs_res as Array<{ place: Place }>).map(
      (r) => r.place,
    );
    console.log(`  Output (Recommended places IDs): ${standardRecs}`);

    // Expected order for standard user (by qualityScore descending):
    // Place B (5.0), Place D (1.0), Place A (0.8), Place C (0.5)
    // For ties in quality score (not present in this specific setup, D=1.0, A=0.8, C=0.5), the concept doesn't specify a secondary sort.
    assertEquals(
      standardRecs,
      [placeB_id, placeD_id, placeA_id, placeC_id],
      "Standard user should get recommendations ranked by quality score (desc).",
    );
    console.log(
      `  ✓ Standard user recommendations match: ${JSON.stringify(standardRecs)}`,
    );

    // 5. Query: Get recommendations for the emergent user (prioritize by low visitor volume, then quality score descending)
    console.log(
      `\n[QUERY] Getting recommendations for User Emergent (prefersEmergent: true):`,
    );
    console.log(
      "  NOTE: centerLat, centerLng, and radius are currently ignored for geo-filtering.",
    );
    const emergentRecs_res = await concept._getRecommendedPlaces({
      userId: userEmergent_id,
      centerLat: 0,
      centerLng: 0,
    });
    assertEquals(
      isError(emergentRecs_res),
      false,
      "Emergent user recommendations query should succeed.",
    );
    const emergentRecs = (emergentRecs_res as Array<{ place: Place }>).map(
      (r) => r.place,
    );
    console.log(`  Output (Recommended places IDs): ${emergentRecs}`);

    // Expected order for emergent user (by visitorVolume ascending, then qualityScore descending for ties):
    // Place C (vol 10, score 0.5)
    // Place B (vol 20, score 5.0)
    // Place D (vol 100, score 1.0)
    // Place A (vol 500, score 0.8)
    assertEquals(
      emergentRecs,
      [placeC_id, placeB_id, placeD_id, placeA_id],
      "Emergent user should get recommendations ranked by visitor volume (asc) then quality score (desc).",
    );
    console.log(
      `  ✓ Emergent user recommendations match: ${JSON.stringify(emergentRecs)}`,
    );

    console.log(
      "\n✅ Principle demonstrated: The concept surfaces lesser-known, high-engagement places by computing quality scores and adjusting recommendations based on user preferences (emergent vs. popular), fulfilling its purpose.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: updateMetrics successfully updates metrics and enforces requirements", async () => {
  console.log("\n=== Testing updateMetrics Action ===");
  const [db, client] = await testDb();
  const concept = new QualityRankingConcept(db);

  try {
    const place1_id = freshID() as Place;
    const place2_id = freshID() as Place;

    // Test Case 1: Successfully update metrics for a new place
    console.log("\n[TEST] Update metrics for a new place (Place1)");
    console.log(`  Input: { placeId: ${place1_id}, visits: 10, engagement: 5 }`);
    const result1 = await concept.updateMetrics({
      placeId: place1_id,
      visits: 10,
      engagement: 5,
    });
    console.log("  Output:", result1);
    assertEquals(
      isError(result1),
      false,
      "Expected updateMetrics for new place to succeed.",
    );
    const metrics1 = await concept["rankingMetrics"].findOne({ _id: place1_id });
    assertEquals(
      metrics1?.visitorVolume,
      10,
      "Effect: Visitor volume should be 10.",
    );
    assertEquals(
      metrics1?.engagementRatio,
      5,
      "Effect: Engagement ratio should be 5.",
    );
    assertEquals(
      metrics1?.qualityScore,
      0,
      "Effect: Quality score should be initialized to 0.",
    );
    console.log(
      `  ✓ Place1 metrics created: visits=10, engagement=5, qualityScore=0`,
    );

    // Test Case 2: Successfully update metrics for an existing place (Place1)
    console.log("\n[TEST] Update metrics for an existing place (Place1) with new values");
    console.log(`  Input: { placeId: ${place1_id}, visits: 20, engagement: 15 }`);
    const result2 = await concept.updateMetrics({
      placeId: place1_id,
      visits: 20,
      engagement: 15,
    });
    console.log("  Output:", result2);
    assertEquals(
      isError(result2),
      false,
      "Expected updateMetrics for existing place to succeed.",
    );
    const metrics2 = await concept["rankingMetrics"].findOne({ _id: place1_id });
    assertEquals(
      metrics2?.visitorVolume,
      20,
      "Effect: Visitor volume should be updated to 20.",
    );
    assertEquals(
      metrics2?.engagementRatio,
      15,
      "Effect: Engagement ratio should be updated to 15.",
    );
    assertEquals(
      metrics2?.qualityScore,
      0,
      "Effect: Quality score should remain 0 (not recomputed by this action).",
    );
    console.log(
      `  ✓ Place1 metrics updated: visits=20, engagement=15, qualityScore=0`,
    );

    // Test Case 3: Update metrics with zero visits and engagement
    console.log("\n[TEST] Update metrics with zero visits and engagement (Place2)");
    console.log(`  Input: { placeId: ${place2_id}, visits: 0, engagement: 0 }`);
    const result3 = await concept.updateMetrics({
      placeId: place2_id,
      visits: 0,
      engagement: 0,
    });
    console.log("  Output:", result3);
    assertEquals(
      isError(result3),
      false,
      "Expected updateMetrics for zero values to succeed.",
    );
    const metrics3 = await concept["rankingMetrics"].findOne({ _id: place2_id });
    assertEquals(
      metrics3?.visitorVolume,
      0,
      "Effect: Visitor volume should be 0.",
    );
    assertEquals(
      metrics3?.engagementRatio,
      0,
      "Effect: Engagement ratio should be 0.",
    );
    console.log(
      `  ✓ Place2 metrics created with zero values: visits=0, engagement=0`,
    );

    // Test Case 4: Reject update with negative visits (violates requires)
    console.log("\n[TEST] Reject update with negative visits (violates requires)");
    const placeNegVisits_id = freshID() as Place;
    console.log(
      `  Input: { placeId: ${placeNegVisits_id}, visits: -5, engagement: 10 }`,
    );
    const resultNegVisits = await concept.updateMetrics({
      placeId: placeNegVisits_id,
      visits: -5,
      engagement: 10,
    });
    console.log("  Output:", resultNegVisits);
    assertEquals(
      isError(resultNegVisits),
      true,
      "Expected error for negative visits.",
    );
    assertEquals(
      (resultNegVisits as { error: string }).error,
      "Visits and engagement must be non-negative.",
      "Error message should indicate non-negative requirement.",
    );
    const nonExistentMetrics = await concept["rankingMetrics"].findOne({
      _id: placeNegVisits_id,
    });
    assertEquals(
      nonExistentMetrics,
      null,
      "Effect: No metrics should be created for invalid input.",
    );
    console.log(`  ✓ Correctly rejected negative visits`);

    // Test Case 5: Reject update with negative engagement (violates requires)
    console.log("\n[TEST] Reject update with negative engagement (violates requires)");
    const placeNegEngagement_id = freshID() as Place;
    console.log(
      `  Input: { placeId: ${placeNegEngagement_id}, visits: 10, engagement: -2 }`,
    );
    const resultNegEngagement = await concept.updateMetrics({
      placeId: placeNegEngagement_id,
      visits: 10,
      engagement: -2,
    });
    console.log("  Output:", resultNegEngagement);
    assertEquals(
      isError(resultNegEngagement),
      true,
      "Expected error for negative engagement.",
    );
    assertEquals(
      (resultNegEngagement as { error: string }).error,
      "Visits and engagement must be non-negative.",
      "Error message should indicate non-negative requirement.",
    );
    const nonExistentMetrics2 = await concept["rankingMetrics"].findOne({
      _id: placeNegEngagement_id,
    });
    assertEquals(
      nonExistentMetrics2,
      null,
      "Effect: No metrics should be created for invalid input.",
    );
    console.log(`  ✓ Correctly rejected negative engagement`);

    console.log("\n✅ All updateMetrics requirements and effects verified.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: calculateQualityScore computes and updates scores correctly", async () => {
  console.log("\n=== Testing calculateQualityScore Action ===");
  const [db, client] = await testDb();
  const concept = new QualityRankingConcept(db);

  try {
    const placeA_id = freshID() as Place;
    const placeB_id = freshID() as Place;
    const placeC_id = freshID() as Place; // Place with 0 visits

    // Setup: Update initial metrics for places (prerequisite for calculateQualityScore)
    console.log("\n[SETUP] Update initial metrics for Place A, B, C");
    await concept.updateMetrics({ placeId: placeA_id, visits: 100, engagement: 80 }); // Expected Score = 0.8
    await concept.updateMetrics({ placeId: placeB_id, visits: 10, engagement: 50 }); // Expected Score = 5.0
    await concept.updateMetrics({ placeId: placeC_id, visits: 0, engagement: 10 }); // Expected Score = 10.0 (10 / max(0,1))
    console.log(`  ✓ Initial metrics updated.`);

    // Test Case 1: Calculate score for Place A
    console.log(`\n[TEST] Calculate quality score for Place A (ID: ${placeA_id})`);
    console.log(`  Input: { placeId: ${placeA_id} }`);
    const scoreA_res = await concept.calculateQualityScore({ placeId: placeA_id });
    console.log("  Output:", scoreA_res);
    assertEquals(
      isError(scoreA_res),
      false,
      "Expected score calculation for Place A to succeed.",
    );
    assertEquals(
      (scoreA_res as { score: number }).score,
      0.8,
      "Effect: Score for Place A should be 0.8.",
    );
    const metricsA = await concept["rankingMetrics"].findOne({ _id: placeA_id });
    assertEquals(
      metricsA?.qualityScore,
      0.8,
      "Effect: Quality score in DB should be updated to 0.8.",
    );
    console.log(`  ✓ Place A quality score calculated and updated.`);

    // Test Case 2: Calculate score for Place B (Hidden Gem)
    console.log(`\n[TEST] Calculate quality score for Place B (ID: ${placeB_id})`);
    console.log(`  Input: { placeId: ${placeB_id} }`);
    const scoreB_res = await concept.calculateQualityScore({ placeId: placeB_id });
    console.log("  Output:", scoreB_res);
    assertEquals(
      isError(scoreB_res),
      false,
      "Expected score calculation for Place B to succeed.",
    );
    assertEquals(
      (scoreB_res as { score: number }).score,
      5.0,
      "Effect: Score for Place B should be 5.0.",
    );
    const metricsB = await concept["rankingMetrics"].findOne({ _id: placeB_id });
    assertEquals(
      metricsB?.qualityScore,
      5.0,
      "Effect: Quality score in DB should be updated to 5.0.",
    );
    console.log(`  ✓ Place B quality score calculated and updated.`);

    // Test Case 3: Calculate score for Place C (0 visits, ensuring Math.max(visits, 1) in formula)
    console.log(
      `\n[TEST] Calculate quality score for Place C (ID: ${placeC_id}) with 0 visits`,
    );
    console.log(`  Input: { placeId: ${placeC_id} }`);
    const scoreC_res = await concept.calculateQualityScore({ placeId: placeC_id });
    console.log("  Output:", scoreC_res);
    assertEquals(
      isError(scoreC_res),
      false,
      "Expected score calculation for Place C to succeed.",
    );
    assertEquals(
      (scoreC_res as { score: number }).score,
      10.0,
      "Effect: Score for Place C should be 10.0 (10/1).",
    );
    const metricsC = await concept["rankingMetrics"].findOne({ _id: placeC_id });
    assertEquals(
      metricsC?.qualityScore,
      10.0,
      "Effect: Quality score in DB should be updated to 10.0.",
    );
    console.log(`  ✓ Place C quality score calculated correctly with 0 visits.`);

    // Test Case 4: Reject calculation for a non-existent place (violates requires)
    console.log(
      "\n[TEST] Reject quality score calculation for a non-existent place (violates requires)",
    );
    const nonExistentPlace_id = freshID() as Place;
    console.log(`  Input: { placeId: ${nonExistentPlace_id} }`);
    const resultNonExistent = await concept.calculateQualityScore({
      placeId: nonExistentPlace_id,
    });
    console.log("  Output:", resultNonExistent);
    assertEquals(
      isError(resultNonExistent),
      true,
      "Expected error for non-existent place.",
    );
    assertEquals(
      (resultNonExistent as { error: string }).error,
      `No metrics found for placeId: ${nonExistentPlace_id}.`,
      "Error message should indicate no metrics found.",
    );
    console.log(`  ✓ Correctly rejected non-existent place`);

    // Test Case 5: Reject calculation if metrics are incomplete/malformed (violates implicit requires)
    const malformedPlace_id = freshID() as Place;
    await concept["rankingMetrics"].insertOne({
      _id: malformedPlace_id,
      engagementRatio: "not_a_number" as any, // Malformed data for testing
      visitorVolume: 50,
      qualityScore: 0,
      lastUpdated: new Date(),
    });
    console.log(
      `\n[TEST] Reject quality score calculation for malformed metrics (ID: ${malformedPlace_id})`,
    );
    console.log(`  Input: { placeId: ${malformedPlace_id} }`);
    const resultMalformed = await concept.calculateQualityScore({
      placeId: malformedPlace_id,
    });
    console.log("  Output:", resultMalformed);
    assertEquals(
      isError(resultMalformed),
      true,
      "Expected error for incomplete/malformed metrics.",
    );
    assertEquals(
      (resultMalformed as { error: string }).error,
      `Engagement metrics (engagementRatio, visitorVolume) are incomplete for placeId: ${malformedPlace_id}.`,
      "Error message should indicate incomplete metrics.",
    );
    console.log(`  ✓ Correctly rejected malformed metrics`);

    console.log("\n✅ All calculateQualityScore requirements and effects verified.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: setPreferences stores and updates user preferences and enforces requirements", async () => {
  console.log("\n=== Testing setPreferences Action ===");
  const [db, client] = await testDb();
  const concept = new QualityRankingConcept(db);

  try {
    const user1_id = freshID() as User;
    const user2_id = freshID() as User;

    // Test Case 1: Successfully set preferences for a new user
    console.log("\n[TEST] Set preferences for a new user (User1)");
    console.log(
      `  Input: { userId: ${user1_id}, prefersEmergent: true, radius: 50 }`,
    );
    const result1 = await concept.setPreferences({
      userId: user1_id,
      prefersEmergent: true,
      radius: 50,
    });
    console.log("  Output:", result1);
    assertEquals(
      isError(result1),
      false,
      "Expected setting preferences to succeed.",
    );
    const prefs1 = await concept["rankingPreferences"].findOne({ _id: user1_id });
    assertEquals(
      prefs1?.prefersEmergent,
      true,
      "Effect: prefersEmergent should be true.",
    );
    assertEquals(prefs1?.radius, 50, "Effect: Radius should be 50.");
    console.log(`  ✓ User1 preferences set: prefersEmergent=true, radius=50`);

    // Test Case 2: Successfully update preferences for an existing user (User1)
    console.log("\n[TEST] Update preferences for an existing user (User1)");
    console.log(
      `  Input: { userId: ${user1_id}, prefersEmergent: false, radius: 150 }`,
    );
    const result2 = await concept.setPreferences({
      userId: user1_id,
      prefersEmergent: false,
      radius: 150,
    });
    console.log("  Output:", result2);
    assertEquals(
      isError(result2),
      false,
      "Expected updating preferences to succeed.",
    );
    const prefs2 = await concept["rankingPreferences"].findOne({ _id: user1_id });
    assertEquals(
      prefs2?.prefersEmergent,
      false,
      "Effect: prefersEmergent should be updated to false.",
    );
    assertEquals(
      prefs2?.radius,
      150,
      "Effect: Radius should be updated to 150.",
    );
    console.log(
      `  ✓ User1 preferences updated: prefersEmergent=false, radius=150`,
    );

    // Test Case 3: Reject setting preferences with zero radius (violates requires)
    console.log("\n[TEST] Reject setting preferences with zero radius (violates requires)");
    console.log(
      `  Input: { userId: ${user2_id}, prefersEmergent: true, radius: 0 }`,
    );
    const resultZeroRadius = await concept.setPreferences({
      userId: user2_id,
      prefersEmergent: true,
      radius: 0,
    });
    console.log("  Output:", resultZeroRadius);
    assertEquals(
      isError(resultZeroRadius),
      true,
      "Expected error for zero radius.",
    );
    assertEquals(
      (resultZeroRadius as { error: string }).error,
      "Radius must be greater than 0.",
      "Error message should indicate radius must be positive.",
    );
    const nonExistentPrefs = await concept["rankingPreferences"].findOne({
      _id: user2_id,
    });
    assertEquals(
      nonExistentPrefs,
      null,
      "Effect: No preferences should be created for invalid radius.",
    );
    console.log(`  ✓ Correctly rejected zero radius`);

    // Test Case 4: Reject setting preferences with negative radius (violates requires)
    console.log(
      "\n[TEST] Reject setting preferences with negative radius (violates requires)",
    );
    console.log(
      `  Input: { userId: ${user2_id}, prefersEmergent: true, radius: -10 }`,
    );
    const resultNegRadius = await concept.setPreferences({
      userId: user2_id,
      prefersEmergent: true,
      radius: -10,
    });
    console.log("  Output:", resultNegRadius);
    assertEquals(
      isError(resultNegRadius),
      true,
      "Expected error for negative radius.",
    );
    assertEquals(
      (resultNegRadius as { error: string }).error,
      "Radius must be greater than 0.",
      "Error message should indicate radius must be positive.",
    );
    console.log(`  ✓ Correctly rejected negative radius`);

    console.log("\n✅ All setPreferences requirements and effects verified.");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getRecommendedPlaces retrieves and ranks places according to user preferences", async () => {
  console.log("\n=== Testing _getRecommendedPlaces Query ===");
  const [db, client] = await testDb();
  const concept = new QualityRankingConcept(db);

  try {
    // Setup: Define multiple places with varying metrics to test ranking logic
    const placeX_id = freshID() as Place; // High visits, high engagement, score 1.0 (Volume 100)
    const placeY_id = freshID() as Place; // Low visits, high engagement, score 2.0 (Volume 5, hidden gem)
    const placeZ_id = freshID() as Place; // Medium visits, low engagement, score 0.25 (Volume 20)
    const placeW_id = freshID() as Place; // Medium visits, medium engagement, score 1.0 (Volume 50, tied score with X)

    console.log(`\n[SETUP] Updating metrics and calculating scores for test places:`);
    // Place X
    await concept.updateMetrics({ placeId: placeX_id, visits: 100, engagement: 100 });
    await concept.calculateQualityScore({ placeId: placeX_id }); // Score 1.0, Volume 100
    console.log(`  ✓ Place X (ID: ${placeX_id}) - Score: 1.0, Volume: 100`);

    // Place Y
    await concept.updateMetrics({ placeId: placeY_id, visits: 5, engagement: 10 });
    await concept.calculateQualityScore({ placeId: placeY_id }); // Score 2.0, Volume 5
    console.log(`  ✓ Place Y (ID: ${placeY_id}) - Score: 2.0, Volume: 5`);

    // Place Z
    await concept.updateMetrics({ placeId: placeZ_id, visits: 20, engagement: 5 });
    await concept.calculateQualityScore({ placeId: placeZ_id }); // Score 0.25, Volume 20
    console.log(`  ✓ Place Z (ID: ${placeZ_id}) - Score: 0.25, Volume: 20`);

    // Place W
    await concept.updateMetrics({ placeId: placeW_id, visits: 50, engagement: 50 });
    await concept.calculateQualityScore({ placeId: placeW_id }); // Score 1.0, Volume 50
    console.log(`  ✓ Place W (ID: ${placeW_id}) - Score: 1.0, Volume: 50`);
    console.log(`  ✓ All test places metrics and scores initialized.`);

    // Test Case 1: Recommendations for a user who does NOT prefer emergent places (ranked by quality score desc)
    const userStandard_id = freshID() as User;
    await concept.setPreferences({
      userId: userStandard_id,
      prefersEmergent: false,
      radius: 100,
    });
    console.log(
      `\n[TEST] Get recommendations for User Standard (ID: ${userStandard_id}, prefersEmergent: false)`,
    );
    console.log(
      "  NOTE: centerLat, centerLng, and radius are currently ignored for geo-filtering by this concept.",
    );
    const standardRecs_res = await concept._getRecommendedPlaces({
      userId: userStandard_id,
      centerLat: 0,
      centerLng: 0,
    });
    console.log("  Output:", standardRecs_res);
    assertEquals(
      isError(standardRecs_res),
      false,
      "Expected standard recommendations query to succeed.",
    );
    const standardRecs = (standardRecs_res as Array<{ place: Place }>).map(
      (r) => r.place,
    );
    // Expected order: Y (2.0), then {W (1.0), X (1.0)}, then Z (0.25).
    // The concept's sort for !prefersEmergent prioritizes qualityScore desc.
    // For ties in quality score (Place W and X both have 1.0), the order is not explicitly defined by secondary sort in the concept.
    // Assuming a stable sort or implicit order, we test for the presence and relative ordering of non-tied elements.
    assertEquals(
      standardRecs.length,
      4,
      "Effect: Should return 4 recommended places.",
    );
    assertEquals(
      standardRecs[0],
      placeY_id,
      "Effect: Highest quality score place should be first (Place Y).",
    ); // Score 2.0
    assertEquals(
      standardRecs[3],
      placeZ_id,
      "Effect: Lowest quality score place should be last (Place Z).",
    ); // Score 0.25
    // Verify that X and W are in the middle, in any order.
    const middleRecsStandard = standardRecs.slice(1, 3);
    assertEquals(
      middleRecsStandard.includes(placeX_id) &&
        middleRecsStandard.includes(placeW_id),
      true,
      "Effect: Middle recommendations should include Place X and Place W.",
    );
    console.log(
      `  ✓ Standard user recommendations match expected quality score ranking (Y, {X,W}, Z).`,
    );

    // Test Case 2: Recommendations for a user who DOES prefer emergent places (ranked by low visitor volume, then quality score desc)
    const userEmergent_id = freshID() as User;
    await concept.setPreferences({
      userId: userEmergent_id,
      prefersEmergent: true,
      radius: 100,
    });
    console.log(
      `\n[TEST] Get recommendations for User Emergent (ID: ${userEmergent_id}, prefersEmergent: true)`,
    );
    console.log(
      "  NOTE: centerLat, centerLng, and radius are currently ignored for geo-filtering by this concept.",
    );
    const emergentRecs_res = await concept._getRecommendedPlaces({
      userId: userEmergent_id,
      centerLat: 0,
      centerLng: 0,
    });
    console.log("  Output:", emergentRecs_res);
    assertEquals(
      isError(emergentRecs_res),
      false,
      "Expected emergent recommendations query to succeed.",
    );
    const emergentRecs = (emergentRecs_res as Array<{ place: Place }>).map(
      (r) => r.place,
    );
    // Expected order for emergent user (by visitorVolume ascending, then qualityScore descending for ties):
    // Place Y (vol 5, score 2.0)
    // Place Z (vol 20, score 0.25)
    // Place W (vol 50, score 1.0)
    // Place X (vol 100, score 1.0)
    assertEquals(
      emergentRecs,
      [placeY_id, placeZ_id, placeW_id, placeX_id],
      "Effect: Emergent user recommendations should be ranked by visitor volume ascending, then quality score descending.",
    );
    console.log(
      `  ✓ Emergent user recommendations correct: ${JSON.stringify(emergentRecs)}`,
    );

    // Test Case 3: Reject recommendations for a non-existent user (violates requires)
    console.log(
      "\n[TEST] Reject recommendations for a non-existent user (violates requires)",
    );
    const nonExistentUser_id = freshID() as User;
    console.log(
      `  Input: { userId: ${nonExistentUser_id}, centerLat: 0, centerLng: 0 }`,
    );
    const resultNonExistentUser = await concept._getRecommendedPlaces({
      userId: nonExistentUser_id,
      centerLat: 0,
      centerLng: 0,
    });
    console.log("  Output:", resultNonExistentUser);
    assertEquals(
      isError(resultNonExistentUser),
      true,
      "Expected error for non-existent user preferences.",
    );
    assertEquals(
      (resultNonExistentUser as { error: string }).error,
      `No ranking preferences found for userId: ${nonExistentUser_id}.`,
      "Error message should indicate no preferences found.",
    );
    console.log(`  ✓ Correctly rejected non-existent user`);

    console.log("\n✅ All _getRecommendedPlaces query behaviors verified.");
  } finally {
    await client.close();
  }
});
```
