---
timestamp: 'Sat Oct 18 2025 21:23:02 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_212302.92f11322.md]]'
content_id: 5b07617063e0d638f351743f42bc91ed21344f1d2677f1ce0343168bb81c563a
---

# Prompt: Add or update anything in the PlaceCatalog concept to make sure it is 100% complete for bare-minimum functionality for an MVP?

[text](../../../context/design/concepts/PlaceCatalog/PlaceCatalog.md/steps/_.41cfdb5e.md)

concept PlaceCatalog \[User]
purpose manage discoverable places and their basic data
principle users can add, verify, and update places; system can seed from provider

state
a set of Places with
an \_id Id
a name String
an address String
a category String
a verified Flag
an addedBy User
a location Location
a source String // "provider" or "user\_added"

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

verifyPlace (placeId: Id, moderatorId: Id)
requires user has moderation privileges
effect marks place as verified

updatePlace (placeId: Id, name: String, address: String, userId: Id)
requires place exists and user is authenticated
effect updates place details

getPlacesInArea (centerLat: Number, centerLng: Number, radius: Number) : (places: set Id)
requires coordinates are valid and radius > 0
effect returns nearby place IDs
