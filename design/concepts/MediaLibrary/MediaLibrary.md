# MediaLibrary Concept

[text](../../../context/design/brainstorming/questioning.md/steps/response.bc341f8d.md)

concept MediaLibrary [User, Place]
purpose store and retrieve media items for visual discovery
principle only manages media data, not engagement or analytics

state
  a set of MediaItems with
    an _id Id
    a placeId Id
    a contributorId Id // userId if source is "user", otherwise system/null
    a createdAt Date
    an imageUrl String
    a source String // "provider" | "user"

actions
  seedMedia (placeId: Id, urls: set String) : (count: Number)
    requires urls not empty
    effect inserts provider-sourced media items, setting source to "provider"

  addMedia (userId: Id, placeId: Id, imageUrl: String) : (mediaId: Id)
    requires userId valid and imageUrl non-empty
    effect adds user-contributed media, setting source to "user" and contributorId to userId

  deleteMedia (userId: Id, mediaId: Id) : (success: Boolean)
    requires mediaId exists and userId matches contributorId of mediaId
    effect removes media item from the set

  getMediaByPlace (placeId: Id) : (mediaIds: set Id)
    requires placeId provided
    effect returns media item IDs ordered by createdAt desc