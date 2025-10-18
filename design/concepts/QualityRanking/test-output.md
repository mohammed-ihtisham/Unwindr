(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:quality-ranking
Task test:quality-ranking deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/QualityRanking/QualityRankingConcept.test.ts
running 5 tests from ./src/concepts/QualityRanking/QualityRankingConcept.test.ts
Principle: QualityRanking promotes well-loved places regardless of popularity, helping users discover authentic local favorites ...
------- output -------

=== Testing QualityRanking Principle Fulfillment: Discovering Hidden Gems ===

[SETUP] Registering places and updating initial metrics:
  Place A (Popular): ID 0199f4c0-42ea-7acc-80b7-5c3b62a2faf8
  Place B (Hidden Gem): ID 0199f4c0-42ea-7eea-919a-fa5020592b10
  Place C (Low Quality): ID 0199f4c0-42ea-797b-a5af-7ce0f435837e
  Place D (Medium): ID 0199f4c0-42ea-7c0d-90d7-627036414d04
  [ACTION] updateMetrics({ placeId: 0199f4c0-42ea-7acc-80b7-5c3b62a2faf8, visits: 500, engagement: 400 })
  [ACTION] updateMetrics({ placeId: 0199f4c0-42ea-7eea-919a-fa5020592b10, visits: 20, engagement: 100 })
  [ACTION] updateMetrics({ placeId: 0199f4c0-42ea-797b-a5af-7ce0f435837e, visits: 10, engagement: 5 })
  [ACTION] updateMetrics({ placeId: 0199f4c0-42ea-7c0d-90d7-627036414d04, visits: 100, engagement: 100 })
  ✓ Initial metrics updated for all places.

[ACTION] Calculating quality scores for all places:
  Place A Quality Score: 0.8 (Engagement: 400, Visits: 500)
  Place B Quality Score: 5 (Engagement: 100, Visits: 20)
  Place C Quality Score: 0.5 (Engagement: 5, Visits: 10)
  Place D Quality Score: 1 (Engagement: 100, Visits: 100)
  ✓ Quality scores computed and updated in state.

[SETUP] Setting ranking preferences for two users:
  [ACTION] setPreferences({ userId: 0199f4c0-43df-7589-b46d-aa2fece7fee8, prefersEmergent: false, radius: 100 })
  [ACTION] setPreferences({ userId: 0199f4c0-43df-7896-ac58-539f562cadbf, prefersEmergent: true, radius: 100 })
  ✓ User preferences set.

[QUERY] Getting recommendations for User Standard (prefersEmergent: false):
  NOTE: centerLat, centerLng, and radius are currently ignored for geo-filtering.
  Output (Recommended places IDs): 0199f4c0-42ea-7eea-919a-fa5020592b10,0199f4c0-42ea-7c0d-90d7-627036414d04,0199f4c0-42ea-7acc-80b7-5c3b62a2faf8,0199f4c0-42ea-797b-a5af-7ce0f435837e
  ✓ Standard user recommendations match: ["0199f4c0-42ea-7eea-919a-fa5020592b10","0199f4c0-42ea-7c0d-90d7-627036414d04","0199f4c0-42ea-7acc-80b7-5c3b62a2faf8","0199f4c0-42ea-797b-a5af-7ce0f435837e"]

[QUERY] Getting recommendations for User Emergent (prefersEmergent: true):
  NOTE: centerLat, centerLng, and radius are currently ignored for geo-filtering.
  Output (Recommended places IDs): 0199f4c0-42ea-797b-a5af-7ce0f435837e,0199f4c0-42ea-7eea-919a-fa5020592b10,0199f4c0-42ea-7c0d-90d7-627036414d04,0199f4c0-42ea-7acc-80b7-5c3b62a2faf8
  ✓ Emergent user recommendations match: ["0199f4c0-42ea-797b-a5af-7ce0f435837e","0199f4c0-42ea-7eea-919a-fa5020592b10","0199f4c0-42ea-7c0d-90d7-627036414d04","0199f4c0-42ea-7acc-80b7-5c3b62a2faf8"]

✅ Principle demonstrated: The concept surfaces lesser-known, high-engagement places by computing quality scores and adjusting recommendations based on user preferences (emergent vs. popular), fulfilling its purpose.
----- output end -----
Principle: QualityRanking promotes well-loved places regardless of popularity, helping users discover authentic local favorites ... ok (885ms)
Action: updateMetrics successfully updates metrics and enforces requirements ...
------- output -------

=== Testing updateMetrics Action ===

[TEST] Update metrics for a new place (Place1)
  Input: { placeId: 0199f4c0-4645-753f-be86-8788904383e0, visits: 10, engagement: 5 }
  Output: {}
  ✓ Place1 metrics created: visits=10, engagement=5, qualityScore=0

[TEST] Update metrics for an existing place (Place1) with new values
  Input: { placeId: 0199f4c0-4645-753f-be86-8788904383e0, visits: 20, engagement: 15 }
  Output: {}
  ✓ Place1 metrics updated: visits=20, engagement=15, qualityScore=0

[TEST] Update metrics with zero visits and engagement (Place2)
  Input: { placeId: 0199f4c0-4645-79f5-8d16-d02201a06c4e, visits: 0, engagement: 0 }
  Output: {}
  ✓ Place2 metrics created with zero values: visits=0, engagement=0

[TEST] Reject update with negative visits (violates requires)
  Input: { placeId: 0199f4c0-46ca-717f-98f5-c063a07cfb51, visits: -5, engagement: 10 }
  Output: { error: "Visits and engagement must be non-negative." }
  ✓ Correctly rejected negative visits

[TEST] Reject update with negative engagement (violates requires)
  Input: { placeId: 0199f4c0-46de-7ecb-9b37-0459afe48480, visits: 10, engagement: -2 }
  Output: { error: "Visits and engagement must be non-negative." }
  ✓ Correctly rejected negative engagement

✅ All updateMetrics requirements and effects verified.
----- output end -----
Action: updateMetrics successfully updates metrics and enforces requirements ... ok (670ms)
Action: calculateQualityScore computes and updates scores correctly ...
------- output -------

=== Testing calculateQualityScore Action ===

[SETUP] Update initial metrics for Place A, B, C
  ✓ Initial metrics updated.

[TEST] Calculate quality score for Place A (ID: 0199f4c0-4901-74cd-8a51-188fbc1fef92)
  Input: { placeId: 0199f4c0-4901-74cd-8a51-188fbc1fef92 }
  Output: { score: 0.8 }
  ✓ Place A quality score calculated and updated.

[TEST] Calculate quality score for Place B (ID: 0199f4c0-4901-75d0-b44d-edde5956eaa1)
  Input: { placeId: 0199f4c0-4901-75d0-b44d-edde5956eaa1 }
  Output: { score: 5 }
  ✓ Place B quality score calculated and updated.

[TEST] Calculate quality score for Place C (ID: 0199f4c0-4901-74db-9e7e-bbe3380dca4c) with 0 visits
  Input: { placeId: 0199f4c0-4901-74db-9e7e-bbe3380dca4c }
  Output: { score: 10 }
  ✓ Place C quality score calculated correctly with 0 visits.

[TEST] Reject quality score calculation for a non-existent place (violates requires)
  Input: { placeId: 0199f4c0-49de-7b09-8c53-7e1790e1936f }
  Output: {
  error: "No metrics found for placeId: 0199f4c0-49de-7b09-8c53-7e1790e1936f."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject quality score calculation for malformed metrics (ID: 0199f4c0-49ee-7372-b01d-a1bb2b32f078)
  Input: { placeId: 0199f4c0-49ee-7372-b01d-a1bb2b32f078 }
  Output: {
  error: "Engagement metrics (engagementRatio, visitorVolume) are incomplete for placeId: 0199f4c0-49ee-7372-b01d-a1bb2b32f078."
}
  ✓ Correctly rejected malformed metrics

✅ All calculateQualityScore requirements and effects verified.
----- output end -----
Action: calculateQualityScore computes and updates scores correctly ... ok (801ms)
Action: setPreferences stores and updates user preferences and enforces requirements ...
------- output -------

=== Testing setPreferences Action ===

[TEST] Set preferences for a new user (User1)
  Input: { userId: 0199f4c0-4ba9-7877-9d75-410318c5eb85, prefersEmergent: true, radius: 50 }
  Output: {}
  ✓ User1 preferences set: prefersEmergent=true, radius=50

[TEST] Update preferences for an existing user (User1)
  Input: { userId: 0199f4c0-4ba9-7877-9d75-410318c5eb85, prefersEmergent: false, radius: 150 }
  Output: {}
  ✓ User1 preferences updated: prefersEmergent=false, radius=150

[TEST] Reject setting preferences with zero radius (violates requires)
  Input: { userId: 0199f4c0-4ba9-7741-8da6-9d3580823d38, prefersEmergent: true, radius: 0 }
  Output: { error: "Radius must be greater than 0." }
  ✓ Correctly rejected zero radius

[TEST] Reject setting preferences with negative radius (violates requires)
  Input: { userId: 0199f4c0-4ba9-7741-8da6-9d3580823d38, prefersEmergent: true, radius: -10 }
  Output: { error: "Radius must be greater than 0." }
  ✓ Correctly rejected negative radius

✅ All setPreferences requirements and effects verified.
----- output end -----
Action: setPreferences stores and updates user preferences and enforces requirements ... ok (503ms)
Query: _getRecommendedPlaces retrieves and ranks places according to user preferences ...
------- output -------

=== Testing _getRecommendedPlaces Query ===

[SETUP] Updating metrics and calculating scores for test places:
  ✓ Place X (ID: 0199f4c0-4e0f-7623-897c-a3d33e5b4202) - Score: 1.0, Volume: 100
  ✓ Place Y (ID: 0199f4c0-4e0f-7135-a473-b088d1ef5e40) - Score: 2.0, Volume: 5
  ✓ Place Z (ID: 0199f4c0-4e0f-7b4e-9ea1-0e13fa81eeee) - Score: 0.25, Volume: 20
  ✓ Place W (ID: 0199f4c0-4e0f-7696-9a4e-051d4af4efa8) - Score: 1.0, Volume: 50
  ✓ All test places metrics and scores initialized.

[TEST] Get recommendations for User Standard (ID: 0199f4c0-4f0b-7f6b-acc2-7babefa44685, prefersEmergent: false)
  NOTE: centerLat, centerLng, and radius are currently ignored for geo-filtering by this concept.
  Output: [
  { place: "0199f4c0-4e0f-7135-a473-b088d1ef5e40" },
  { place: "0199f4c0-4e0f-7623-897c-a3d33e5b4202" },
  { place: "0199f4c0-4e0f-7696-9a4e-051d4af4efa8" },
  { place: "0199f4c0-4e0f-7b4e-9ea1-0e13fa81eeee" }
]
  ✓ Standard user recommendations match expected quality score ranking (Y, {X,W}, Z).

[TEST] Get recommendations for User Emergent (ID: 0199f4c0-4f50-7f58-83dc-11cbd4e4880f, prefersEmergent: true)
  NOTE: centerLat, centerLng, and radius are currently ignored for geo-filtering by this concept.
  Output: [
  { place: "0199f4c0-4e0f-7135-a473-b088d1ef5e40" },
  { place: "0199f4c0-4e0f-7b4e-9ea1-0e13fa81eeee" },
  { place: "0199f4c0-4e0f-7696-9a4e-051d4af4efa8" },
  { place: "0199f4c0-4e0f-7623-897c-a3d33e5b4202" }
]
  ✓ Emergent user recommendations correct: ["0199f4c0-4e0f-7135-a473-b088d1ef5e40","0199f4c0-4e0f-7b4e-9ea1-0e13fa81eeee","0199f4c0-4e0f-7696-9a4e-051d4af4efa8","0199f4c0-4e0f-7623-897c-a3d33e5b4202"]

[TEST] Reject recommendations for a non-existent user (violates requires)
  Input: { userId: 0199f4c0-4f84-7881-81db-6d320d423d87, centerLat: 0, centerLng: 0 }
  Output: {
  error: "No ranking preferences found for userId: 0199f4c0-4f84-7881-81db-6d320d423d87."
}
  ✓ Correctly rejected non-existent user

✅ All _getRecommendedPlaces query behaviors verified.
----- output end -----
Query: _getRecommendedPlaces retrieves and ranks places according to user preferences ... ok (906ms)

ok | 5 passed | 0 failed (3s)