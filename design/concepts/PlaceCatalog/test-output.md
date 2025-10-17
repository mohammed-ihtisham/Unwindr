(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:place
Task test:place deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
running 7 tests from ./src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
Principle: Users can add, verify, and update places; system can seed from provider ...
------- output -------

=== Testing Principle Fulfillment ===

[ACTION] seedPlaces - System seeds places from provider
  Input: { centerLat: 34.0522, centerLng: -118.2437, radius: 50 }
Seeded 3 dummy places.
  Output: {}
  ✓ Seeding completed successfully

[VERIFY] Check seeded places
  ✓ System seeded 3 places. Example ID: 0199f3a8-d976-7ab0-a85e-4fa02b1ed99e

[ACTION] addPlace - User adds a new place
  Input: { userId: user:Charlie, name: "Charlie's Bookstore", address: "100 Pine Street", category: "Bookstore", lat: 34.0532, lng: -118.2427 }
  Output: { placeId: "0199f3a8-d9a0-7d24-99a7-d9f8b1a7486e" }
  ✓ User added place with ID: 0199f3a8-d9a0-7d24-99a7-d9f8b1a7486e

[VERIFY] Check added place details
  ✓ Added place details are correct and it's unverified

[ACTION] verifyPlace - Moderator verifies the user-added place
  Input: { placeId: 0199f3a8-d9a0-7d24-99a7-d9f8b1a7486e, moderatorId: user:DianaModerator }
  Output: {}
  ✓ Verification action completed

[VERIFY] Check place is now verified
  ✓ Place is now marked as verified

[ACTION] updatePlace - User updates a place
  Input: { placeId: 0199f3a8-d9a0-7d24-99a7-d9f8b1a7486e, name: "Charlie's NEW & Improved Bookstore", address: "200 Oak Street", userId: user:Charlie }
  Output: {}
  ✓ Update action completed

[VERIFY] Check place details reflect the update
  ✓ Place details reflect the update

[QUERY] _getPlacesInArea - Discovering places in an area
  Input: { centerLat: 34.0522, centerLng: -118.2437, radius: 50 }
  Output: {
  places: [
    "0199f3a8-d976-7668-a944-689cecb7029f",
    "0199f3a8-d9a0-7d24-99a7-d9f8b1a7486e",
    "0199f3a8-d976-7ab0-a85e-4fa02b1ed99e",
    "0199f3a8-d976-7fa4-b174-14b040a8106f"
  ]
}
  ✓ Found 4 places. Both seeded and user-managed places are present

✅ Principle demonstrated: Users can add, verify, and update places; system can seed from provider
----- output end -----
Principle: Users can add, verify, and update places; system can seed from provider ... ok (871ms)
Action: seedPlaces successfully seeds places and enforces requirements ...
------- output -------

=== Testing seedPlaces Action ===

[TEST] Seed places successfully
  ✓ Collection is empty initially
  Input: { centerLat: 0, centerLng: 0, radius: 10 }
Seeded 3 dummy places.
  Output: {}
  ✓ Seeding completed without errors
  ✓ 3 places seeded

[TEST] Prevent re-seeding when places already exist
  Input: { centerLat: 0, centerLng: 0, radius: 10 }
Places already exist, skipping seeding.
  Output: {}
  ✓ Collection count remains 3, no re-seeding occurred

[TEST] Reject seeding with invalid radius
  Input: { centerLat: 0, centerLng: 0, radius: 0 }
  Output: { error: "Invalid coordinates or radius must be positive." }
  ✓ Correctly rejected invalid radius

[TEST] Reject seeding with invalid latitude
  Input: { centerLat: 91, centerLng: 0, radius: 10 }
  Output: { error: "Invalid coordinates or radius must be positive." }
  ✓ Correctly rejected invalid latitude

✅ All seedPlaces requirements verified
----- output end -----
Action: seedPlaces successfully seeds places and enforces requirements ... ok (747ms)
Action: addPlace successfully adds places and enforces requirements ...
------- output -------

=== Testing addPlace Action ===

[TEST] Add a new place successfully
  Input: { userId: user:Alice, name: "User's Favorite Spot", address: "42 Wallaby Way", category: "Recreation", lat: 34.0522, lng: -118.2437 }
  Output: { placeId: "0199f3a8-e00d-7ed3-8b75-359c841767b4" }
  ✓ New place added with ID: 0199f3a8-e00d-7ed3-8b75-359c841767b4

[VERIFY] Check added place details
  ✓ Added place details match expectations

[TEST] Reject adding place with empty name
  Input: { userId: user:Alice, name: "", address: "123 Test St", category: "Test", lat: 0, lng: 0 }
  Output: { error: "Place name cannot be empty." }
  ✓ Correctly rejected empty name

[TEST] Reject adding place with invalid coordinates
  Input: { userId: user:Alice, name: "Bad Coord Place", address: "123 Test St", category: "Test", lat: 900, lng: 0 }
  Output: { error: "Invalid coordinates." }
  ✓ Correctly rejected invalid coordinates

[TEST] Reject adding place with no userId
  Input: { userId: "", name: "No User Place", address: "123 Test St", category: "Test", lat: 0, lng: 0 }
  Output: { error: "User ID is required." }
  ✓ Correctly rejected missing userId

✅ All addPlace requirements verified
----- output end -----
Action: addPlace successfully adds places and enforces requirements ... ok (825ms)
Action: verifyPlace allows moderators to verify places and enforces requirements ...
------- output -------

=== Testing verifyPlace Action ===

[SETUP] Add an unverified place
  ✓ Place added with ID: 0199f3a8-e235-7274-9a1e-a547270a0828

[TEST] Verify an unverified place successfully
  ✓ Place is currently unverified
  Input: { placeId: 0199f3a8-e235-7274-9a1e-a547270a0828, moderatorId: user:BobModerator }
  Output: {}
  ✓ Place verification action performed

[VERIFY] Check place is now verified
  ✓ Place is now verified

[TEST] Reject verifying non-existent place
  Input: { placeId: 0199f3a8-e342-7b76-821d-7d910b44d8dc, moderatorId: user:BobModerator }
  Output: {
  error: "Place with ID 0199f3a8-e342-7b76-821d-7d910b44d8dc not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject verifying already verified place
  Input: { placeId: 0199f3a8-e235-7274-9a1e-a547270a0828, moderatorId: user:BobModerator }
  Output: {
  error: "Place with ID 0199f3a8-e235-7274-9a1e-a547270a0828 is already verified."
}
  ✓ Correctly rejected already verified place

[TEST] Reject verifying with no moderatorId
  Input: { placeId: 0199f3a8-e235-7274-9a1e-a547270a0828, moderatorId: "" }
  Output: { error: "Moderator ID is required for verification." }
  ✓ Correctly rejected missing moderatorId

✅ All verifyPlace requirements verified
----- output end -----
Action: verifyPlace allows moderators to verify places and enforces requirements ... ok (805ms)
Action: updatePlace allows users to update places and enforces requirements ...
------- output -------

=== Testing updatePlace Action ===

[SETUP] Add a place for update tests
  ✓ Place added with ID: 0199f3a8-e562-7a97-aca6-6f2a329909f2

[TEST] Update a place successfully
  ✓ Verified original place details
  Input: { placeId: 0199f3a8-e562-7a97-aca6-6f2a329909f2, name: "Updated Name", address: "Updated Address", userId: user:Alice }
  Output: {}
  ✓ Place update action performed

[VERIFY] Check place details are updated
  ✓ Place details updated successfully

[TEST] Reject updating non-existent place
  Input: { placeId: 0199f3a8-e667-7aeb-a428-e7fa5ff1f0a7, name: "New Name", address: "New Address", userId: user:Alice }
  Output: {
  error: "Place with ID 0199f3a8-e667-7aeb-a428-e7fa5ff1f0a7 not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject updating with empty name
  Input: { placeId: 0199f3a8-e562-7a97-aca6-6f2a329909f2, name: "", address: "Valid Address", userId: user:Alice }
  Output: { error: "Place name cannot be empty." }
  ✓ Correctly rejected empty name

[TEST] Reject updating with no userId
  Input: { placeId: 0199f3a8-e562-7a97-aca6-6f2a329909f2, name: "Valid Name", address: "Valid Address", userId: "" }
  Output: { error: "User ID is required." }
  ✓ Correctly rejected missing userId

[TEST] Reject updating with no changes
  Input: { placeId: 0199f3a8-e562-7a97-aca6-6f2a329909f2, name: "Updated Name", address: "Updated Address", userId: user:Alice }
  Output: {
  error: "Place with ID 0199f3a8-e562-7a97-aca6-6f2a329909f2 details are already up-to-date."
}
  ✓ Correctly rejected update with no changes

✅ All updatePlace requirements verified
----- output end -----
Action: updatePlace allows users to update places and enforces requirements ... ok (819ms)
Query: _getPlacesInArea retrieves places within specified area and enforces requirements ...
------- output -------

=== Testing _getPlacesInArea Query ===

[SETUP] Seed places for area query tests
Seeded 3 dummy places.
  ✓ Seeded places available, using reference place at (0.01, 0.01)

[SETUP] Add a user place for query tests
  ✓ User place added with ID: 0199f3a8-e99b-7ff7-b819-98c6d6e4483b

[TEST] Retrieve places in area successfully
  Input: { centerLat: 0.01, centerLng: 0.01, radius: 1 }
  Output: {
  places: [
    "0199f3a8-e975-7676-91d8-028090758a5c",
    "0199f3a8-e99b-7ff7-b819-98c6d6e4483b"
  ]
}
  ✓ Found 2 places in the area, including expected ones

[TEST] Retrieve places with larger radius
  Input: { centerLat: 0.01, centerLng: 0.01, radius: 100 }
  Output: {
  places: [
    "0199f3a8-e975-7592-a5f1-dc2cef51834c",
    "0199f3a8-e975-7676-91d8-028090758a5c",
    "0199f3a8-e99b-7ff7-b819-98c6d6e4483b",
    "0199f3a8-e975-775f-a2ca-20ac8a1ee4a6"
  ]
}
  ✓ Larger radius found 4 places (all in database)

[TEST] Reject query with invalid latitude
  Input: { centerLat: 91, centerLng: 0, radius: 1 }
  Output: { error: "Invalid coordinates or radius must be positive." }
  ✓ Correctly rejected invalid latitude

[TEST] Reject query with zero radius
  Input: { centerLat: 0, centerLng: 0, radius: 0 }
  Output: { error: "Invalid coordinates or radius must be positive." }
  ✓ Correctly rejected zero radius

✅ All _getPlacesInArea requirements verified
----- output end -----
Query: _getPlacesInArea retrieves places within specified area and enforces requirements ... ok (837ms)
Query: _getPlaceDetails retrieves correct place information and enforces requirements ...
------- output -------

=== Testing _getPlaceDetails Query ===

[SETUP] Add a place for details query tests
  ✓ Place added with ID: 0199f3a8-ec1a-7e9d-832e-45f55ea1af13

[SETUP] Verify the place
  ✓ Place verified

[SETUP] Update the place
  ✓ Place updated

[TEST] Retrieve place details successfully
  Input: { placeId: 0199f3a8-ec1a-7e9d-832e-45f55ea1af13 }
  Output: {
  place: {
    id: "0199f3a8-ec1a-7e9d-832e-45f55ea1af13",
    name: "Updated Details Test Place",
    address: "Updated Details Test Address",
    category: "Test",
    verified: true,
    addedBy: "user:Alice",
    location: { type: "Point", coordinates: [ -118.2437, 34.0522 ] },
    source: "user_added"
  }
}
  ✓ Place details retrieved

[VERIFY] Check place details are correct
  ✓ All place details are correct

[TEST] Reject query for non-existent place
  Input: { placeId: 0199f3a8-ed34-7e62-b0c5-91c17313413e }
  Output: {
  error: "Place with ID 0199f3a8-ed34-7e62-b0c5-91c17313413e not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject query with empty placeId
  Input: { placeId: "" }
  Output: { error: "Place ID is required." }
  ✓ Correctly rejected empty placeId

✅ All _getPlaceDetails requirements verified
----- output end -----
Query: _getPlaceDetails retrieves correct place information and enforces requirements ... ok (869ms)

ok | 7 passed | 0 failed (5s)