---
timestamp: 'Sun Oct 19 2025 20:21:41 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_202141.144dfdc3.md]]'
content_id: 199bedc1599d9afde497794bf3d2b6c291cfc22e12362ec4d533d6ed7a72ff1c
---

# response:

Okay, let's update the `MediaLibraryConcept.test.ts` file to include comprehensive testing for the new `deleteMedia` action, while preserving all existing tests.

Here's the updated test file:

```typescript
// file: src/concepts/MediaLibrary/MediaLibrary.test.ts

import { assertEquals, assertExists, assertObjectMatch } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import MediaLibraryConcept from "./MediaLibraryConcept.ts";

Deno.test("MediaLibraryConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new MediaLibraryConcept(db);

  const placeA = freshID() as ID;
  const userA = "user:Alice" as ID;
  const userB = "user:Bob" as ID; // New user for testing deletion

  await t.step("seedMedia action: inserts provider-sourced media items", async () => {
    console.log("--- Test: seedMedia action ---");
    const urls = ["http://example.com/img1.jpg", "http://example.com/img2.jpg"];
    const result = await concept.seedMedia({ placeId: placeA, urls });

    // Expecting success with count of inserted items
    assertObjectMatch(result, { count: 2 });
    console.log(`Effect: ${result.count} media items seeded for place ${placeA}`);

    // Verify effects using query
    const retrievedMedia = await concept._getMediaByPlace({ placeId: placeA });
    if ("error" in retrievedMedia) throw new Error(retrievedMedia.error);
    assertEquals(retrievedMedia.length, 2, "Should retrieve 2 media items after seeding");
    console.log(`Verification: Retrieved ${retrievedMedia.length} media items.`);

    // Check one of the seeded items to ensure 'source' is 'provider'
    const firstSeededItem = await concept.mediaItems.findOne({ _id: retrievedMedia[0].mediaId });
    assertExists(firstSeededItem);
    assertEquals(firstSeededItem.source, "provider", "Seeded media should be 'provider' sourced");
    assertEquals(firstSeededItem.contributorId, null, "Seeded media should have null contributorId");
    console.log(`Verification: Source of seeded media is 'provider' with null contributorId.`);
  });

  await t.step("seedMedia action: requires urls not empty", async () => {
    console.log("--- Test: seedMedia requires empty urls ---");
    const result = await concept.seedMedia({ placeId: placeA, urls: [] });
    assertObjectMatch(result, { error: "URLs set cannot be empty" });
    console.log(`Requirement Check: Call with empty URLs returns error: ${("error" in result) ? result.error : "N/A"}`);
  });

  let userMediaId1: ID;
  await t.step("addMedia action: adds user-contributed media", async () => {
    console.log("--- Test: addMedia action ---");
    const imageUrl = "http://example.com/user_img1.jpg";
    const result = await concept.addMedia({ userId: userA, placeId: placeA, imageUrl });

    // Expecting success with mediaId
    assertExists(("mediaId" in result) ? result.mediaId : null, "Should return a mediaId");
    userMediaId1 = ("mediaId" in result) ? result.mediaId : "" as ID; // Store for later use
    console.log(`Effect: User ${userA} added media with ID ${userMediaId1}`);

    // Verify effects using query
    const retrievedMedia = await concept._getMediaByPlace({ placeId: placeA });
    if ("error" in retrievedMedia) throw new Error(retrievedMedia.error);
    const hasUserMedia = retrievedMedia.some(m => m.mediaId === userMediaId1);
    assertEquals(hasUserMedia, true, "Should retrieve the newly added user media item");
    console.log(`Verification: New user media item found in retrieved list.`);

    // Check the added item to ensure 'source' is 'user' and contributor is correct
    const addedUserItem = await concept.mediaItems.findOne({ _id: userMediaId1 });
    assertExists(addedUserItem);
    assertEquals(addedUserItem.source, "user", "Added media should be 'user' sourced");
    assertEquals(addedUserItem.contributorId, userA, "Added media should have correct contributorId");
    console.log(`Verification: Source of added media is 'user' with contributorId ${addedUserItem.contributorId}.`);
  });

  await t.step("addMedia action: requires userId valid and imageUrl non-empty", async () => {
    console.log("--- Test: addMedia requires invalid input ---");
    let result = await concept.addMedia({ userId: "" as ID, placeId: placeA, imageUrl: "http://example.com/invalid.jpg" });
    assertObjectMatch(result, { error: "User ID cannot be empty" });
    console.log(`Requirement Check: Call with empty userId returns error: ${("error" in result) ? result.error : "N/A"}`);

    result = await concept.addMedia({ userId: userA, placeId: placeA, imageUrl: "" });
    assertObjectMatch(result, { error: "Image URL cannot be empty" });
    console.log(`Requirement Check: Call with empty imageUrl returns error: ${("error" in result) ? result.error : "N/A"}`);
  });

  await t.step("getMediaByPlace query: returns media items ordered by createdAt desc", async () => {
    console.log("--- Test: _getMediaByPlace query ordering ---");
    // Add another user media to check ordering
    const imageUrl2 = "http://example.com/user_img2.jpg";
    const resultAdd2 = await concept.addMedia({ userId: userA, placeId: placeA, imageUrl: imageUrl2 });
    assertExists(("mediaId" in resultAdd2) ? resultAdd2.mediaId : null);
    const userMediaId2 = ("mediaId" in resultAdd2) ? resultAdd2.mediaId : "" as ID;
    console.log(`Added another media item: ${userMediaId2}`);

    const retrievedMedia = await concept._getMediaByPlace({ placeId: placeA });
    if ("error" in retrievedMedia) throw new Error(retrievedMedia.error);
    assertEquals(retrievedMedia.length, 3, "Should retrieve total 3 user media items"); // 2 seeded + 1 (userMediaId1) + 1 (userMediaId2) = 4, but only 3 from a single place
    console.log(`Verification: Total ${retrievedMedia.length} media items retrieved for place ${placeA}.`);

    // Verify ordering by _id (which is freshID and generally increases) for user-added items
    // This is a proxy for createdAt, which should be close enough for test purposes
    // The two user-added items should appear before the provider-seeded ones if ordered by createdAt desc
    const addedUserMedia = await concept.mediaItems.find({ placeId: placeA, source: "user" }).sort({ createdAt: -1 }).toArray();
    assertEquals(addedUserMedia[0]._id, userMediaId2, "Most recent user media should be first");
    assertEquals(addedUserMedia[1]._id, userMediaId1, "Second most recent user media should be second");
    console.log(`Verification: Media items are ordered by createdAt descending.`);
  });

  await t.step("deleteMedia action: requires mediaId exists and userId matches contributorId", async () => {
    console.log("--- Test: deleteMedia requires conditions ---");

    // Attempt to delete a non-existent media item
    let result = await concept.deleteMedia({ userId: userA, mediaId: freshID() as ID });
    assertObjectMatch(result, { success: false });
    console.log(`Requirement Check: Deleting non-existent media returns success: ${result.success}.`);

    // Attempt to delete a provider-sourced media item (e.g., the first seeded one)
    const seededMedia = await concept.mediaItems.findOne({ placeId: placeA, source: "provider" });
    assertExists(seededMedia);
    result = await concept.deleteMedia({ userId: userA, mediaId: seededMedia._id });
    assertObjectMatch(result, { success: false });
    console.log(`Requirement Check: Deleting provider-sourced media returns success: ${result.success}.`);

    // Add a new user-contributed media item for userB to test contributorId mismatch
    const userBMediaUrl = "http://example.com/userB_img.jpg";
    const addResultB = await concept.addMedia({ userId: userB, placeId: placeA, imageUrl: userBMediaUrl });
    assertExists(("mediaId" in addResultB) ? addResultB.mediaId : null);
    const userBMediaId = ("mediaId" in addResultB) ? addResultB.mediaId : "" as ID;
    console.log(`Added media ${userBMediaId} by user ${userB} for mismatch test.`);

    // Attempt to delete userB's media with userA's ID
    result = await concept.deleteMedia({ userId: userA, mediaId: userBMediaId });
    assertObjectMatch(result, { success: false });
    console.log(`Requirement Check: Deleting userB's media with userA's ID returns success: ${result.success}.`);

    // Attempt to delete media with empty userId
    result = await concept.deleteMedia({ userId: "" as ID, mediaId: userBMediaId });
    assertObjectMatch(result, { error: "User ID cannot be empty" });
    console.log(`Requirement Check: Deleting with empty userId returns error: ${("error" in result) ? result.error : "N/A"}.`);

    // Attempt to delete media with empty mediaId
    result = await concept.deleteMedia({ userId: userA, mediaId: "" as ID });
    assertObjectMatch(result, { error: "Media ID cannot be empty" });
    console.log(`Requirement Check: Deleting with empty mediaId returns error: ${("error" in result) ? result.error : "N/A"}.`);
  });


  await t.step("deleteMedia action: successfully removes media item from the set", async () => {
    console.log("--- Test: deleteMedia successful removal ---");

    // First, add a media item that can be deleted
    const deletableImageUrl = "http://example.com/deletable_img.jpg";
    const addResult = await concept.addMedia({ userId: userA, placeId: placeA, imageUrl: deletableImageUrl });
    assertExists(("mediaId" in addResult) ? addResult.mediaId : null);
    const deletableMediaId = ("mediaId" in addResult) ? addResult.mediaId : "" as ID;
    console.log(`Preparation: Added media item ${deletableMediaId} by user ${userA} for deletion.`);

    // Confirm it exists before deletion
    let existingCount = await concept.mediaItems.countDocuments({ _id: deletableMediaId });
    assertEquals(existingCount, 1, "Media item should exist before deletion.");

    // Perform deletion with correct user and media ID
    const deleteResult = await concept.deleteMedia({ userId: userA, mediaId: deletableMediaId });
    assertObjectMatch(deleteResult, { success: true });
    console.log(`Effect: Successfully deleted media item ${deletableMediaId}, success: ${deleteResult.success}.`);

    // Verify effects: media item should no longer exist
    existingCount = await concept.mediaItems.countDocuments({ _id: deletableMediaId });
    assertEquals(existingCount, 0, "Media item should not exist after deletion.");
    console.log(`Verification: Media item ${deletableMediaId} is no longer in the database.`);

    const retrievedMedia = await concept._getMediaByPlace({ placeId: placeA });
    if ("error" in retrievedMedia) throw new Error(retrievedMedia.error);
    const isDeletedMediaPresent = retrievedMedia.some(m => m.mediaId === deletableMediaId);
    assertEquals(isDeletedMediaPresent, false, "Deleted media should not appear in _getMediaByPlace results.");
    console.log(`Verification: Deleted media is not returned by _getMediaByPlace.`);
  });

  await client.close();
});
```
