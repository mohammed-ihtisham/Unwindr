(base) mohammedihtisham@dhcp-10-29-155-175 Unwindr % deno task test:bookmark
Task test:bookmark deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/Bookmark/BookmarkConcept.test.ts
Check file:///Users/mohammedihtisham/Desktop/Unwindr/src/concepts/Bookmark/BookmarkConcept.test.ts
running 6 tests from ./src/concepts/Bookmark/BookmarkConcept.test.ts
Operational Principle: Users bookmark places and retrieve them ...
------- output -------

=== Operational Principle: Bookmark Usage ===
----- output end -----
  1. User bookmarks multiple places ...
------- output -------

[ACTION] bookmarkPlace - User bookmarks Place1
  Output: { bookmarkId: "019a5f38-bebf-7996-ba27-6f9f51516d06" }
  ✓ Place1 bookmarked

[ACTION] bookmarkPlace - User bookmarks Place2
  Output: { bookmarkId: "019a5f38-bef1-74d7-9fef-9d34c4ce5804" }
  ✓ Place2 bookmarked

[ACTION] bookmarkPlace - User bookmarks Place3
  Output: { bookmarkId: "019a5f38-bf12-7041-becd-ae49d3994802" }
  ✓ Place3 bookmarked
----- output end -----
  1. User bookmarks multiple places ... ok (115ms)
  2. User retrieves all bookmarked places ...
------- output -------

[QUERY] getBookmarkedPlaces - Retrieving all bookmarked places
  Output: {
  placeIds: [
    "019a5f38-beae-761d-afa0-494668b55738",
    "019a5f38-beae-72da-a590-6a48e5eee9b2",
    "019a5f38-beae-7910-8b22-6ae5c3f2ea9b"
  ]
}
  ✓ Retrieved all bookmarked places
----- output end -----
  2. User retrieves all bookmarked places ... ok (16ms)
  3. User checks if specific places are bookmarked ...
------- output -------

[QUERY] isBookmarked - Checking if Place1 is bookmarked
  Output: { isBookmarked: true }
  ✓ Place1 is bookmarked

[QUERY] isBookmarked - Checking if Place2 is bookmarked
  Output: { isBookmarked: true }
  ✓ Place2 is bookmarked
----- output end -----
  3. User checks if specific places are bookmarked ... ok (31ms)
  4. User retrieves bookmark IDs ...
------- output -------

[QUERY] getUserBookmarks - Retrieving bookmark IDs
  Output: {
  bookmarkIds: [
    "019a5f38-bf12-7041-becd-ae49d3994802",
    "019a5f38-bef1-74d7-9fef-9d34c4ce5804",
    "019a5f38-bebf-7996-ba27-6f9f51516d06"
  ]
}
  ✓ Retrieved bookmark IDs
----- output end -----
  4. User retrieves bookmark IDs ... ok (16ms)
------- output -------

✅ Operational principle demonstrated: Complete bookmark workflow
----- output end -----
Operational Principle: Users bookmark places and retrieve them ... ok (645ms)
Scenario 1: Duplicate bookmark prevention ...
------- output -------

=== Scenario 1: Duplicate Bookmark Prevention ===
----- output end -----
  1. Bookmark a place successfully ...
------- output -------

[ACTION] bookmarkPlace - First bookmark attempt
  Output: { bookmarkId: "019a5f38-c165-7638-832a-c91ab2c16333" }
  ✓ First bookmark succeeded
----- output end -----
  1. Bookmark a place successfully ... ok (53ms)
  2. Attempt to bookmark the same place again ...
------- output -------

[ACTION] bookmarkPlace - Duplicate bookmark attempt
  Output: { error: "Bookmark already exists for this user and place." }
  ✓ Duplicate bookmark rejected correctly
----- output end -----
  2. Attempt to bookmark the same place again ... ok (17ms)
  3. Verify only one bookmark exists ...
------- output -------

[QUERY] getBookmarkedPlaces - Verifying single bookmark
  ✓ Only one bookmark exists
----- output end -----
  3. Verify only one bookmark exists ... ok (21ms)
------- output -------

✅ Scenario 1: Duplicate bookmarks prevented correctly
----- output end -----
Scenario 1: Duplicate bookmark prevention ... ok (585ms)
Scenario 2: Unbookmarking workflow ...
------- output -------

=== Scenario 2: Unbookmarking Workflow ===
----- output end -----
  1. Bookmark multiple places ...
------- output -------

[ACTION] bookmarkPlace - Bookmarking Place1 and Place2
  ✓ Both places bookmarked
----- output end -----
  1. Bookmark multiple places ... ok (101ms)
  2. Unbookmark one place ...
------- output -------

[ACTION] unbookmarkPlace - Unbookmarking Place1
  Output: { success: true }
  ✓ Place1 unbookmarked successfully
----- output end -----
  2. Unbookmark one place ... ok (18ms)
  3. Verify unbookmarked place is removed ...
------- output -------

[QUERY] getBookmarkedPlaces - Verifying removal
  ✓ Place1 removed, Place2 remains

[QUERY] isBookmarked - Verifying Place1 is not bookmarked
  ✓ Place1 correctly marked as not bookmarked
----- output end -----
  3. Verify unbookmarked place is removed ... ok (34ms)
  4. Attempt to unbookmark non-existent bookmark ...
------- output -------

[ACTION] unbookmarkPlace - Unbookmarking non-existent bookmark
  Output: { success: false }
  ✓ Non-existent unbookmark handled correctly
----- output end -----
  4. Attempt to unbookmark non-existent bookmark ... ok (19ms)
  5. Unbookmark remaining place ...
------- output -------

[ACTION] unbookmarkPlace - Unbookmarking Place2
  ✓ Place2 unbookmarked

[QUERY] getBookmarkedPlaces - Verifying all bookmarks removed
  ✓ All bookmarks removed
----- output end -----
  5. Unbookmark remaining place ... ok (36ms)
------- output -------

✅ Scenario 2: Unbookmarking workflow works correctly
----- output end -----
Scenario 2: Unbookmarking workflow ... ok (675ms)
Scenario 3: Multiple users bookmarking ...
------- output -------

=== Scenario 3: Multiple Users Bookmarking ===
----- output end -----
  1. User1 bookmarks places ...
------- output -------

[ACTION] bookmarkPlace - User1 bookmarks shared place and own place
  ✓ User1 bookmarked 2 places
----- output end -----
  1. User1 bookmarks places ... ok (86ms)
  2. User2 bookmarks places ...
------- output -------

[ACTION] bookmarkPlace - User2 bookmarks shared place and own place
  ✓ User2 bookmarked 2 places
----- output end -----
  2. User2 bookmarks places ... ok (69ms)
  3. Verify user isolation - User1's bookmarks ...
------- output -------

[QUERY] getBookmarkedPlaces - User1's bookmarks
  ✓ User1's bookmarks are isolated
----- output end -----
  3. Verify user isolation - User1's bookmarks ... ok (21ms)
  4. Verify user isolation - User2's bookmarks ...
------- output -------

[QUERY] getBookmarkedPlaces - User2's bookmarks
  ✓ User2's bookmarks are isolated
----- output end -----
  4. Verify user isolation - User2's bookmarks ... ok (17ms)
  5. Verify shared place is bookmarked by both users ...
------- output -------

[QUERY] isBookmarked - Check shared place for User1
  ✓ User1 has shared place bookmarked

[QUERY] isBookmarked - Check shared place for User2
  ✓ User2 has shared place bookmarked
----- output end -----
  5. Verify shared place is bookmarked by both users ... ok (32ms)
------- output -------

✅ Scenario 3: User isolation maintained correctly
----- output end -----
Scenario 3: Multiple users bookmarking ... ok (753ms)
Scenario 4: Retrieval ordering and bookmark IDs ...
------- output -------

=== Scenario 4: Retrieval Ordering ===
----- output end -----
  1. Bookmark places with time delays ...
------- output -------

[ACTION] bookmarkPlace - Bookmarking Place1 (oldest)
  ✓ Place1 bookmarked

[ACTION] bookmarkPlace - Bookmarking Place2 (middle)
  ✓ Place2 bookmarked

[ACTION] bookmarkPlace - Bookmarking Place3 (newest)
  ✓ Place3 bookmarked
----- output end -----
  1. Bookmark places with time delays ... ok (156ms)
  2. Verify place IDs are ordered by createdAt desc ...
------- output -------

[QUERY] getBookmarkedPlaces - Verifying ordering
  ✓ Place IDs ordered correctly (newest first)
----- output end -----
  2. Verify place IDs are ordered by createdAt desc ... ok (19ms)
  3. Verify bookmark IDs are ordered by createdAt desc ...
------- output -------

[QUERY] getUserBookmarks - Verifying bookmark ID ordering
  ✓ Bookmark IDs ordered correctly (newest first)
----- output end -----
  3. Verify bookmark IDs are ordered by createdAt desc ... ok (18ms)
  4. Verify bookmark IDs correspond to place IDs ...
------- output -------

[VERIFY] Matching bookmark IDs to place IDs
  ✓ Bookmark IDs and place IDs correspond correctly
----- output end -----
  4. Verify bookmark IDs correspond to place IDs ... ok (38ms)
------- output -------

✅ Scenario 4: Ordering verified correctly
----- output end -----
Scenario 4: Retrieval ordering and bookmark IDs ... ok (705ms)
Scenario 5: Edge cases and empty states ...
------- output -------

=== Scenario 5: Edge Cases ===
----- output end -----
  1. User with no bookmarks ...
------- output -------

[QUERY] getBookmarkedPlaces - User with no bookmarks
  ✓ Empty bookmarks handled correctly

[QUERY] getUserBookmarks - User with no bookmarks
  ✓ Empty bookmark IDs handled correctly
----- output end -----
  1. User with no bookmarks ... ok (35ms)
  2. Checking bookmark status for non-bookmarked places ...
------- output -------

[QUERY] isBookmarked - Non-bookmarked place
  ✓ Non-bookmarked place returns false

[QUERY] isBookmarked - Another non-bookmarked place
  ✓ Another non-bookmarked place returns false
----- output end -----
  2. Checking bookmark status for non-bookmarked places ... ok (46ms)
  3. Bookmark and then check status ...
------- output -------

[ACTION] bookmarkPlace - Bookmarking place for User1
  ✓ Place bookmarked

[QUERY] isBookmarked - Check bookmarked place
  ✓ Bookmarked place returns true

[QUERY] isBookmarked - Check different user's view of same place
  ✓ Different user correctly sees place as not bookmarked
----- output end -----
  3. Bookmark and then check status ... ok (93ms)
  4. Multiple bookmark/unbookmark cycles ...
------- output -------

[ACTION] Multiple bookmark/unbookmark cycles
  ✓ Multiple bookmark/unbookmark cycles work correctly
----- output end -----
  4. Multiple bookmark/unbookmark cycles ... ok (128ms)
------- output -------

✅ Scenario 5: All edge cases handled correctly
----- output end -----
Scenario 5: Edge cases and empty states ... ok (785ms)

ok | 6 passed (25 steps) | 0 failed (4s)

(base) mohammedihtisham@dhcp-10-29-155-175 Unwindr % 