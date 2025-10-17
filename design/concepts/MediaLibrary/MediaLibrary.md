
[text](../../../context/design/concepts/MediaLibrary/MediaLibrary.md/steps/_.e11c2373.md)

# MediaLibrary Concept

concept MediaLibrary [User, Place]
purpose store and retrieve media items for visual discovery
principle only manages media data, not engagement or analytics

state
  a set of MediaItems with
    an _id Id
    a placeId Id
    a contributorId Id
    a createdAt Date
    an imageUrl String
    a source String // "provider" | "user"

actions
  seedMedia (placeId: Id, urls: set String) : (count: Number)
    requires urls not empty
    effect inserts provider-sourced media items

  addMedia (userId: Id, placeId: Id, imageUrl: String) : (mediaId: Id)
    requires userId valid and imageUrl non-empty
    effect adds user-contributed media

  getMediaByPlace (placeId: Id) : (mediaIds: set Id)
    requires placeId provided
    effect returns media item IDs ordered by createdAt desc