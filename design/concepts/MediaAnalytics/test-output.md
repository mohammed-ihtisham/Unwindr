(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:media-analytics
Task test:media-analytics deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaAnalytics/MediaAnalyticsConcept.test.ts
Check file:///Users/mohammedihtisham/Desktop/Unwindr/src/concepts/MediaAnalytics/MediaAnalyticsConcept.test.ts
running 4 tests from ./src/concepts/MediaAnalytics/MediaAnalyticsConcept.test.ts
Principle: Each interaction adds weight to engagement score; scores are queryable ...
------- output -------

=== Testing Principle Fulfillment for MediaAnalytics ===

[SETUP] Users: 0199f3e9-ad62-75ed-98e9-cdff031cd6e9, 0199f3e9-ad62-7a85-a04a-752c178d5b82
[SETUP] Media Items: 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf, 0199f3e9-ad62-7368-a3e8-32d23e827d4a

[QUERY] _getEngagement for 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf (initial)
  Output: [ { score: 0 } ]
  ✓ Initial score for 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf is 0

[ACTION] recordInteraction: 0199f3e9-ad62-75ed-98e9-cdff031cd6e9 'view' 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf
  Output: {}
  ✓ Recorded 'view' interaction

[QUERY] _getEngagement for 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf after 'view'
  Output: [ { score: 1 } ]
  ✓ Engagement for 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf updated to 1

[ACTION] recordInteraction: 0199f3e9-ad62-75ed-98e9-cdff031cd6e9 'tap' 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf
  Output: {}
  ✓ Recorded 'tap' interaction

[QUERY] _getEngagement for 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf after 'tap'
  Output: [ { score: 3 } ]
  ✓ Engagement for 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf updated to 3

[ACTION] recordInteraction: 0199f3e9-ad62-7a85-a04a-752c178d5b82 'like' 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf
  Output: {}
  ✓ Recorded 'like' interaction

[QUERY] _getEngagement for 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf after 'like'
  Output: [ { score: 8 } ]
  ✓ Final engagement for 0199f3e9-ad62-72ce-b2af-9c0e15ddafcf is 8

[QUERY] _getEngagement for 0199f3e9-ad62-7368-a3e8-32d23e827d4a (checking isolation)
  Output: [ { score: 0 } ]
  ✓ Engagement for 0199f3e9-ad62-7368-a3e8-32d23e827d4a correctly remains 0

✅ Principle demonstrated: Interactions add to engagement score, and scores are queryable and isolated.
----- output end -----
Principle: Each interaction adds weight to engagement score; scores are queryable ... ok (808ms)
Action: recordInteraction successfully logs interactions and updates engagement scores ...
------- output -------

=== Testing recordInteraction Action ===

[TEST] Record 'view' interaction for item1
  Input: { userId: 0199f3e9-b013-7886-b1bd-b9520bb404dc, mediaItemId: 0199f3e9-b013-7374-8607-36b1d0d74b3b, interactionType: "view" }
  Output: {}
  ✓ Interaction logged for item1
  ✓ Engagement score for item1 updated to 1

[TEST] Record multiple interactions for item2
  ✓ Multiple interactions recorded for item2
  ✓ Engagement score for item2 updated to 17

[TEST] Reject invalid interaction type
  Input: { userId: 0199f3e9-b013-7886-b1bd-b9520bb404dc, mediaItemId: 0199f3e9-b013-7374-8607-36b1d0d74b3b, interactionType: "invalid" }
  Output: { error: "Invalid interaction type: invalid" }
  ✓ Correctly rejected invalid interaction type
  ✓ Engagement score for item1 remained unchanged after invalid attempt

✅ All recordInteraction requirements verified
----- output end -----
Action: recordInteraction successfully logs interactions and updates engagement scores ... ok (668ms)
Query: _getEngagement accurately retrieves engagement scores ...
------- output -------

=== Testing _getEngagement Query ===

[SETUP] Record interactions for mediaItemA
  ✓ mediaItemA set up with score 6
  ✓ mediaItemC created with initial score 0

[TEST] _getEngagement for existing item with score > 0
  Input: { mediaItemId: 0199f3e9-b338-7180-a125-55cc90bf97eb }
  Output: [ { score: 6 } ]
  ✓ Retrieved correct score for mediaItemA

[TEST] _getEngagement for non-existent item (no interactions)
  Input: { mediaItemId: 0199f3e9-b338-7958-8230-3a2189fd0e98 }
  Output: [ { score: 0 } ]
  ✓ Retrieved 0 score for non-existent item

[TEST] _getEngagement for existing item with score 0
  Input: { mediaItemId: 0199f3e9-b338-744e-a8bd-338c19377343 }
  Output: [ { score: 0 } ]
  ✓ Retrieved 0 score for itemC

[TEST] _getEngagement with invalid mediaItemId (empty string)
  Input: { mediaItemId: "" }
  Output: { error: "mediaItemId must be provided" }
  ✓ Correctly rejected empty mediaItemId

✅ All _getEngagement requirements verified
----- output end -----
Query: _getEngagement accurately retrieves engagement scores ... ok (748ms)
Action: recomputeScoresForPlace recalculates engagement scores correctly ...
------- output -------

=== Testing recomputeScoresForPlace Action ===

[SETUP] Record initial interactions
  ✓ Initial scores: mediaItemX = 1, mediaItemY = 7

[TEST] Recompute scores for mediaItemX and mediaItemY
  Input: { placeId: 0199f3e9-b5d0-7f77-ae31-e464d0cf5f33, mediaItemIds: [0199f3e9-b5d0-705c-b099-5bde7a2c8dde, 0199f3e9-b5d0-73fb-9e05-93d98cbff2a0] }
  Output: {}
  ✓ Recomputed scores match original (no new interactions): mediaItemX = 1, mediaItemY = 7

[TEST] Recompute score for mediaItemZ (no interactions)
  Input: { placeId: 0199f3e9-b5d0-7f77-ae31-e464d0cf5f33, mediaItemIds: [0199f3e9-b5d0-7c1f-8c76-0b9fabc78efc] }
  Output: {}
  ✓ Recomputed score for mediaItemZ is 0

[SETUP] Add new interactions for mediaItemX
  ✓ Added 'share' interaction to mediaItemX

[TEST] Recompute scores for mediaItemX after new interaction
  Input: { placeId: 0199f3e9-b5d0-7f77-ae31-e464d0cf5f33, mediaItemIds: [0199f3e9-b5d0-705c-b099-5bde7a2c8dde] }
  Output: {}
  ✓ mediaItemX score correctly recomputed to 11

[TEST] recomputeScoresForPlace with empty mediaItemIds array
  Input: { placeId: 0199f3e9-b5d0-7f77-ae31-e464d0cf5f33, mediaItemIds: [] }
  Output: {}
  ✓ Empty mediaItemIds array handled as no-op

[TEST] recomputeScoresForPlace with invalid placeId (empty string)
  Input: { placeId: "" }
  Output: { error: "placeId must be provided" }
  ✓ Correctly rejected empty placeId

✅ All recomputeScoresForPlace requirements verified
----- output end -----
Action: recomputeScoresForPlace recalculates engagement scores correctly ... ok (904ms)

ok | 4 passed | 0 failed (3s)