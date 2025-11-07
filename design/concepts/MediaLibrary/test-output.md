(base) mohammedihtisham@Ihtishams-MacBook-Pro Unwindr % deno task test:media-library
Task test:media-library deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaLibrary/MediaLibrary.test.ts
Check file:///Users/mohammedihtisham/Desktop/Unwindr/src/concepts/MediaLibrary/MediaLibrary.test.ts
running 6 tests from ./src/concepts/MediaLibrary/MediaLibrary.test.ts
Operational Principle: Seed and retrieve media for visual discovery ...
------- output -------

=== Operational Principle: MediaLibrary Usage ===

[ACTION] seedMedia - Seeding media for multiple places
  ✓ Seeded media for 3 places

[QUERY] getPreviewImagesForPlaces - Getting previews for map
  ✓ Retrieved preview images for map display

[QUERY] getMediaItemsByPlace - Getting full media for place detail
  ✓ Retrieved full media items with all fields

[QUERY] _getMediaByPlace - Getting media IDs for references
  ✓ Retrieved media IDs for cross-concept references

✅ Operational principle demonstrated: Complete media workflow
----- output end -----
Operational Principle: Seed and retrieve media for visual discovery ... ok (633ms)
Scenario 1: Handling places with no media ...
------- output -------

=== Scenario 1: Places with No Media ===

[QUERY] _getMediaByPlace - Querying place with no media

[QUERY] getMediaItemsByPlace - Querying place with no media

[QUERY] getPreviewImagesForPlaces - Querying places with no media

✅ Scenario 1: All queries handle empty results gracefully
----- output end -----
Scenario 1: Handling places with no media ... ok (506ms)
Scenario 2: Seeding the same place multiple times ...
------- output -------

=== Scenario 2: Repeated Seeding ===

[ACTION] seedMedia - First batch

[ACTION] seedMedia - Second batch (same place)

[QUERY] getMediaItemsByPlace - Verifying accumulated media

✅ Scenario 2: Repeated seeding accumulates media correctly
----- output end -----
Scenario 2: Seeding the same place multiple times ... ok (535ms)
Scenario 3: Error handling for invalid inputs ...
------- output -------

=== Scenario 3: Error Cases ===

[ACTION] seedMedia - Testing error cases

[QUERY] _getMediaByPlace - Testing error cases

[QUERY] getMediaItemsByPlace - Testing error cases

[QUERY] getPreviewImagesForPlaces - Testing error cases

✅ Scenario 3: All error cases handled correctly
----- output end -----
Scenario 3: Error handling for invalid inputs ... ok (464ms)
Scenario 4: Different query types return appropriate data ...
------- output -------

=== Scenario 4: Query Type Comparison ===

[ACTION] seedMedia - Setting up test data

[QUERY] _getMediaByPlace - Getting media IDs only

[QUERY] getMediaItemsByPlace - Getting full media items

[QUERY] getPreviewImagesForPlaces - Getting preview for one place

✅ Scenario 4: All query types return appropriate data structures
----- output end -----
Scenario 4: Different query types return appropriate data ... ok (515ms)
Scenario 5: Media ordering by creation date ...
------- output -------

=== Scenario 5: Creation Date Ordering ===

[ACTION] seedMedia - Seeding media in batches

[QUERY] _getMediaByPlace - Verifying order

✅ Scenario 5: Media consistently ordered by creation date (newest first)
----- output end -----
Scenario 5: Media ordering by creation date ... ok (678ms)

ok | 6 passed | 0 failed (3s)

(base) mohammedihtisham@Ihtishams-MacBook-Pro Unwindr % 