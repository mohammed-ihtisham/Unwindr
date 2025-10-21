(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:place
Task test:place deno test --allow-read --allow-write --allow-env --allow-net --allow-sys src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
running 8 tests from ./src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
Principle: Users can add, set verification status, and update places; system can seed from provider ...
------- output -------

=== Testing Principle Fulfillment ===

[ACTION] bulkImportOSMPlaces - System seeds places from provider
  Input: { osmDataPath: "./src/concepts/PlaceCatalog/sample-places.geojson" }
  Output: {}
  ✓ Seeding completed successfully

[VERIFY] Check seeded places
  ✓ System seeded 6 places. Example ID: 019a083e-6f2e-748f-b5ac-5b525c83a99f

[ACTION] addPlace - User adds a new place
  Input: { userId: user:Charlie, name: "Charlie's Bookstore", address: "100 Pine Street", category: "Bookstore", lat: 42.3561, lng: -71.0646 }
  Output: { placeId: "019a083e-6fb9-7d3c-9eb1-c5e8538b573f" }
  ✓ User added place with ID: 019a083e-6fb9-7d3c-9eb1-c5e8538b573f

[VERIFY] Check added place details
  ✓ Added place details are correct and it's unverified

[ACTION] setPlaceVerificationStatus - Moderator verifies the user-added place
  Input: { placeId: 019a083e-6fb9-7d3c-9eb1-c5e8538b573f, moderatorId: user:DianaModerator, isVerified: true }
  Output: {}
  ✓ Verification action completed

[VERIFY] Check place is now verified
  ✓ Place is now marked as verified

[ACTION] updatePlace - User updates a place
  Input: { placeId: 019a083e-6fb9-7d3c-9eb1-c5e8538b573f, name: "Charlie's NEW & Improved Bookstore", address: "200 Oak Street", userId: user:Charlie }
  Output: {}
  ✓ Update action completed

[VERIFY] Check place details reflect the update
  ✓ Place details reflect the update

[QUERY] _getPlacesInArea - Discovering places in an area
  Input: { centerLat: 42.3551, centerLng: -71.0656, radius: 50 }
  Output: {
  places: [
    "019a083e-6fb9-7d3c-9eb1-c5e8538b573f",
    "019a083e-6f2e-748f-b5ac-5b525c83a99f",
    "019a083e-6f41-7058-a900-b094e1c73714",
    "019a083e-6f56-7f6b-8d98-17975fa43f7a",
    "019a083e-6f68-7246-a2c4-4f01749bfcfe",
    "019a083e-6f7a-705b-88f7-d1e3387bfbed",
    "019a083e-6f8e-7c21-98fd-bcc37f313d80"
  ]
}
  ✓ Found 7 places. Both seeded and user-managed places are present

✅ Principle demonstrated: Users can add, set verification status, and update places; system can seed from provider
----- output end -----
Principle: Users can add, set verification status, and update places; system can seed from provider ... ok (933ms)
Action: bulkImportOSMPlaces successfully imports from GeoJSON file ...
------- output -------

=== Testing bulkImportOSMPlaces Action ===

[TEST] Bulk import places from sample GeoJSON file
  ✓ Collection is empty initially
  Input: { osmDataPath: "./src/concepts/PlaceCatalog/sample-places.geojson" }
  Output: {}
  ✓ Bulk import completed without errors
  ✓ 6 places imported

[VERIFY] Check imported place details
  ✓ Coffee shop imported with correct details
  ✓ Park imported with correct category
  ✓ Restaurant imported with correct category

[TEST] Reject bulk import with invalid file path
  Input: { osmDataPath: "nonexistent.geojson" }
  Output: {
  error: "Failed to import OSM data: No such file or directory (os error 2): readfile 'nonexistent.geojson'"
}
  ✓ Correctly rejected invalid file path

[TEST] Reject bulk import with invalid GeoJSON format
  Input: { osmDataPath: "./src/concepts/PlaceCatalog/invalid-test.json" }
  Output: { error: "Invalid GeoJSON format: missing features array" }
  ✓ Correctly rejected invalid GeoJSON format

✅ All bulkImportOSMPlaces requirements verified
----- output end -----
Action: bulkImportOSMPlaces successfully imports from GeoJSON file ... ok (840ms)
Action: seedPlaces successfully seeds places and enforces requirements ...
------- output -------

=== Testing seedPlaces Action ===
Note: This test makes real API calls to Overpass API and may be slow.

[TEST] Seed places from Overpass API successfully
  ✓ Collection is empty initially
  Input: {} (seeds Cambridge and Boston areas)
'Action: seedPlaces successfully seeds places and enforces requirements' has been running for over (1m0s)
  Output: {}
  ✓ Seeding completed without errors
  ✓ 3129 places seeded from Overpass API

[TEST] Prevent duplicate places on second seed
  Input: {} (seeds Cambridge and Boston areas)
  Output: {}
  ✓ Collection count: 3129 (duplicates were prevented)

[TEST] Skip seeding when database already has places
  Input: {} (seeds Cambridge and Boston areas)
  Output: {}
  ✓ Correctly skipped seeding when database has places

[TEST] Skip seeding when database already has places
  Input: {} (seeds Cambridge and Boston areas)
  Output: {}
  ✓ Correctly skipped seeding when database has places

✅ All seedPlaces requirements verified
----- output end -----
Action: seedPlaces successfully seeds places and enforces requirements ... ok (1m53s)
Action: addPlace successfully adds places and enforces requirements ...
------- output -------

=== Testing addPlace Action ===

[TEST] Add a new place successfully
  Input: { userId: user:Alice, name: "User's Favorite Spot", address: "42 Wallaby Way", category: "Recreation", lat: 34.0522, lng: -118.2437 }
  Output: { placeId: "019a0840-31cc-76c2-a7b8-536fdfcd5ba1" }
  ✓ New place added with ID: 019a0840-31cc-76c2-a7b8-536fdfcd5ba1

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
Action: addPlace successfully adds places and enforces requirements ... ok (908ms)
Action: setPlaceVerificationStatus allows moderators to set verification status and enforces requirements ...
------- output -------

=== Testing setPlaceVerificationStatus Action ===

[SETUP] Add an unverified place
  ✓ Place added with ID: 019a0840-33f9-74f4-ba0f-3036b4c10ee2

[TEST] Set verification status to true (verified)
  ✓ Place is currently unverified
  Input: { placeId: 019a0840-33f9-74f4-ba0f-3036b4c10ee2, moderatorId: user:BobModerator, isVerified: true }
  Output: {}
  ✓ Place verification action performed

[VERIFY] Check place is now verified
  ✓ Place is now verified

[TEST] Set verification status to false (unverified/deactivated)
  Input: { placeId: 019a0840-33f9-74f4-ba0f-3036b4c10ee2, moderatorId: user:BobModerator, isVerified: false }
  Output: {}
  ✓ Place unverification action performed

[VERIFY] Check place is now unverified
  ✓ Place is now unverified

[TEST] Reject setting status on non-existent place
  Input: { placeId: 019a0840-3524-75b4-b9c1-cfbf2419f4d2, moderatorId: user:BobModerator, isVerified: true }
  Output: {
  error: "Place with ID 019a0840-3524-75b4-b9c1-cfbf2419f4d2 not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject setting status when place already has that status
  Input: { placeId: 019a0840-33f9-74f4-ba0f-3036b4c10ee2, moderatorId: user:BobModerator, isVerified: false }
  Output: {
  error: "Place with ID 019a0840-33f9-74f4-ba0f-3036b4c10ee2 already has verification status: false."
}
  ✓ Correctly rejected setting same status

[TEST] Reject setting status with no moderatorId
  Input: { placeId: 019a0840-33f9-74f4-ba0f-3036b4c10ee2, moderatorId: "", isVerified: true }
  Output: { error: "Moderator ID is required for verification." }
  ✓ Correctly rejected missing moderatorId

✅ All setPlaceVerificationStatus requirements verified
----- output end -----
Action: setPlaceVerificationStatus allows moderators to set verification status and enforces requirements ... ok (823ms)
Action: updatePlace allows users to update places and enforces requirements ...
------- output -------

=== Testing updatePlace Action ===

[SETUP] Add a place for update tests
  ✓ Place added with ID: 019a0840-370d-7742-b15a-db987b8b5105

[TEST] Update a place successfully
  ✓ Verified original place details
  Input: { placeId: 019a0840-370d-7742-b15a-db987b8b5105, name: "Updated Name", address: "Updated Address", userId: user:Alice }
  Output: {}
  ✓ Place update action performed

[VERIFY] Check place details are updated
  ✓ Place details updated successfully

[TEST] Reject updating non-existent place
  Input: { placeId: 019a0840-37e4-70ae-b5b8-dfdf8d939f5c, name: "New Name", address: "New Address", userId: user:Alice }
  Output: {
  error: "Place with ID 019a0840-37e4-70ae-b5b8-dfdf8d939f5c not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject updating with empty name
  Input: { placeId: 019a0840-370d-7742-b15a-db987b8b5105, name: "", address: "Valid Address", userId: user:Alice }
  Output: { error: "Place name cannot be empty." }
  ✓ Correctly rejected empty name

[TEST] Reject updating with no userId
  Input: { placeId: 019a0840-370d-7742-b15a-db987b8b5105, name: "Valid Name", address: "Valid Address", userId: "" }
  Output: { error: "User ID is required." }
  ✓ Correctly rejected missing userId

[TEST] Reject updating with no changes
  Input: { placeId: 019a0840-370d-7742-b15a-db987b8b5105, name: "Updated Name", address: "Updated Address", userId: user:Alice }
  Output: {
  error: "Place with ID 019a0840-370d-7742-b15a-db987b8b5105 details are already up-to-date."
}
  ✓ Correctly rejected update with no changes

✅ All updatePlace requirements verified
----- output end -----
Action: updatePlace allows users to update places and enforces requirements ... ok (718ms)
Query: _getPlacesInArea retrieves places within specified area and enforces requirements ...
------- output -------

=== Testing _getPlacesInArea Query ===

[SETUP] Seed places for area query tests
  ✓ Seeded places available, using reference place at (42.3551, -71.0656)

[SETUP] Add a user place for query tests
  ✓ User place added with ID: 019a0840-3ba5-7e87-bbf7-0789cdd87116

[TEST] Retrieve places in area successfully
  Input: { centerLat: 42.3551, centerLng: -71.0656, radius: 1 }
  Output: {
  places: [
    "019a0840-3ba5-7e87-bbf7-0789cdd87116",
    "019a0840-3b1f-7e78-bc82-bce7ea8a9b1f",
    "019a0840-3b33-7ef9-82b8-56ee94522b0d",
    "019a0840-3b46-7823-8984-6e2a03a91d4d",
    "019a0840-3b58-769d-8712-02415c067176",
    "019a0840-3b6b-7678-82e8-3d71d50b1dc4",
    "019a0840-3b7d-76e4-99d8-f1cfbbd65a1a"
  ]
}
  ✓ Found 7 places in the area, including expected ones

[TEST] Retrieve places with larger radius
  Input: { centerLat: 42.3551, centerLng: -71.0656, radius: 100 }
  Output: {
  places: [
    "019a0840-3ba5-7e87-bbf7-0789cdd87116",
    "019a0840-3b1f-7e78-bc82-bce7ea8a9b1f",
    "019a0840-3b33-7ef9-82b8-56ee94522b0d",
    "019a0840-3b46-7823-8984-6e2a03a91d4d",
    "019a0840-3b58-769d-8712-02415c067176",
    "019a0840-3b6b-7678-82e8-3d71d50b1dc4",
    "019a0840-3b7d-76e4-99d8-f1cfbbd65a1a"
  ]
}
  ✓ Larger radius found 7 places (all in database)

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
Query: _getPlacesInArea retrieves places within specified area and enforces requirements ... ok (986ms)
Action: getPlace retrieves correct place information and enforces requirements ...
------- output -------

=== Testing getPlace Action ===

[SETUP] Add a place for details query tests
  ✓ Place added with ID: 019a0840-3de3-7d8c-9856-13ac5e9388d2

[SETUP] Verify the place
  ✓ Place verified

[SETUP] Update the place
  ✓ Place updated

[TEST] Retrieve place details successfully
  Input: { placeId: 019a0840-3de3-7d8c-9856-13ac5e9388d2 }
  Output: {
  place: {
    id: "019a0840-3de3-7d8c-9856-13ac5e9388d2",
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
  Input: { placeId: 019a0840-3f07-751d-9cd7-98c786c0bb2b }
  Output: {
  error: "Place with ID 019a0840-3f07-751d-9cd7-98c786c0bb2b not found."
}
  ✓ Correctly rejected non-existent place

[TEST] Reject query with empty placeId
  Input: { placeId: "" }
  Output: { error: "Place ID is required." }
  ✓ Correctly rejected empty placeId

✅ All getPlace requirements verified
----- output end -----
Action: getPlace retrieves correct place information and enforces requirements ... ok (812ms)

ok | 8 passed | 0 failed (1m59s)

(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % 