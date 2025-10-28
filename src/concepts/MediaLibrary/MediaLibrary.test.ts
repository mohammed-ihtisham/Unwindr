import { assertEquals, assertExists } from "jsr:@std/assert";
import { freshID, testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import MediaLibraryConcept from "./MediaLibraryConcept.ts";

// Helper for checking if a result is an error
const isError = (result: unknown): result is { error: string } =>
  !!result && typeof result === "object" && "error" in result;

/**
 * Principle Test for MediaLibraryConcept.
 *
 * Principle: only manages media data, not engagement or analytics
 *
 * This test demonstrates the core functionality of storing and retrieving media items,
 * aligning with the principle that the concept focuses solely on media data management.
 * It will:
 * 1. Seed some provider-sourced media for a place.
 * 2. Add a user-contributed media item to the same place.
 * 3. Retrieve all media for that place, verifying content and order.
 */
Deno.test("Principle: MediaLibrary only manages media data", async () => {
  console.log("\n=== Testing Principle Fulfillment for MediaLibrary ===");
  const [db, client] = await testDb();
  const mediaLibrary = new MediaLibraryConcept(db);

  try {
    const placeAId = freshID() as ID;
    const userAId = freshID() as ID;
    const providerUrls = [
      "https://example.com/provider_img1.jpg",
      "https://example.com/provider_img2.jpg",
    ];
    const userImageUrl = "https://example.com/user_img1.jpg";

    console.log(`\n[SETUP] Initializing with Place ID: ${placeAId}`);
    console.log(`  and User ID: ${userAId}`);

    // 1. Seed provider-sourced media
    console.log("\n[ACTION] seedMedia - Inserting provider images for Place A");
    console.log(`  Input: { placeId: ${placeAId}, urls: ${providerUrls} }`);
    const seedResult = await mediaLibrary.seedMedia({
      placeId: placeAId,
      urls: providerUrls,
    });
    console.log("  Output:", seedResult);
    assertEquals(isError(seedResult), false, "Seeding should succeed.");
    assertEquals(
      (seedResult as { count: number }).count,
      2,
      "Should insert 2 media items.",
    );
    console.log(`  ✓ Successfully seeded 2 media items.`);

    // 2. Add user-contributed media
    console.log("\n[ACTION] addMedia - Adding user image for Place A");
    console.log(
      `  Input: { userId: ${userAId}, placeId: ${placeAId}, imageUrl: "${userImageUrl}" }`,
    );
    const addResult = await mediaLibrary.addMedia({
      userId: userAId,
      placeId: placeAId,
      imageUrl: userImageUrl,
    });
    console.log("  Output:", addResult);
    assertEquals(isError(addResult), false, "Adding media should succeed.");
    assertExists(
      (addResult as { mediaId: ID }).mediaId,
      "Media ID should be returned.",
    );
    const userMediaId = (addResult as { mediaId: ID }).mediaId;
    console.log(`  ✓ User media added with ID: ${userMediaId}`);

    // 3. Retrieve all media for Place A and verify
    console.log("\n[QUERY] _getMediaByPlace - Retrieving media for Place A");
    console.log(`  Input: { placeId: ${placeAId} }`);
    const retrievedMedia = await mediaLibrary._getMediaByPlace({
      placeId: placeAId,
    });
    console.log("  Output:", retrievedMedia);
    assertEquals(isError(retrievedMedia), false, "Retrieval should succeed.");
    if (isError(retrievedMedia)) return; // Type guard for subsequent assertions

    assertEquals(
      retrievedMedia.length,
      3,
      "Should retrieve all 3 media items.",
    );
    console.log(`  ✓ Retrieved ${retrievedMedia.length} media items.`);

    // Verify ordering (most recent first)
    // The user-added media should be the most recent.
    assertEquals(
      retrievedMedia[0].mediaIds,
      userMediaId,
      "Most recent media should be the user-contributed one.",
    );
    console.log(
      `  ✓ Verified ordering: User-contributed media is the most recent.`,
    );

    // Verify presence of provider images (order among them is not guaranteed without more info)
    const retrievedIds = retrievedMedia.map((item) => item.mediaIds);
    // Find one of the provider URLs that was returned, to confirm they are present.
    const firstProviderItem = await mediaLibrary.mediaItems.findOne({
      placeId: placeAId,
      source: "provider",
      imageUrl: providerUrls[0],
    });
    assertExists(firstProviderItem, "First provider item should be in DB.");
    assertEquals(
      retrievedIds.includes(firstProviderItem._id),
      true,
      "Provider-sourced media should be present.",
    );
    console.log(
      `  ✓ Verified provider-sourced media items are present.`,
    );

    console.log(
      "\n✅ Principle demonstrated: MediaLibrary successfully manages media data (storage and retrieval).",
    );
  } finally {
    await client.close();
  }
});

/**
 * Test Suite for the `seedMedia` action.
 *
 * Covers:
 * - Successful insertion of provider-sourced media.
 * - Handling of empty URLs array.
 * - Handling of missing place ID.
 */
Deno.test("Action: seedMedia successfully inserts provider media and enforces requirements", async () => {
  console.log("\n=== Testing seedMedia Action ===");
  const [db, client] = await testDb();
  const mediaLibrary = new MediaLibraryConcept(db);

  try {
    const placeId1 = freshID() as ID;
    const urls1 = [
      "https://example.com/provider_photo1.jpg",
      "https://example.com/provider_photo2.jpg",
    ];

    // [TEST] Successful insertion
    console.log(
      "\n[TEST CASE] Successful insertion of provider-sourced media",
    );
    console.log(`  Input: { placeId: ${placeId1}, urls: ${urls1} }`);
    const successResult = await mediaLibrary.seedMedia({
      placeId: placeId1,
      urls: urls1,
    });
    console.log("  Output:", successResult);
    assertEquals(isError(successResult), false, "Should not return an error.");
    assertEquals(
      (successResult as { count: number }).count,
      2,
      "Should insert 2 items.",
    );
    console.log(
      `  ✓ Successfully inserted 2 media items for place ${placeId1}.`,
    );

    // [VERIFY] Check state for inserted items
    const count = await mediaLibrary.mediaItems.countDocuments({
      placeId: placeId1,
      source: "provider",
    });
    assertEquals(count, 2, "Database should contain 2 provider media items.");
    const firstItem = await mediaLibrary.mediaItems.findOne({
      placeId: placeId1,
      imageUrl: urls1[0],
    });
    assertExists(firstItem, "First seeded item should exist in DB.");
    assertEquals(firstItem?.source, "provider", "Source should be 'provider'.");
    assertEquals(firstItem?.contributorId, null, "Contributor should be null.");
    console.log(`  ✓ State verified: items present and correctly attributed.`);

    // [TEST CASE] Reject with empty URLs array
    console.log("\n[TEST CASE] Rejecting seeding with empty URLs array");
    const emptyUrlsResult = await mediaLibrary.seedMedia({
      placeId: freshID() as ID,
      urls: [],
    });
    console.log("  Output:", emptyUrlsResult);
    assertEquals(isError(emptyUrlsResult), true, "Should return an error.");
    assertEquals(
      (emptyUrlsResult as { error: string }).error,
      "URLs set cannot be empty.",
      "Error message should indicate empty URLs.",
    );
    console.log(`  ✓ Correctly rejected empty URLs array.`);

    // [TEST CASE] Reject with missing placeId
    console.log("\n[TEST CASE] Rejecting seeding with missing placeId");
    // @ts-ignore: Intentionally testing missing required argument
    const missingPlaceIdResult = await mediaLibrary.seedMedia({ urls: urls1 });
    console.log("  Output:", missingPlaceIdResult);
    assertEquals(
      isError(missingPlaceIdResult),
      true,
      "Should return an error.",
    );
    assertEquals(
      (missingPlaceIdResult as { error: string }).error,
      "placeId must be provided.",
      "Error message should indicate missing placeId.",
    );
    console.log(`  ✓ Correctly rejected missing placeId.`);

    console.log("\n✅ All seedMedia requirements and effects verified.");
  } finally {
    await client.close();
  }
});

/**
 * Test Suite for the `addMedia` action.
 *
 * Covers:
 * - Successful addition of a user-contributed media item.
 * - Handling of empty image URL.
 * - Handling of missing user ID.
 * - Handling of missing place ID.
 */
Deno.test("Action: addMedia successfully adds user media and enforces requirements", async () => {
  console.log("\n=== Testing addMedia Action ===");
  const [db, client] = await testDb();
  const mediaLibrary = new MediaLibraryConcept(db);

  try {
    const userBId = freshID() as ID;
    const placeId2 = freshID() as ID;
    const userImageUrl2 = "https://example.com/user_upload.jpg";

    // [TEST] Successful addition
    console.log("\n[TEST CASE] Successful addition of user-contributed media");
    console.log(
      `  Input: { userId: ${userBId}, placeId: ${placeId2}, imageUrl: "${userImageUrl2}" }`,
    );
    const successResult = await mediaLibrary.addMedia({
      userId: userBId,
      placeId: placeId2,
      imageUrl: userImageUrl2,
    });
    console.log("  Output:", successResult);
    assertEquals(isError(successResult), false, "Should not return an error.");
    assertExists(
      (successResult as { mediaId: ID }).mediaId,
      "Returned mediaId should exist.",
    );
    const newMediaId = (successResult as { mediaId: ID }).mediaId;
    console.log(
      `  ✓ Successfully added user media with ID: ${newMediaId}.`,
    );

    // [VERIFY] Check state for inserted item
    const insertedItem = await mediaLibrary.mediaItems.findOne({
      _id: newMediaId,
    });
    assertExists(insertedItem, "Inserted item should exist in DB.");
    assertEquals(insertedItem?.placeId, placeId2, "Place ID should match.");
    assertEquals(
      insertedItem?.contributorId,
      userBId,
      "Contributor ID should match.",
    );
    assertEquals(
      insertedItem?.imageUrl,
      userImageUrl2,
      "Image URL should match.",
    );
    assertEquals(insertedItem?.source, "user", "Source should be 'user'.");
    assertExists(insertedItem?.createdAt, "createdAt should be set.");
    console.log(`  ✓ State verified: item present and correctly attributed.`);

    // [TEST CASE] Reject with empty imageUrl
    console.log("\n[TEST CASE] Rejecting adding media with empty imageUrl");
    const emptyImageUrlResult = await mediaLibrary.addMedia({
      userId: userBId,
      placeId: placeId2,
      imageUrl: "",
    });
    console.log("  Output:", emptyImageUrlResult);
    assertEquals(isError(emptyImageUrlResult), true, "Should return an error.");
    assertEquals(
      (emptyImageUrlResult as { error: string }).error,
      "imageUrl cannot be empty.",
      "Error message should indicate empty imageUrl.",
    );
    console.log(`  ✓ Correctly rejected empty imageUrl.`);

    // [TEST CASE] Reject with missing userId
    console.log("\n[TEST CASE] Rejecting adding media with missing userId");
    // @ts-ignore: Intentionally testing missing required argument
    const missingUserIdResult = await mediaLibrary.addMedia({
      placeId: placeId2,
      imageUrl: "https://example.com/missinguser.jpg",
    });
    console.log("  Output:", missingUserIdResult);
    assertEquals(isError(missingUserIdResult), true, "Should return an error.");
    assertEquals(
      (missingUserIdResult as { error: string }).error,
      "userId must be provided.",
      "Error message should indicate missing userId.",
    );
    console.log(`  ✓ Correctly rejected missing userId.`);

    // [TEST CASE] Reject with missing placeId
    console.log("\n[TEST CASE] Rejecting adding media with missing placeId");
    // @ts-ignore: Intentionally testing missing required argument
    const missingPlaceIdResult = await mediaLibrary.addMedia({
      userId: userBId,
      imageUrl: "https://example.com/missingplace.jpg",
    });
    console.log("  Output:", missingPlaceIdResult);
    assertEquals(
      isError(missingPlaceIdResult),
      true,
      "Should return an error.",
    );
    assertEquals(
      (missingPlaceIdResult as { error: string }).error,
      "placeId must be provided.",
      "Error message should indicate missing placeId.",
    );
    console.log(`  ✓ Correctly rejected missing placeId.`);

    console.log("\n✅ All addMedia requirements and effects verified.");
  } finally {
    await client.close();
  }
});

/**
 * Test Suite for the `deleteMedia` action.
 *
 * Covers:
 * - Successful deletion of user-contributed media by the contributor.
 * - Rejection when trying to delete provider-sourced media.
 * - Rejection when userId doesn't match the contributorId.
 * - Rejection when mediaId doesn't exist.
 * - Handling of missing user ID.
 * - Handling of missing media ID.
 */
Deno.test("Action: deleteMedia successfully deletes user media and enforces requirements", async () => {
  console.log("\n=== Testing deleteMedia Action ===");
  const [db, client] = await testDb();
  const mediaLibrary = new MediaLibraryConcept(db);

  try {
    const userEId = freshID() as ID;
    const userFId = freshID() as ID; // Different user for unauthorized deletion test
    const placeEId = freshID() as ID;

    // [SETUP] Add user-contributed media
    console.log("\n[SETUP] Adding user-contributed media for deletion tests");
    const addResult = await mediaLibrary.addMedia({
      userId: userEId,
      placeId: placeEId,
      imageUrl: "https://example.com/user_deletable.jpg",
    });
    const userMediaId = (addResult as { mediaId: ID }).mediaId;
    console.log(`  ✓ Added user media with ID: ${userMediaId}`);

    // [SETUP] Add provider-sourced media
    console.log("\n[SETUP] Adding provider-sourced media");
    await mediaLibrary.seedMedia({
      placeId: placeEId,
      urls: ["https://example.com/provider_nodelete.jpg"],
    });
    const providerItem = await mediaLibrary.mediaItems.findOne({
      placeId: placeEId,
      source: "provider",
    });
    const providerMediaId = providerItem!._id;
    console.log(`  ✓ Added provider media with ID: ${providerMediaId}`);

    // [TEST CASE] Successful deletion of user-contributed media
    console.log(
      "\n[TEST CASE] Successful deletion of user-contributed media by owner",
    );
    console.log(
      `  Input: { userId: ${userEId}, mediaId: ${userMediaId} }`,
    );
    const deleteResult = await mediaLibrary.deleteMedia({
      userId: userEId,
      mediaId: userMediaId,
    });
    console.log("  Output:", deleteResult);
    assertEquals(isError(deleteResult), false, "Should not return an error.");
    assertEquals(
      (deleteResult as { success: boolean }).success,
      true,
      "Deletion should succeed.",
    );
    console.log(`  ✓ Successfully deleted user media.`);

    // [VERIFY] Check state - media should no longer exist
    const deletedItem = await mediaLibrary.mediaItems.findOne({
      _id: userMediaId,
    });
    assertEquals(deletedItem, null, "Deleted media should not exist in DB.");
    console.log(`  ✓ State verified: media item removed from database.`);

    // [TEST CASE] Reject deletion of provider-sourced media
    console.log("\n[TEST CASE] Rejecting deletion of provider-sourced media");
    console.log(
      `  Input: { userId: ${userEId}, mediaId: ${providerMediaId} }`,
    );
    const providerDeleteResult = await mediaLibrary.deleteMedia({
      userId: userEId,
      mediaId: providerMediaId,
    });
    console.log("  Output:", providerDeleteResult);
    assertEquals(
      isError(providerDeleteResult),
      false,
      "Should not return an error.",
    );
    assertEquals(
      (providerDeleteResult as { success: boolean }).success,
      false,
      "Deletion should fail (return false).",
    );
    console.log(`  ✓ Correctly rejected deletion of provider-sourced media.`);

    // [VERIFY] Provider media still exists
    const providerStillExists = await mediaLibrary.mediaItems.findOne({
      _id: providerMediaId,
    });
    assertExists(
      providerStillExists,
      "Provider media should still exist in DB.",
    );
    console.log(`  ✓ State verified: provider media still exists.`);

    // [SETUP] Add another user media for unauthorized deletion test
    const addResult2 = await mediaLibrary.addMedia({
      userId: userEId,
      placeId: placeEId,
      imageUrl: "https://example.com/user_protected.jpg",
    });
    const protectedMediaId = (addResult2 as { mediaId: ID }).mediaId;
    console.log(
      `\n[SETUP] Added protected user media with ID: ${protectedMediaId}`,
    );

    // [TEST CASE] Reject deletion when userId doesn't match contributorId
    console.log(
      "\n[TEST CASE] Rejecting deletion when userId doesn't match contributor",
    );
    console.log(
      `  Input: { userId: ${userFId}, mediaId: ${protectedMediaId} }`,
    );
    const unauthorizedDeleteResult = await mediaLibrary.deleteMedia({
      userId: userFId,
      mediaId: protectedMediaId,
    });
    console.log("  Output:", unauthorizedDeleteResult);
    assertEquals(
      isError(unauthorizedDeleteResult),
      false,
      "Should not return an error.",
    );
    assertEquals(
      (unauthorizedDeleteResult as { success: boolean }).success,
      false,
      "Deletion should fail (return false).",
    );
    console.log(`  ✓ Correctly rejected unauthorized deletion.`);

    // [VERIFY] Protected media still exists
    const protectedStillExists = await mediaLibrary.mediaItems.findOne({
      _id: protectedMediaId,
    });
    assertExists(protectedStillExists, "Protected media should still exist.");
    console.log(`  ✓ State verified: protected media still exists.`);

    // [TEST CASE] Reject deletion with non-existent mediaId
    console.log("\n[TEST CASE] Rejecting deletion with non-existent mediaId");
    const fakeMediaId = freshID() as ID;
    console.log(`  Input: { userId: ${userEId}, mediaId: ${fakeMediaId} }`);
    const nonExistentResult = await mediaLibrary.deleteMedia({
      userId: userEId,
      mediaId: fakeMediaId,
    });
    console.log("  Output:", nonExistentResult);
    assertEquals(
      isError(nonExistentResult),
      false,
      "Should not return an error.",
    );
    assertEquals(
      (nonExistentResult as { success: boolean }).success,
      false,
      "Deletion should fail (return false).",
    );
    console.log(`  ✓ Correctly rejected deletion of non-existent media.`);

    // [TEST CASE] Reject with missing userId
    console.log("\n[TEST CASE] Rejecting deletion with missing userId");
    // @ts-ignore: Intentionally testing missing required argument
    const missingUserIdResult = await mediaLibrary.deleteMedia({
      mediaId: protectedMediaId,
    });
    console.log("  Output:", missingUserIdResult);
    assertEquals(isError(missingUserIdResult), true, "Should return an error.");
    assertEquals(
      (missingUserIdResult as { error: string }).error,
      "User ID cannot be empty",
      "Error message should indicate missing userId.",
    );
    console.log(`  ✓ Correctly rejected missing userId.`);

    // [TEST CASE] Reject with missing mediaId
    console.log("\n[TEST CASE] Rejecting deletion with missing mediaId");
    // @ts-ignore: Intentionally testing missing required argument
    const missingMediaIdResult = await mediaLibrary.deleteMedia({
      userId: userEId,
    });
    console.log("  Output:", missingMediaIdResult);
    assertEquals(
      isError(missingMediaIdResult),
      true,
      "Should return an error.",
    );
    assertEquals(
      (missingMediaIdResult as { error: string }).error,
      "Media ID cannot be empty",
      "Error message should indicate missing mediaId.",
    );
    console.log(`  ✓ Correctly rejected missing mediaId.`);

    console.log("\n✅ All deleteMedia requirements and effects verified.");
  } finally {
    await client.close();
  }
});

/**
 * Test Suite for the `_getMediaByPlace` query.
 *
 * Covers:
 * - Successful retrieval of media items for an existing place, ordered by `createdAt` desc.
 * - Retrieval of an empty set for a place with no media.
 * - Handling of missing place ID.
 */
Deno.test("Query: _getMediaByPlace retrieves correct media items and enforces requirements", async () => {
  console.log("\n=== Testing _getMediaByPlace Query ===");
  const [db, client] = await testDb();
  const mediaLibrary = new MediaLibraryConcept(db);

  try {
    const placeCId = freshID() as ID;
    const placeDId = freshID() as ID; // For testing a place with no media
    const userCId = freshID() as ID;

    // [SETUP] Add multiple media items to placeCId with different creation times
    console.log("\n[SETUP] Adding multiple media items for Place C");

    // Oldest item (seeded)
    await mediaLibrary.seedMedia({
      placeId: placeCId,
      urls: ["https://example.com/old_provider_img.jpg"],
    });
    await mediaLibrary.mediaItems.updateOne(
      {
        placeId: placeCId,
        imageUrl: "https://example.com/old_provider_img.jpg",
      },
      { $set: { createdAt: new Date("2023-01-01T10:00:00Z") } },
    );
    console.log(`  ✓ Added oldest provider item.`);

    // Middle item (user-added)
    const midUserResult = await mediaLibrary.addMedia({
      userId: userCId,
      placeId: placeCId,
      imageUrl: "https://example.com/mid_user_img.jpg",
    });
    await mediaLibrary.mediaItems.updateOne(
      { _id: (midUserResult as { mediaId: ID }).mediaId },
      { $set: { createdAt: new Date("2023-01-01T11:00:00Z") } },
    );
    console.log(`  ✓ Added middle user item.`);

    // Newest item (seeded)
    await mediaLibrary.seedMedia({
      placeId: placeCId,
      urls: ["https://example.com/new_provider_img.jpg"],
    });
    await mediaLibrary.mediaItems.updateOne(
      {
        placeId: placeCId,
        imageUrl: "https://example.com/new_provider_img.jpg",
      },
      { $set: { createdAt: new Date("2023-01-01T12:00:00Z") } },
    );
    console.log(`  ✓ Added newest provider item.`);

    // [TEST CASE] Successful retrieval and correct ordering
    console.log(
      "\n[TEST CASE] Retrieving media for Place C, expecting correct order",
    );
    console.log(`  Input: { placeId: ${placeCId} }`);
    const retrievedMedia = await mediaLibrary._getMediaByPlace({
      placeId: placeCId,
    });
    console.log("  Output:", retrievedMedia);
    assertEquals(isError(retrievedMedia), false, "Query should succeed.");
    if (isError(retrievedMedia)) return; // Type guard

    assertEquals(
      retrievedMedia.length,
      3,
      "Should retrieve 3 media items.",
    );
    console.log(`  ✓ Retrieved ${retrievedMedia.length} media items.`);

    // Fetch the actual documents to verify creation dates for ordering
    const allItems = await mediaLibrary.mediaItems
      .find({ placeId: placeCId })
      .sort({ createdAt: -1 }) // Ordered as expected by the query
      .toArray();

    assertEquals(
      retrievedMedia[0].mediaIds,
      allItems[0]._id,
      "First item should be the newest.",
    );
    assertEquals(
      retrievedMedia[1].mediaIds,
      allItems[1]._id,
      "Second item should be the middle one.",
    );
    assertEquals(
      retrievedMedia[2].mediaIds,
      allItems[2]._id,
      "Third item should be the oldest.",
    );
    console.log(
      `  ✓ Verified media items are ordered by createdAt descending.`,
    );

    // [TEST CASE] Retrieve for a place with no media
    console.log("\n[TEST CASE] Retrieving media for a place with no media");
    console.log(`  Input: { placeId: ${placeDId} }`);
    const emptyResult = await mediaLibrary._getMediaByPlace({
      placeId: placeDId,
    });
    console.log("  Output:", emptyResult);
    assertEquals(isError(emptyResult), false, "Query should succeed.");
    if (isError(emptyResult)) return;
    assertEquals(emptyResult.length, 0, "Should return an empty array.");
    console.log(
      `  ✓ Correctly returned an empty array for a place with no media.`,
    );

    // [TEST CASE] Reject with missing placeId
    console.log("\n[TEST CASE] Rejecting query with missing placeId");
    // @ts-ignore: Intentionally testing missing required argument
    const missingPlaceIdResult = await mediaLibrary._getMediaByPlace({});
    console.log("  Output:", missingPlaceIdResult);
    assertEquals(
      isError(missingPlaceIdResult),
      true,
      "Should return an error.",
    );
    assertEquals(
      (missingPlaceIdResult as { error: string }).error,
      "placeId must be provided.",
      "Error message should indicate missing placeId.",
    );
    console.log(`  ✓ Correctly rejected missing placeId.`);

    console.log("\n✅ All _getMediaByPlace requirements and effects verified.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: getPreviewImagesForPlaces returns preview images for multiple places", async () => {
  console.log("\n=== Testing getPreviewImagesForPlaces Action ===");
  const [db, client] = await testDb();
  const mediaLibrary = new MediaLibraryConcept(db);

  try {
    const placeAId = freshID() as ID;
    const placeBId = freshID() as ID;
    const placeCId = freshID() as ID;
    const placeDId = freshID() as ID; // Place with no media
    const userAId = freshID() as ID;

    // Setup: Add media for places A, B, C
    console.log("\n[SETUP] Adding media for testing");

    // Place A: Has provider media
    await mediaLibrary.seedMedia({
      placeId: placeAId,
      urls: [
        "https://example.com/a1.jpg",
        "https://example.com/a2.jpg",
        "https://example.com/a3.jpg",
      ],
    });
    console.log(`  ✓ Added 3 media items for place A`);

    // Place B: Has user media
    await mediaLibrary.addMedia({
      userId: userAId,
      placeId: placeBId,
      imageUrl: "https://example.com/b1.jpg",
    });
    await mediaLibrary.addMedia({
      userId: userAId,
      placeId: placeBId,
      imageUrl: "https://example.com/b2.jpg",
    });
    console.log(`  ✓ Added 2 media items for place B`);

    // Place C: Has one media item
    await mediaLibrary.addMedia({
      userId: userAId,
      placeId: placeCId,
      imageUrl: "https://example.com/c1.jpg",
    });
    console.log(`  ✓ Added 1 media item for place C`);
    console.log(`  ✓ Place D has no media`);

    // Should retrieve preview images for multiple places
    console.log("\n[TEST] Retrieve preview images for multiple places");
    console.log(
      `  Input: { placeIds: [${placeAId}, ${placeBId}, ${placeCId}, ${placeDId}] }`,
    );
    const result = await mediaLibrary.getPreviewImagesForPlaces({
      placeIds: [placeAId, placeBId, placeCId, placeDId],
    });
    console.log("  Output:", result);
    assertEquals(isError(result), false, "Query should succeed.");
    if (isError(result)) return;

    assertExists(Array.isArray(result), "Result should be an array.");
    assertEquals(result.length, 4, "Should return previews for all 4 places.");

    // Verify preview image for place A (should be first provider image)
    const placeAPreview = result.find((p) => p.placeId === placeAId);
    assertExists(placeAPreview, "Place A should have a preview.");
    assertExists(
      placeAPreview!.previewImage,
      "Place A should have a preview image.",
    );
    assertEquals(
      placeAPreview!.previewImage,
      "https://example.com/a1.jpg",
      "Place A preview should be the first image.",
    );
    console.log("  ✓ Place A has correct preview image");

    // Verify preview image for place B (should be first user image)
    const placeBPreview = result.find((p) => p.placeId === placeBId);
    assertExists(placeBPreview, "Place B should have a preview.");
    assertExists(
      placeBPreview!.previewImage,
      "Place B should have a preview image.",
    );
    assertEquals(
      placeBPreview!.previewImage,
      "https://example.com/b2.jpg",
      "Place B preview should be the most recent image.",
    );
    console.log("  ✓ Place B has correct preview image");

    // Verify preview image for place C
    const placeCPreview = result.find((p) => p.placeId === placeCId);
    assertExists(placeCPreview, "Place C should have a preview.");
    assertEquals(
      placeCPreview!.previewImage,
      "https://example.com/c1.jpg",
      "Place C preview should match.",
    );
    console.log("  ✓ Place C has correct preview image");

    // Verify no preview for place D (has no media)
    const placeDPreview = result.find((p) => p.placeId === placeDId);
    assertExists(placeDPreview, "Place D should be in the result.");
    assertEquals(
      placeDPreview!.previewImage,
      null,
      "Place D should have no preview image.",
    );
    console.log("  ✓ Place D correctly has no preview image");

    // Should handle empty array
    console.log("\n[TEST] Handle empty placeIds array");
    console.log("  Input: { placeIds: [] }");
    const emptyResult = await mediaLibrary.getPreviewImagesForPlaces({
      placeIds: [],
    });
    console.log("  Output:", emptyResult);
    assertEquals(isError(emptyResult), false, "Query should succeed.");
    if (isError(emptyResult)) return;
    assertEquals(emptyResult.length, 0, "Should return empty array.");
    console.log("  ✓ Correctly returned empty array");

    // Should fail with invalid input (not an array)
    console.log("\n[TEST] Reject non-array input");
    // @ts-ignore: Intentionally testing invalid input
    const invalidResult = await mediaLibrary.getPreviewImagesForPlaces({
      placeIds: placeAId, // Single ID instead of array
    });
    console.log("  Output:", invalidResult);
    assertEquals(isError(invalidResult), true, "Should return error.");
    assertEquals(
      (invalidResult as { error: string }).error,
      "placeIds must be provided as an array.",
      "Error message should indicate invalid input.",
    );
    console.log("  ✓ Correctly rejected non-array input");

    console.log("\n✅ All getPreviewImagesForPlaces requirements verified");
  } finally {
    await client.close();
  }
});
