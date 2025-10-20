(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:media-library
Task test:media-library deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/MediaLibrary/MediaLibrary.test.ts
running 5 tests from ./src/concepts/MediaLibrary/MediaLibrary.test.ts
Principle: MediaLibrary only manages media data ...
------- output -------

=== Testing Principle Fulfillment for MediaLibrary ===

[SETUP] Initializing with Place ID: 0199ff03-bbdf-78e0-bcaa-d501d3087178
  and User ID: 0199ff03-bbdf-747f-9584-bbced68011fa

[ACTION] seedMedia - Inserting provider images for Place A
  Input: { placeId: 0199ff03-bbdf-78e0-bcaa-d501d3087178, urls: https://example.com/provider_img1.jpg,https://example.com/provider_img2.jpg }
  Output: { count: 2 }
  ✓ Successfully seeded 2 media items.

[ACTION] addMedia - Adding user image for Place A
  Input: { userId: 0199ff03-bbdf-747f-9584-bbced68011fa, placeId: 0199ff03-bbdf-78e0-bcaa-d501d3087178, imageUrl: "https://example.com/user_img1.jpg" }
  Output: { mediaId: "0199ff03-bc03-793e-9989-b15faaf0e2ef" }
  ✓ User media added with ID: 0199ff03-bc03-793e-9989-b15faaf0e2ef

[QUERY] _getMediaByPlace - Retrieving media for Place A
  Input: { placeId: 0199ff03-bbdf-78e0-bcaa-d501d3087178 }
  Output: [
  { mediaIds: "0199ff03-bc03-793e-9989-b15faaf0e2ef" },
  { mediaIds: "0199ff03-bbdf-76c7-a34d-88e5665333c3" },
  { mediaIds: "0199ff03-bbdf-7c27-850b-ad8abd1d5737" }
]
  ✓ Retrieved 3 media items.
  ✓ Verified ordering: User-contributed media is the most recent.
  ✓ Verified provider-sourced media items are present.

✅ Principle demonstrated: MediaLibrary successfully manages media data (storage and retrieval).
----- output end -----
Principle: MediaLibrary only manages media data ... ok (613ms)
Action: seedMedia successfully inserts provider media and enforces requirements ...
------- output -------

=== Testing seedMedia Action ===

[TEST CASE] Successful insertion of provider-sourced media
  Input: { placeId: 0199ff03-bdb2-7773-b79c-0769db989bb7, urls: https://example.com/provider_photo1.jpg,https://example.com/provider_photo2.jpg }
  Output: { count: 2 }
  ✓ Successfully inserted 2 media items for place 0199ff03-bdb2-7773-b79c-0769db989bb7.
  ✓ State verified: items present and correctly attributed.

[TEST CASE] Rejecting seeding with empty URLs array
  Output: { error: "URLs set cannot be empty." }
  ✓ Correctly rejected empty URLs array.

[TEST CASE] Rejecting seeding with missing placeId
  Output: { error: "placeId must be provided." }
  ✓ Correctly rejected missing placeId.

✅ All seedMedia requirements and effects verified.
----- output end -----
Action: seedMedia successfully inserts provider media and enforces requirements ... ok (444ms)
Action: addMedia successfully adds user media and enforces requirements ...
------- output -------

=== Testing addMedia Action ===

[TEST CASE] Successful addition of user-contributed media
  Input: { userId: 0199ff03-c00e-7245-8759-d0d6c94ba4b8, placeId: 0199ff03-c00e-77eb-9394-7e8294765294, imageUrl: "https://example.com/user_upload.jpg" }
  Output: { mediaId: "0199ff03-c00e-7228-b57b-fee4c34d79d0" }
  ✓ Successfully added user media with ID: 0199ff03-c00e-7228-b57b-fee4c34d79d0.
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
Action: addMedia successfully adds user media and enforces requirements ... ok (584ms)
Action: deleteMedia successfully deletes user media and enforces requirements ...
------- output -------

=== Testing deleteMedia Action ===

[SETUP] Adding user-contributed media for deletion tests
  ✓ Added user media with ID: 0199ff03-c201-7d30-938e-12348f8d5a07

[SETUP] Adding provider-sourced media
  ✓ Added provider media with ID: 0199ff03-c220-7b13-ae12-d4b6d81cf467

[TEST CASE] Successful deletion of user-contributed media by owner
  Input: { userId: 0199ff03-c201-7965-9f44-47f724474049, mediaId: 0199ff03-c201-7d30-938e-12348f8d5a07 }
  Output: { success: true }
  ✓ Successfully deleted user media.
  ✓ State verified: media item removed from database.

[TEST CASE] Rejecting deletion of provider-sourced media
  Input: { userId: 0199ff03-c201-7965-9f44-47f724474049, mediaId: 0199ff03-c220-7b13-ae12-d4b6d81cf467 }
  Output: { success: false }
  ✓ Correctly rejected deletion of provider-sourced media.
  ✓ State verified: provider media still exists.

[SETUP] Added protected user media with ID: 0199ff03-c290-7b9c-a2e7-be327d5610ed

[TEST CASE] Rejecting deletion when userId doesn't match contributor
  Input: { userId: 0199ff03-c201-7d8b-97de-b9b170010d6f, mediaId: 0199ff03-c290-7b9c-a2e7-be327d5610ed }
  Output: { success: false }
  ✓ Correctly rejected unauthorized deletion.
  ✓ State verified: protected media still exists.

[TEST CASE] Rejecting deletion with non-existent mediaId
  Input: { userId: 0199ff03-c201-7965-9f44-47f724474049, mediaId: 0199ff03-c2be-70dc-adb8-9d01d3593155 }
  Output: { success: false }
  ✓ Correctly rejected deletion of non-existent media.

[TEST CASE] Rejecting deletion with missing userId
  Output: { error: "User ID cannot be empty" }
  ✓ Correctly rejected missing userId.

[TEST CASE] Rejecting deletion with missing mediaId
  Output: { error: "Media ID cannot be empty" }
  ✓ Correctly rejected missing mediaId.

✅ All deleteMedia requirements and effects verified.
----- output end -----
Action: deleteMedia successfully deletes user media and enforces requirements ... ok (656ms)
Query: _getMediaByPlace retrieves correct media items and enforces requirements ...
------- output -------

=== Testing _getMediaByPlace Query ===

[SETUP] Adding multiple media items for Place C
  ✓ Added oldest provider item.
  ✓ Added middle user item.
  ✓ Added newest provider item.

[TEST CASE] Retrieving media for Place C, expecting correct order
  Input: { placeId: 0199ff03-c4b9-7ae5-9280-822deace4a06 }
  Output: [
  { mediaIds: "0199ff03-c518-789e-a4da-4d8cf24f825a" },
  { mediaIds: "0199ff03-c4f3-7dd6-b4cc-89e467291874" },
  { mediaIds: "0199ff03-c4ba-7ca0-bece-72328e403ea7" }
]
  ✓ Retrieved 3 media items.
  ✓ Verified media items are ordered by createdAt descending.

[TEST CASE] Retrieving media for a place with no media
  Input: { placeId: 0199ff03-c4b9-77fd-a3b0-0adbdf256535 }
  Output: []
  ✓ Correctly returned an empty array for a place with no media.

[TEST CASE] Rejecting query with missing placeId
  Output: { error: "placeId must be provided." }
  ✓ Correctly rejected missing placeId.

✅ All _getMediaByPlace requirements and effects verified.
----- output end -----
Query: _getMediaByPlace retrieves correct media items and enforces requirements ... ok (672ms)

ok | 5 passed | 0 failed (2s)

(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % 