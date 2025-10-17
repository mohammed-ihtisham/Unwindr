(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:media-library
Task test:media-library deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaLibrary/MediaLibrary.test.ts
Check file:///Users/mohammedihtisham/Desktop/Unwindr/src/concepts/MediaLibrary/MediaLibrary.test.ts
running 4 tests from ./src/concepts/MediaLibrary/MediaLibrary.test.ts
Principle: MediaLibrary only manages media data ...
------- output -------

=== Testing Principle Fulfillment for MediaLibrary ===

[SETUP] Initializing with Place ID: 0199f3d5-7a1d-74e4-a06e-b3bca4b30d1f
  and User ID: 0199f3d5-7a1d-7563-a254-6a6c6ff7c6a5

[ACTION] seedMedia - Inserting provider images for Place A
  Input: { placeId: 0199f3d5-7a1d-74e4-a06e-b3bca4b30d1f, urls: https://example.com/provider_img1.jpg,https://example.com/provider_img2.jpg }
  Output: { count: 2 }
  ✓ Successfully seeded 2 media items.

[ACTION] addMedia - Adding user image for Place A
  Input: { userId: 0199f3d5-7a1d-7563-a254-6a6c6ff7c6a5, placeId: 0199f3d5-7a1d-74e4-a06e-b3bca4b30d1f, imageUrl: "https://example.com/user_img1.jpg" }
  Output: { mediaId: "0199f3d5-7a41-7d6e-b229-403592b1d856" }
  ✓ User media added with ID: 0199f3d5-7a41-7d6e-b229-403592b1d856

[QUERY] _getMediaByPlace - Retrieving media for Place A
  Input: { placeId: 0199f3d5-7a1d-74e4-a06e-b3bca4b30d1f }
  Output: [
  { mediaIds: "0199f3d5-7a41-7d6e-b229-403592b1d856" },
  { mediaIds: "0199f3d5-7a1d-7b26-8102-d214fbaf02bd" },
  { mediaIds: "0199f3d5-7a1d-7bba-853a-e0a36bde9575" }
]
  ✓ Retrieved 3 media items.
  ✓ Verified ordering: User-contributed media is the most recent.
  ✓ Verified provider-sourced media items are present.

✅ Principle demonstrated: MediaLibrary successfully manages media data (storage and retrieval).
----- output end -----
Principle: MediaLibrary only manages media data ... ok (633ms)
Action: seedMedia successfully inserts provider media and enforces requirements ...
------- output -------

=== Testing seedMedia Action ===

[TEST CASE] Successful insertion of provider-sourced media
  Input: { placeId: 0199f3d5-7c3e-7d07-bbbf-3a0a1b56b4af, urls: https://example.com/provider_photo1.jpg,https://example.com/provider_photo2.jpg }
  Output: { count: 2 }
  ✓ Successfully inserted 2 media items for place 0199f3d5-7c3e-7d07-bbbf-3a0a1b56b4af.
  ✓ State verified: items present and correctly attributed.

[TEST CASE] Rejecting seeding with empty URLs array
  Output: { error: "URLs set cannot be empty." }
  ✓ Correctly rejected empty URLs array.

[TEST CASE] Rejecting seeding with missing placeId
  Output: { error: "placeId must be provided." }
  ✓ Correctly rejected missing placeId.

✅ All seedMedia requirements and effects verified.
----- output end -----
Action: seedMedia successfully inserts provider media and enforces requirements ... ok (528ms)
Action: addMedia successfully adds user media and enforces requirements ...
------- output -------

=== Testing addMedia Action ===

[TEST CASE] Successful addition of user-contributed media
  Input: { userId: 0199f3d5-7e78-7e2d-98f2-c045de64280c, placeId: 0199f3d5-7e78-7057-bee7-57caa0eb4871, imageUrl: "https://example.com/user_upload.jpg" }
  Output: { mediaId: "0199f3d5-7e78-7d46-b462-e9677e5847f1" }
  ✓ Successfully added user media with ID: 0199f3d5-7e78-7d46-b462-e9677e5847f1.
  ✓ State verified: item present and correctly attributed.

[TEST CASE] Rejecting adding media with empty imageUrl
  Output: { error: "imageUrl cannot be empty." }
  ✓ Correctly rejected empty imageUrl.

[TEST CASE] Rejecting adding media with missing userId
  Output: { error: "userId must be provided." }
  ✓ Correctly rejected missing userId.

[TEST CASE] Rejecting adding media with missing placeId
  Output: { error: "placeId must be provided." }
  ✓ Correctly rejected missing placeId.

✅ All addMedia requirements and effects verified.
----- output end -----
Action: addMedia successfully adds user media and enforces requirements ... ok (549ms)
Query: _getMediaByPlace retrieves correct media items and enforces requirements ...
------- output -------

=== Testing _getMediaByPlace Query ===

[SETUP] Adding multiple media items for Place C
  ✓ Added oldest provider item.
  ✓ Added middle user item.
  ✓ Added newest provider item.

[TEST CASE] Retrieving media for Place C, expecting correct order
  Input: { placeId: 0199f3d5-8094-71c4-8c54-ee9035a80b75 }
  Output: [
  { mediaIds: "0199f3d5-80ef-769d-8568-83767cbea81f" },
  { mediaIds: "0199f3d5-80c8-740a-928e-963fe07edc1e" },
  { mediaIds: "0199f3d5-8094-72f1-bddb-355ba4df7040" }
]
  ✓ Retrieved 3 media items.
  ✓ Verified media items are ordered by createdAt descending.

[TEST CASE] Retrieving media for a place with no media
  Input: { placeId: 0199f3d5-8094-7d46-9804-4914d81f7991 }
  Output: []
  ✓ Correctly returned an empty array for a place with no media.

[TEST CASE] Rejecting query with missing placeId
  Output: { error: "placeId must be provided." }
  ✓ Correctly rejected missing placeId.

✅ All _getMediaByPlace requirements and effects verified.
----- output end -----
Query: _getMediaByPlace retrieves correct media items and enforces requirements ... ok (671ms)

ok | 4 passed | 0 failed (2s)