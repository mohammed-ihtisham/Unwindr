---
timestamp: 'Sun Oct 19 2025 17:13:27 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_171327.a1774331.md]]'
content_id: bc341f8d0bc48187c0ab12b5fa4ad06f2f0fa6aa438b9550ba496c23e229f9c8
---

# response:

To ensure the `MediaLibrary` concept is 100% complete for bare-minimum MVP functionality for "visual discovery," we need to refine the retrieval action to directly support display and add a basic management action for user-contributed media.

Here's the updated `MediaLibrary` concept:

```diff
--- a/concepts/MediaLibrary/MediaLibrary.md
+++ b/concepts/MediaLibrary/MediaLibrary.md
@@ -2,25 +2,40 @@
 concept MediaLibrary [User, Place]
 purpose store and retrieve media items for visual discovery
 principle only manages media data, not engagement or analytics
 
 state
 a set of MediaItems with
   an _id Id
   a placeId Id
-  a contributorId Id
+  a contributorId Id // userId if source is "user", otherwise system/null
   a createdAt Date
   an imageUrl String
   a source String // "provider" | "user"
 
 actions
 seedMedia (placeId: Id, urls: set String) : (count: Number)
   requires urls not empty
-  effect inserts provider-sourced media items
+  effect inserts provider-sourced media items, setting source to "provider"
 
 addMedia (userId: Id, placeId: Id, imageUrl: String) : (mediaId: Id)
   requires userId valid and imageUrl non-empty
-  effect adds user-contributed media
+  effect adds user-contributed media, setting source to "user" and contributorId to userId
 
-getMediaByPlace (placeId: Id) : (mediaIds: set Id)
+getMediaByPlace (placeId: Id, limit: Number = 20, offset: Number = 0) : (mediaItems: set { _id: Id, imageUrl: String, createdAt: Date, source: String })
   requires placeId provided
-  effect returns media item IDs ordered by createdAt desc
+  effect returns media items (with _id, imageUrl, createdAt, source) ordered by createdAt desc, limited by count and offset
+
+deleteMedia (userId: Id, mediaId: Id) : (success: Boolean)
+  requires mediaId exists and userId matches contributorId of mediaId
+  effect removes media item from the set
```

**Reasoning for Changes:**

1. **`state.contributorId` clarification:** Added a comment to clarify the relationship between `contributorId` and `source`, which helps in understanding how media items are attributed.
2. **`seedMedia` and `addMedia` effect clarification:** Explicitly mentioned how `source` and `contributorId` are set by these actions for clarity.
3. **`getMediaByPlace` update:**
   * **Return Type:** Changed from `set Id` to `set { _id: Id, imageUrl: String, createdAt: Date, source: String }`. For "visual discovery," the caller *needs* the `imageUrl` and other display-relevant metadata immediately. Returning just IDs would necessitate subsequent calls for each item, making it inefficient and incomplete for direct display.
   * **Pagination:** Added `limit` and `offset` parameters. For any "discovery" feature that might involve many items, returning an unbounded set is not scalable or performant. Pagination is a bare-minimum requirement for displaying lists effectively in an MVP.
4. **`deleteMedia` action added:**
   * While not strictly part of "discovery," the ability for users to *add* media (via `addMedia`) implies a need for basic control over their contributions. For an MVP, allowing a user to delete their own media is a critical safeguard against accidental uploads or inappropriate content, and a common user expectation for user-generated content features.

These changes ensure the `MediaLibrary` can store, retrieve, and display media efficiently for visual discovery, and provides essential basic management for user-contributed content, fulfilling the "bare-minimum functionality for an MVP."
