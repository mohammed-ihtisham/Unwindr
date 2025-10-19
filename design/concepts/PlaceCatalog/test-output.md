(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:place
Task test:place deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
Check file:///Users/mohammedihtisham/Desktop/Unwindr/src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
running 7 tests from ./src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
Principle: Users can add, set verification status, and update places; system can seed from provider ...
------- output -------

=== Testing Principle Fulfillment ===

[ACTION] seedPlaces - System seeds places from provider
  Input: { centerLat: 34.0522, centerLng: -118.2437, radius: 50 }
Seeded 3 dummy places.
  Output: {}
  ✓ Seeding completed successfully

[VERIFY] Check seeded places
  ✓ System seeded 3 places. Example ID: 0199fa21-87c0-7bba-9a1c-01520101b0dc

[ACTION] addPlace - User adds a new place
  Input: { userId: user:Charlie, name: "Charlie's Bookstore", address: "100 Pine Street", category: "Bookstore", lat: 34.0532, lng: -118.2427 }
  Output: { placeId: "0199fa21-87ef-743a-a1fe-da8fa58af937" }
  ✓ User added place with ID: 0199fa21-87ef-743a-a1fe-da8fa58af937

[VERIFY] Check added place details
  ✓ Added place details are correct and it's unverified

[ACTION] setPlaceVerificationStatus - Moderator verifies the user-added place
  Input: { placeId: 0199fa21-87ef-743a-a1fe-da8fa58af937, moderatorId: user:DianaModerator, isVerified: true }
  Output: {}
  ✓ Verification action completed

[VERIFY] Check place is now verified
  ✓ Place is now marked as verified

[ACTION] updatePlace - User updates a place
  Input: { placeId: 0199fa21-87ef-743a-a1fe-da8fa58af937, name: "Charlie's NEW & Improved Bookstore", address: "200 Oak Street", userId: user:Charlie }
  Output: {}
  ✓ Update action completed

[VERIFY] Check place details reflect the update
  ✓ Place details reflect the update

[QUERY] _getPlacesInArea - Discovering places in an area
  Input: { centerLat: 34.0522, centerLng: -118.2437, radius: 50 }
  Output: {
  places: [
    "0199fa21-87c0-7615-ba8a-bcb248d5fb8a",
    "0199fa21-87ef-743a-a1fe-da8fa58af937",
    "0199fa21-87c0-7bba-9a1c-01520101b0dc",
    "0199fa21-87c0-71b8-aa6b-42886aac1925"
  ]
}
  ✓ Found 4 places. Both seeded and user-managed places are present

✅ Principle demonstrated: Users can add, set verification status, and update places; system can seed from provider
----- output end -----
Principle: Users can add, set verification status, and update places; system can seed from provider ... ok (888ms)
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
Action: seedPlaces successfully seeds places and enforces requirements ... ok (807ms)
Action: addPlace successfully adds places and enforces requirements ...
------- output -------

=== Testing addPlace Action ===

[TEST] Add a new place successfully
  Input: { userId: user:Alice, name: "User's Favorite Spot", address: "42 Wallaby Way", category: "Recreation", lat: 34.0522, lng: -118.2437 }
  Output: { placeId: "0199fa21-8e4c-7bd0-ac71-28568c5b76ec" }
  ✓ New place added with ID: 0199fa21-8e4c-7bd0-ac71-28568c5b76ec

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
Action: addPlace successfully adds places and enforces requirements ... ok (741ms)
Action: setPlaceVerificationStatus allows moderators to set verification status and enforces requirements ...
------- output -------

=== Testing setPlaceVerificationStatus Action ===

[SETUP] Add an unverified place
  ✓ Place added with ID: 0199fa21-9097-7908-a513-cec07814f9f1

[TEST] Set verification status to true (verified)
  ✓ Place is currently unverified
  Input: { placeId: 0199fa21-9097-7908-a513-cec07814f9f1, moderatorId: user:BobModerator, isVerified: true }
  Output: {}
  ✓ Place verification action performed

[VERIFY] Check place is now verified
  ✓ Place is now verified

[TEST] Set verification status to false (unverified/deactivated)
  Input: { placeId: 0199fa21-9097-7908-a513-cec07814f9f1, moderatorId: user:BobModerator, isVerified: false }
  Output: {}
  ✓ Place unverification action performed

[VERIFY] Check place is now unverified
  ✓ Place is now unverified

[TEST] Reject setting status on non-existent place
  Input: { placeId: 0199fa21-91c9-7950-92ca-531710923f99, moderatorId: user:BobModerator, isVerified: true }
  Output: {
  error: "Place with ID 0199fa21-91c9-7950-92ca-531710923f99 not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject setting status when place already has that status
  Input: { placeId: 0199fa21-9097-7908-a513-cec07814f9f1, moderatorId: user:BobModerator, isVerified: false }
  Output: {
  error: "Place with ID 0199fa21-9097-7908-a513-cec07814f9f1 already has verification status: false."
}
  ✓ Correctly rejected setting same status

[TEST] Reject setting status with no moderatorId
  Input: { placeId: 0199fa21-9097-7908-a513-cec07814f9f1, moderatorId: "", isVerified: true }
  Output: { error: "Moderator ID is required for verification." }
  ✓ Correctly rejected missing moderatorId

✅ All setPlaceVerificationStatus requirements verified
----- output end -----
Action: setPlaceVerificationStatus allows moderators to set verification status and enforces requirements ... ok (872ms)
Action: updatePlace allows users to update places and enforces requirements ...
------- output -------

=== Testing updatePlace Action ===

[SETUP] Add a place for update tests
  ✓ Place added with ID: 0199fa21-93b6-7637-9953-e6101fac9781

[TEST] Update a place successfully
  ✓ Verified original place details
  Input: { placeId: 0199fa21-93b6-7637-9953-e6101fac9781, name: "Updated Name", address: "Updated Address", userId: user:Alice }
  Output: {}
  ✓ Place update action performed

[VERIFY] Check place details are updated
  ✓ Place details updated successfully

[TEST] Reject updating non-existent place
  Input: { placeId: 0199fa21-94b6-751a-a9cd-c0bde88c8185, name: "New Name", address: "New Address", userId: user:Alice }
  Output: {
  error: "Place with ID 0199fa21-94b6-751a-a9cd-c0bde88c8185 not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject updating with empty name
  Input: { placeId: 0199fa21-93b6-7637-9953-e6101fac9781, name: "", address: "Valid Address", userId: user:Alice }
  Output: { error: "Place name cannot be empty." }
  ✓ Correctly rejected empty name

[TEST] Reject updating with no userId
  Input: { placeId: 0199fa21-93b6-7637-9953-e6101fac9781, name: "Valid Name", address: "Valid Address", userId: "" }
  Output: { error: "User ID is required." }
  ✓ Correctly rejected missing userId

[TEST] Reject updating with no changes
  Input: { placeId: 0199fa21-93b6-7637-9953-e6101fac9781, name: "Updated Name", address: "Updated Address", userId: user:Alice }
  Output: {
  error: "Place with ID 0199fa21-93b6-7637-9953-e6101fac9781 details are already up-to-date."
}
  ✓ Correctly rejected update with no changes

✅ All updatePlace requirements verified
----- output end -----
Action: updatePlace allows users to update places and enforces requirements ... ok (762ms)
Query: _getPlacesInArea retrieves places within specified area and enforces requirements ...
------- output -------

=== Testing _getPlacesInArea Query ===

[SETUP] Seed places for area query tests
Seeded 3 dummy places.
  ✓ Seeded places available, using reference place at (0.01, 0.01)

[SETUP] Add a user place for query tests
  ✓ User place added with ID: 0199fa21-979d-74aa-951a-448940accafd

[TEST] Retrieve places in area successfully
  Input: { centerLat: 0.01, centerLng: 0.01, radius: 1 }
  Output: {
  places: [
    "0199fa21-9777-737c-bdee-20b71dcdb654",
    "0199fa21-979d-74aa-951a-448940accafd"
  ]
}
  ✓ Found 2 places in the area, including expected ones

[TEST] Retrieve places with larger radius
  Input: { centerLat: 0.01, centerLng: 0.01, radius: 100 }
  Output: {
  places: [
    "0199fa21-9777-7f43-bb99-4ff407894ec0",
    "0199fa21-9777-737c-bdee-20b71dcdb654",
    "0199fa21-979d-74aa-951a-448940accafd",
    "0199fa21-9777-7575-bd31-70ef576325b6"
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
Query: _getPlacesInArea retrieves places within specified area and enforces requirements ... ok (761ms)
Action: getPlace retrieves correct place information and enforces requirements ...
------- output -------

=== Testing getPlace Action ===

[SETUP] Add a place for details query tests
  ✓ Place added with ID: 0199fa21-996d-7aa8-bef1-629ff59f7653

[SETUP] Verify the place
  ✓ Place verified

[SETUP] Update the place
  ✓ Place updated

[TEST] Retrieve place details successfully
  Input: { placeId: 0199fa21-996d-7aa8-bef1-629ff59f7653 }
  Output: {
  place: {
    id: "0199fa21-996d-7aa8-bef1-629ff59f7653",
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
  Input: { placeId: 0199fa21-9a57-7ec6-9759-2fb6a282d24b }
  Output: {
  error: "Place with ID 0199fa21-9a57-7ec6-9759-2fb6a282d24b not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject query with empty placeId
  Input: { placeId: "" }
  Output: { error: "Place ID is required." }
  ✓ Correctly rejected empty placeId

✅ All getPlace requirements verified
----- output end -----
Action: getPlace retrieves correct place information and enforces requirements ... ok (650ms)

ok | 7 passed | 0 failed (5s)

(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % 