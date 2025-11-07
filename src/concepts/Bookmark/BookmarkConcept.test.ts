import { assert, assertEquals } from "jsr:@std/assert";
import { freshID, testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import BookmarkConcept from "./BookmarkConcept.ts";

// Helper for checking if a result is an error
const isError = (result: unknown): result is { error: string } =>
  !!result && typeof result === "object" && "error" in result;

/**
 * Operational Principle Test
 *
 * Represents the common expected usage of Bookmark:
 * 1. User bookmarks multiple places
 * 2. User retrieves their bookmarked places
 * 3. User checks if specific places are bookmarked
 */
Deno.test("Operational Principle: Users bookmark places and retrieve them", async (t) => {
  console.log(
    "\n=== Operational Principle: Bookmark Usage ===",
  );
  const [db, client] = await testDb();
  const concept = new BookmarkConcept(db);

  try {
    const user1Id = freshID();
    const place1Id = freshID();
    const place2Id = freshID();
    const place3Id = freshID();

    await t.step("1. User bookmarks multiple places", async () => {
      console.log(`\n[ACTION] bookmarkPlace - User bookmarks Place1`);
      const bookmark1 = await concept.bookmarkPlace({
        userId: user1Id,
        placeId: place1Id,
      });
      console.log("  Output:", bookmark1);
      assertEquals(isError(bookmark1), false, "Bookmark should succeed");
      assert(
        (bookmark1 as { bookmarkId: ID }).bookmarkId,
        "Bookmark ID should be returned",
      );
      console.log("  ✓ Place1 bookmarked");

      console.log(`\n[ACTION] bookmarkPlace - User bookmarks Place2`);
      const bookmark2 = await concept.bookmarkPlace({
        userId: user1Id,
        placeId: place2Id,
      });
      console.log("  Output:", bookmark2);
      assertEquals(isError(bookmark2), false, "Bookmark should succeed");
      console.log("  ✓ Place2 bookmarked");

      console.log(`\n[ACTION] bookmarkPlace - User bookmarks Place3`);
      const bookmark3 = await concept.bookmarkPlace({
        userId: user1Id,
        placeId: place3Id,
      });
      console.log("  Output:", bookmark3);
      assertEquals(isError(bookmark3), false, "Bookmark should succeed");
      console.log("  ✓ Place3 bookmarked");
    });

    await t.step("2. User retrieves all bookmarked places", async () => {
      console.log(
        `\n[QUERY] getBookmarkedPlaces - Retrieving all bookmarked places`,
      );
      const placesResult = await concept.getBookmarkedPlaces({
        userId: user1Id,
      });
      console.log("  Output:", placesResult);
      assertEquals(isError(placesResult), false, "Retrieval should succeed");
      const placeIds = (placesResult as { placeIds: ID[] }).placeIds;
      assertEquals(placeIds.length, 3, "Should return 3 bookmarked places");
      assert(placeIds.includes(place1Id), "Should include Place1");
      assert(placeIds.includes(place2Id), "Should include Place2");
      assert(placeIds.includes(place3Id), "Should include Place3");
      console.log("  ✓ Retrieved all bookmarked places");
    });

    await t.step(
      "3. User checks if specific places are bookmarked",
      async () => {
        console.log(
          `\n[QUERY] isBookmarked - Checking if Place1 is bookmarked`,
        );
        const check1 = await concept.isBookmarked({
          userId: user1Id,
          placeId: place1Id,
        });
        console.log("  Output:", check1);
        assertEquals(isError(check1), false, "Check should succeed");
        assertEquals(
          (check1 as { isBookmarked: boolean }).isBookmarked,
          true,
          "Place1 should be bookmarked",
        );
        console.log("  ✓ Place1 is bookmarked");

        console.log(
          `\n[QUERY] isBookmarked - Checking if Place2 is bookmarked`,
        );
        const check2 = await concept.isBookmarked({
          userId: user1Id,
          placeId: place2Id,
        });
        console.log("  Output:", check2);
        assertEquals((check2 as { isBookmarked: boolean }).isBookmarked, true);
        console.log("  ✓ Place2 is bookmarked");
      },
    );

    await t.step("4. User retrieves bookmark IDs", async () => {
      console.log(`\n[QUERY] getUserBookmarks - Retrieving bookmark IDs`);
      const bookmarksResult = await concept.getUserBookmarks({
        userId: user1Id,
      });
      console.log("  Output:", bookmarksResult);
      assertEquals(isError(bookmarksResult), false, "Retrieval should succeed");
      const bookmarkIds =
        (bookmarksResult as { bookmarkIds: ID[] }).bookmarkIds;
      assertEquals(bookmarkIds.length, 3, "Should return 3 bookmark IDs");
      console.log("  ✓ Retrieved bookmark IDs");
    });

    console.log(
      "\n✅ Operational principle demonstrated: Complete bookmark workflow",
    );
  } finally {
    await client.close();
  }
});

/**
 * Interesting Scenario 1: Duplicate bookmark prevention
 *
 * Tests that attempting to bookmark the same place twice is rejected.
 * Verifies the error handling for duplicate bookmarks.
 */
Deno.test("Scenario 1: Duplicate bookmark prevention", async (t) => {
  console.log("\n=== Scenario 1: Duplicate Bookmark Prevention ===");
  const [db, client] = await testDb();
  const concept = new BookmarkConcept(db);

  try {
    const user1Id = freshID();
    const place1Id = freshID();

    await t.step("1. Bookmark a place successfully", async () => {
      console.log(`\n[ACTION] bookmarkPlace - First bookmark attempt`);
      const bookmark1 = await concept.bookmarkPlace({
        userId: user1Id,
        placeId: place1Id,
      });
      console.log("  Output:", bookmark1);
      assertEquals(isError(bookmark1), false, "First bookmark should succeed");
      console.log("  ✓ First bookmark succeeded");
    });

    await t.step("2. Attempt to bookmark the same place again", async () => {
      console.log(`\n[ACTION] bookmarkPlace - Duplicate bookmark attempt`);
      const bookmark2 = await concept.bookmarkPlace({
        userId: user1Id,
        placeId: place1Id,
      });
      console.log("  Output:", bookmark2);
      assertEquals(isError(bookmark2), true, "Duplicate bookmark should fail");
      assertEquals(
        (bookmark2 as { error: string }).error,
        "Bookmark already exists for this user and place.",
        "Error message should indicate duplicate",
      );
      console.log("  ✓ Duplicate bookmark rejected correctly");
    });

    await t.step("3. Verify only one bookmark exists", async () => {
      console.log(`\n[QUERY] getBookmarkedPlaces - Verifying single bookmark`);
      const placesResult = await concept.getBookmarkedPlaces({
        userId: user1Id,
      });
      const placeIds = (placesResult as { placeIds: ID[] }).placeIds;
      assertEquals(placeIds.length, 1, "Should have only one bookmark");
      assertEquals(placeIds[0], place1Id, "Should be the correct place");
      console.log("  ✓ Only one bookmark exists");
    });

    console.log("\n✅ Scenario 1: Duplicate bookmarks prevented correctly");
  } finally {
    await client.close();
  }
});

/**
 * Interesting Scenario 2: Unbookmarking workflow
 *
 * Tests the unbookmark action including:
 * - Successful unbookmarking
 * - Unbookmarking non-existent bookmarks
 * - Verifying state after unbookmarking
 */
Deno.test("Scenario 2: Unbookmarking workflow", async (t) => {
  console.log("\n=== Scenario 2: Unbookmarking Workflow ===");
  const [db, client] = await testDb();
  const concept = new BookmarkConcept(db);

  try {
    const user1Id = freshID();
    const place1Id = freshID();
    const place2Id = freshID();

    await t.step("1. Bookmark multiple places", async () => {
      console.log(`\n[ACTION] bookmarkPlace - Bookmarking Place1 and Place2`);
      await concept.bookmarkPlace({ userId: user1Id, placeId: place1Id });
      await concept.bookmarkPlace({ userId: user1Id, placeId: place2Id });
      console.log("  ✓ Both places bookmarked");
    });

    await t.step("2. Unbookmark one place", async () => {
      console.log(`\n[ACTION] unbookmarkPlace - Unbookmarking Place1`);
      const unbookmarkResult = await concept.unbookmarkPlace({
        userId: user1Id,
        placeId: place1Id,
      });
      console.log("  Output:", unbookmarkResult);
      assertEquals(
        (unbookmarkResult as { success: boolean }).success,
        true,
        "Unbookmark should succeed",
      );
      console.log("  ✓ Place1 unbookmarked successfully");
    });

    await t.step("3. Verify unbookmarked place is removed", async () => {
      console.log(`\n[QUERY] getBookmarkedPlaces - Verifying removal`);
      const placesResult = await concept.getBookmarkedPlaces({
        userId: user1Id,
      });
      const placeIds = (placesResult as { placeIds: ID[] }).placeIds;
      assertEquals(placeIds.length, 1, "Should have only one bookmark");
      assertEquals(placeIds[0], place2Id, "Should be Place2");
      console.log("  ✓ Place1 removed, Place2 remains");

      console.log(
        `\n[QUERY] isBookmarked - Verifying Place1 is not bookmarked`,
      );
      const check1 = await concept.isBookmarked({
        userId: user1Id,
        placeId: place1Id,
      });
      assertEquals((check1 as { isBookmarked: boolean }).isBookmarked, false);
      console.log("  ✓ Place1 correctly marked as not bookmarked");
    });

    await t.step("4. Attempt to unbookmark non-existent bookmark", async () => {
      console.log(
        `\n[ACTION] unbookmarkPlace - Unbookmarking non-existent bookmark`,
      );
      const unbookmarkResult = await concept.unbookmarkPlace({
        userId: user1Id,
        placeId: place1Id, // Already unbookmarked
      });
      console.log("  Output:", unbookmarkResult);
      assertEquals(
        (unbookmarkResult as { success: boolean }).success,
        false,
        "Unbookmarking non-existent should return false",
      );
      console.log("  ✓ Non-existent unbookmark handled correctly");
    });

    await t.step("5. Unbookmark remaining place", async () => {
      console.log(`\n[ACTION] unbookmarkPlace - Unbookmarking Place2`);
      const unbookmarkResult = await concept.unbookmarkPlace({
        userId: user1Id,
        placeId: place2Id,
      });
      assertEquals(
        (unbookmarkResult as { success: boolean }).success,
        true,
        "Unbookmark should succeed",
      );
      console.log("  ✓ Place2 unbookmarked");

      console.log(
        `\n[QUERY] getBookmarkedPlaces - Verifying all bookmarks removed`,
      );
      const placesResult = await concept.getBookmarkedPlaces({
        userId: user1Id,
      });
      const placeIds = (placesResult as { placeIds: ID[] }).placeIds;
      assertEquals(placeIds.length, 0, "Should have no bookmarks");
      console.log("  ✓ All bookmarks removed");
    });

    console.log("\n✅ Scenario 2: Unbookmarking workflow works correctly");
  } finally {
    await client.close();
  }
});

/**
 * Interesting Scenario 3: Multiple users bookmarking
 *
 * Tests user isolation - multiple users can bookmark the same or different places.
 * Verifies that bookmarks are user-specific.
 */
Deno.test("Scenario 3: Multiple users bookmarking", async (t) => {
  console.log("\n=== Scenario 3: Multiple Users Bookmarking ===");
  const [db, client] = await testDb();
  const concept = new BookmarkConcept(db);

  try {
    const user1Id = freshID();
    const user2Id = freshID();
    const sharedPlaceId = freshID();
    const user1OnlyPlaceId = freshID();
    const user2OnlyPlaceId = freshID();

    await t.step("1. User1 bookmarks places", async () => {
      console.log(
        `\n[ACTION] bookmarkPlace - User1 bookmarks shared place and own place`,
      );
      await concept.bookmarkPlace({ userId: user1Id, placeId: sharedPlaceId });
      await concept.bookmarkPlace({
        userId: user1Id,
        placeId: user1OnlyPlaceId,
      });
      console.log("  ✓ User1 bookmarked 2 places");
    });

    await t.step("2. User2 bookmarks places", async () => {
      console.log(
        `\n[ACTION] bookmarkPlace - User2 bookmarks shared place and own place`,
      );
      await concept.bookmarkPlace({ userId: user2Id, placeId: sharedPlaceId });
      await concept.bookmarkPlace({
        userId: user2Id,
        placeId: user2OnlyPlaceId,
      });
      console.log("  ✓ User2 bookmarked 2 places");
    });

    await t.step("3. Verify user isolation - User1's bookmarks", async () => {
      console.log(`\n[QUERY] getBookmarkedPlaces - User1's bookmarks`);
      const user1Places = await concept.getBookmarkedPlaces({
        userId: user1Id,
      });
      const placeIds1 = (user1Places as { placeIds: ID[] }).placeIds;
      assertEquals(placeIds1.length, 2, "User1 should have 2 bookmarks");
      assert(
        placeIds1.includes(sharedPlaceId),
        "User1 should have shared place",
      );
      assert(
        placeIds1.includes(user1OnlyPlaceId),
        "User1 should have own place",
      );
      assert(
        !placeIds1.includes(user2OnlyPlaceId),
        "User1 should not have User2's place",
      );
      console.log("  ✓ User1's bookmarks are isolated");
    });

    await t.step("4. Verify user isolation - User2's bookmarks", async () => {
      console.log(`\n[QUERY] getBookmarkedPlaces - User2's bookmarks`);
      const user2Places = await concept.getBookmarkedPlaces({
        userId: user2Id,
      });
      const placeIds2 = (user2Places as { placeIds: ID[] }).placeIds;
      assertEquals(placeIds2.length, 2, "User2 should have 2 bookmarks");
      assert(
        placeIds2.includes(sharedPlaceId),
        "User2 should have shared place",
      );
      assert(
        placeIds2.includes(user2OnlyPlaceId),
        "User2 should have own place",
      );
      assert(
        !placeIds2.includes(user1OnlyPlaceId),
        "User2 should not have User1's place",
      );
      console.log("  ✓ User2's bookmarks are isolated");
    });

    await t.step(
      "5. Verify shared place is bookmarked by both users",
      async () => {
        console.log(`\n[QUERY] isBookmarked - Check shared place for User1`);
        const check1 = await concept.isBookmarked({
          userId: user1Id,
          placeId: sharedPlaceId,
        });
        assertEquals((check1 as { isBookmarked: boolean }).isBookmarked, true);
        console.log("  ✓ User1 has shared place bookmarked");

        console.log(`\n[QUERY] isBookmarked - Check shared place for User2`);
        const check2 = await concept.isBookmarked({
          userId: user2Id,
          placeId: sharedPlaceId,
        });
        assertEquals((check2 as { isBookmarked: boolean }).isBookmarked, true);
        console.log("  ✓ User2 has shared place bookmarked");
      },
    );

    console.log("\n✅ Scenario 3: User isolation maintained correctly");
  } finally {
    await client.close();
  }
});

/**
 * Interesting Scenario 4: Retrieval ordering and bookmark IDs
 *
 * Tests that bookmarks are ordered by createdAt descending.
 * Verifies the difference between getUserBookmarks and getBookmarkedPlaces.
 */
Deno.test("Scenario 4: Retrieval ordering and bookmark IDs", async (t) => {
  console.log("\n=== Scenario 4: Retrieval Ordering ===");
  const [db, client] = await testDb();
  const concept = new BookmarkConcept(db);

  try {
    const user1Id = freshID();
    const place1Id = freshID();
    const place2Id = freshID();
    const place3Id = freshID();
    let bookmark1Id: ID;
    let bookmark2Id: ID;
    let bookmark3Id: ID;

    await t.step("1. Bookmark places with time delays", async () => {
      console.log(`\n[ACTION] bookmarkPlace - Bookmarking Place1 (oldest)`);
      const result1 = await concept.bookmarkPlace({
        userId: user1Id,
        placeId: place1Id,
      });
      bookmark1Id = (result1 as { bookmarkId: ID }).bookmarkId;
      console.log("  ✓ Place1 bookmarked");

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      console.log(`\n[ACTION] bookmarkPlace - Bookmarking Place2 (middle)`);
      const result2 = await concept.bookmarkPlace({
        userId: user1Id,
        placeId: place2Id,
      });
      bookmark2Id = (result2 as { bookmarkId: ID }).bookmarkId;
      console.log("  ✓ Place2 bookmarked");

      await new Promise((resolve) => setTimeout(resolve, 10));

      console.log(`\n[ACTION] bookmarkPlace - Bookmarking Place3 (newest)`);
      const result3 = await concept.bookmarkPlace({
        userId: user1Id,
        placeId: place3Id,
      });
      bookmark3Id = (result3 as { bookmarkId: ID }).bookmarkId;
      console.log("  ✓ Place3 bookmarked");
    });

    await t.step(
      "2. Verify place IDs are ordered by createdAt desc",
      async () => {
        console.log(`\n[QUERY] getBookmarkedPlaces - Verifying ordering`);
        const placesResult = await concept.getBookmarkedPlaces({
          userId: user1Id,
        });
        const placeIds = (placesResult as { placeIds: ID[] }).placeIds;
        assertEquals(placeIds.length, 3, "Should have 3 places");
        assertEquals(placeIds[0], place3Id, "Newest should be first");
        assertEquals(placeIds[1], place2Id, "Middle should be second");
        assertEquals(placeIds[2], place1Id, "Oldest should be last");
        console.log("  ✓ Place IDs ordered correctly (newest first)");
      },
    );

    await t.step(
      "3. Verify bookmark IDs are ordered by createdAt desc",
      async () => {
        console.log(
          `\n[QUERY] getUserBookmarks - Verifying bookmark ID ordering`,
        );
        const bookmarksResult = await concept.getUserBookmarks({
          userId: user1Id,
        });
        const bookmarkIds =
          (bookmarksResult as { bookmarkIds: ID[] }).bookmarkIds;
        assertEquals(bookmarkIds.length, 3, "Should have 3 bookmark IDs");
        assertEquals(
          bookmarkIds[0],
          bookmark3Id,
          "Newest bookmark should be first",
        );
        assertEquals(
          bookmarkIds[1],
          bookmark2Id,
          "Middle bookmark should be second",
        );
        assertEquals(
          bookmarkIds[2],
          bookmark1Id,
          "Oldest bookmark should be last",
        );
        console.log("  ✓ Bookmark IDs ordered correctly (newest first)");
      },
    );

    await t.step("4. Verify bookmark IDs correspond to place IDs", async () => {
      console.log(`\n[VERIFY] Matching bookmark IDs to place IDs`);
      const bookmarksResult = await concept.getUserBookmarks({
        userId: user1Id,
      });
      const placesResult = await concept.getBookmarkedPlaces({
        userId: user1Id,
      });
      const bookmarkIds =
        (bookmarksResult as { bookmarkIds: ID[] }).bookmarkIds;
      const placeIds = (placesResult as { placeIds: ID[] }).placeIds;

      // Verify they have the same length and order
      assertEquals(bookmarkIds.length, placeIds.length);
      // The ordering should match - newest first for both
      assertEquals(placeIds[0], place3Id);
      assertEquals(bookmarkIds[0], bookmark3Id);
      console.log("  ✓ Bookmark IDs and place IDs correspond correctly");
    });

    console.log("\n✅ Scenario 4: Ordering verified correctly");
  } finally {
    await client.close();
  }
});

/**
 * Interesting Scenario 5: Edge cases and empty states
 *
 * Tests edge cases including:
 * - User with no bookmarks
 * - Checking bookmark status for non-bookmarked places
 * - Retrieving bookmarks for user with no bookmarks
 */
Deno.test("Scenario 5: Edge cases and empty states", async (t) => {
  console.log("\n=== Scenario 5: Edge Cases ===");
  const [db, client] = await testDb();
  const concept = new BookmarkConcept(db);

  try {
    const user1Id = freshID();
    const user2Id = freshID();
    const place1Id = freshID();
    const place2Id = freshID();

    await t.step("1. User with no bookmarks", async () => {
      console.log(`\n[QUERY] getBookmarkedPlaces - User with no bookmarks`);
      const placesResult = await concept.getBookmarkedPlaces({
        userId: user1Id,
      });
      const placeIds = (placesResult as { placeIds: ID[] }).placeIds;
      assertEquals(placeIds.length, 0, "Should return empty array");
      console.log("  ✓ Empty bookmarks handled correctly");

      console.log(`\n[QUERY] getUserBookmarks - User with no bookmarks`);
      const bookmarksResult = await concept.getUserBookmarks({
        userId: user1Id,
      });
      const bookmarkIds =
        (bookmarksResult as { bookmarkIds: ID[] }).bookmarkIds;
      assertEquals(bookmarkIds.length, 0, "Should return empty array");
      console.log("  ✓ Empty bookmark IDs handled correctly");
    });

    await t.step(
      "2. Checking bookmark status for non-bookmarked places",
      async () => {
        console.log(`\n[QUERY] isBookmarked - Non-bookmarked place`);
        const check1 = await concept.isBookmarked({
          userId: user1Id,
          placeId: place1Id,
        });
        assertEquals((check1 as { isBookmarked: boolean }).isBookmarked, false);
        console.log("  ✓ Non-bookmarked place returns false");

        console.log(`\n[QUERY] isBookmarked - Another non-bookmarked place`);
        const check2 = await concept.isBookmarked({
          userId: user1Id,
          placeId: place2Id,
        });
        assertEquals((check2 as { isBookmarked: boolean }).isBookmarked, false);
        console.log("  ✓ Another non-bookmarked place returns false");
      },
    );

    await t.step("3. Bookmark and then check status", async () => {
      console.log(`\n[ACTION] bookmarkPlace - Bookmarking place for User1`);
      await concept.bookmarkPlace({ userId: user1Id, placeId: place1Id });
      console.log("  ✓ Place bookmarked");

      console.log(`\n[QUERY] isBookmarked - Check bookmarked place`);
      const check = await concept.isBookmarked({
        userId: user1Id,
        placeId: place1Id,
      });
      assertEquals((check as { isBookmarked: boolean }).isBookmarked, true);
      console.log("  ✓ Bookmarked place returns true");

      console.log(
        `\n[QUERY] isBookmarked - Check different user's view of same place`,
      );
      const checkUser2 = await concept.isBookmarked({
        userId: user2Id,
        placeId: place1Id,
      });
      assertEquals(
        (checkUser2 as { isBookmarked: boolean }).isBookmarked,
        false,
      );
      console.log("  ✓ Different user correctly sees place as not bookmarked");
    });

    await t.step("4. Multiple bookmark/unbookmark cycles", async () => {
      console.log(`\n[ACTION] Multiple bookmark/unbookmark cycles`);

      // Cycle 1: Bookmark
      const bookmark1 = await concept.bookmarkPlace({
        userId: user2Id,
        placeId: place2Id,
      });
      assertEquals(isError(bookmark1), false);

      // Cycle 1: Unbookmark
      const unbookmark1 = await concept.unbookmarkPlace({
        userId: user2Id,
        placeId: place2Id,
      });
      assertEquals((unbookmark1 as { success: boolean }).success, true);

      // Cycle 2: Bookmark again (should succeed)
      const bookmark2 = await concept.bookmarkPlace({
        userId: user2Id,
        placeId: place2Id,
      });
      assertEquals(isError(bookmark2), false);

      // Cycle 2: Unbookmark again
      const unbookmark2 = await concept.unbookmarkPlace({
        userId: user2Id,
        placeId: place2Id,
      });
      assertEquals((unbookmark2 as { success: boolean }).success, true);

      console.log("  ✓ Multiple bookmark/unbookmark cycles work correctly");
    });

    console.log("\n✅ Scenario 5: All edge cases handled correctly");
  } finally {
    await client.close();
  }
});
