---
timestamp: 'Sat Oct 18 2025 21:23:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_212321.012a797b.md]]'
content_id: 550bf4a1e6dbed591d3c86debc30823a8777e0546c11d6f52a1d5740eab3a03c
---

# response:

To make the `PlaceCatalog` concept 100% complete for bare-minimum MVP functionality, we need to ensure users can not only discover place IDs but also retrieve their full details, and that moderators have full control over the `verified` status for data quality.

Here are the proposed updates:

1. **Add `getPlace` action:** The current `getPlacesInArea` action returns only a set of `Id`s. For a user to actually *view* a place, they need to retrieve its full details (name, address, category, location, etc.). This is a critical missing piece for MVP.
2. **Modify `verifyPlace` to `setPlaceVerificationStatus`:** The existing `verifyPlace` action only allows setting `verified` to `true`. For data quality and moderation, it's essential to also be able to mark a place as `unverified` (e.g., if it's found to be inaccurate, spam, or no longer exists). This provides a soft-deletion mechanism for problematic entries, which is sufficient for an MVP.

```diff
concept PlaceCatalog [User]
purpose manage discoverable places and their basic data
principle users can add, verify, and update places; system can seed from provider

state
a set of Places with
an _id Id
a name String
an address String
a category String
a verified Flag
an addedBy User
a location Location
a source String // "provider" or "user_added"

a set of Locations with
a latitude Number
a longitude Number

actions
seedPlaces (centerLat: Number, centerLng: Number, radius: Number)
requires coordinates are valid and radius > 0
effect loads places from provider within specified area

addPlace (userId: Id, name: String, address: String, category: String, lat: Number, lng: Number) : (placeId: Id)
requires user is authenticated and name is not empty and coordinates are valid
effect creates user-added place

-verifyPlace (placeId: Id, moderatorId: Id)
-requires user has moderation privileges
-effect marks place as verified
+setPlaceVerificationStatus (placeId: Id, moderatorId: Id, isVerified: Boolean)
+requires user has moderation privileges and place exists
+effect sets the verification status of the place (true for verified, false for unverified/deactivated)

updatePlace (placeId: Id, name: String, address: String, userId: Id)
requires place exists and user is authenticated
effect updates place details

+getPlace (placeId: Id) : (place: Place)
+requires place exists
+effect returns the full details of a single place

getPlacesInArea (centerLat: Number, centerLng: Number, radius: Number) : (places: set Id)
requires coordinates are valid and radius > 0
effect returns nearby place IDs
```
