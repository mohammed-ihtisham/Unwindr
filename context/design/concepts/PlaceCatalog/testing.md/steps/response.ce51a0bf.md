---
timestamp: 'Fri Oct 17 2025 15:17:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_151742.64910b27.md]]'
content_id: ce51a0bf7d7565a10ae8f6ca144c20e0eb033ca6cc83ee29d85a26e3a173a6e2
---

# response:

```typescript
// file: src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
import { Collection, Db, ObjectId } from "npm:mongodb";
import { assertEquals, assertNotEquals, assertArrayIncludes, assertExists } from "jsr:@std/assert";
import { testDb, freshID } from "@utils/database.ts";
import PlaceCatalogConcept from "./PlaceCatalogConcept.ts";
import { ID } from "@utils/types.ts";

// Helper for coordinate validation (re-using from concept for consistency)
function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

Deno.test("PlaceCatalogConcept functionality tests", async (t) => {
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  // Define dummy users for testing purposes
  const testUser1 = "user:Alice" as ID;
  const testModerator = "user:BobModerator" as ID;

  await t.step("should successfully seed places if none exist", async () => {
    console.log("--- Test: Seeding places ---");
    const initialCount = await placeCatalog.places.countDocuments();
    assertEquals(initialCount, 0, "Collection should be empty initially.");

    console.log("Action: Calling seedPlaces with valid coordinates.");
    const result = await placeCatalog.seedPlaces({ centerLat: 0, centerLng: 0, radius: 10 });
    assertEquals(result, {}, "Seeding should return empty object on success.");

    const seededCount = await placeCatalog.places.countDocuments();
    assertNotEquals(seededCount, 0, "Places should be seeded after the action.");
    console.log(`Effect: ${seededCount} places seeded.`);

    // Try seeding again - should not add more places
    console.log("Action: Calling seedPlaces again.");
    const result2 = await placeCatalog.seedPlaces({ centerLat: 0, centerLng: 0, radius: 10 });
    assertEquals(result2, {}, "Second seeding attempt should still return empty object.");
    const finalCount = await placeCatalog.places.countDocuments();
    assertEquals(finalCount, seededCount, "No new places should be added on second seed.");
    console.log(`Effect: Collection count remains ${finalCount}, no re-seeding occurred.`);
  });

  await t.step("should fail to seed places with invalid coordinates or radius", async () => {
    console.log("--- Test: Invalid seeding ---");
    console.log("Action: Calling seedPlaces with invalid radius.");
    const resultInvalidRadius = await placeCatalog.seedPlaces({ centerLat: 0, centerLng: 0, radius: 0 });
    assertEquals(resultInvalidRadius, { error: "Invalid coordinates or radius must be positive." }, "Should return error for invalid radius.");
    console.log(`Effect: Received error: ${JSON.stringify(resultInvalidRadius)}`);

    console.log("Action: Calling seedPlaces with invalid latitude.");
    const resultInvalidLat = await placeCatalog.seedPlaces({ centerLat: 91, centerLng: 0, radius: 10 });
    assertEquals(resultInvalidLat, { error: "Invalid coordinates or radius must be positive." }, "Should return error for invalid latitude.");
    console.log(`Effect: Received error: ${JSON.stringify(resultInvalidLat)}`);
  });

  let userAddedPlaceId: ID; // To store ID for subsequent tests

  await t.step("should successfully add a new user-created place", async () => {
    console.log("--- Test: Adding a place ---");
    const initialCount = await placeCatalog.places.countDocuments();

    console.log("Action: Calling addPlace with valid data.");
    const result = await placeCatalog.addPlace({
      userId: testUser1,
      name: "User's Favorite Spot",
      address: "42 Wallaby Way",
      category: "Recreation",
      lat: 34.0522,
      lng: -118.2437,
    });
    assertExists((result as { placeId: ID }).placeId, "Should return a place ID on success.");
    userAddedPlaceId = (result as { placeId: ID }).placeId;
    console.log(`Effect: New place added with ID: ${userAddedPlaceId}`);

    const finalCount = await placeCatalog.places.countDocuments();
    assertEquals(finalCount, initialCount + 1, "Place count should increment by one.");

    const addedPlace = await placeCatalog.places.findOne({ _id: userAddedPlaceId });
    assertExists(addedPlace, "The added place should exist in the database.");
    assertEquals(addedPlace?.name, "User's Favorite Spot");
    assertEquals(addedPlace?.addedBy, testUser1);
    assertEquals(addedPlace?.verified, false, "User-added place should initially be unverified.");
    assertEquals(addedPlace?.source, "user_added", "Source should be 'user_added'.");
    assertEquals(addedPlace?.location.coordinates[0], -118.2437);
    assertEquals(addedPlace?.location.coordinates[1], 34.0522);
    console.log("Verification: Added place details match expectations.");
  });

  await t.step("should fail to add a place with invalid inputs", async () => {
    console.log("--- Test: Invalid place addition ---");
    console.log("Action: Calling addPlace with empty name.");
    const resultEmptyName = await placeCatalog.addPlace({
      userId: testUser1,
      name: "",
      address: "123 Test St",
      category: "Test",
      lat: 0,
      lng: 0,
    });
    assertEquals(resultEmptyName, { error: "Place name cannot be empty." }, "Should return error for empty name.");
    console.log(`Effect: Received error: ${JSON.stringify(resultEmptyName)}`);

    console.log("Action: Calling addPlace with invalid coordinates.");
    const resultInvalidCoords = await placeCatalog.addPlace({
      userId: testUser1,
      name: "Bad Coord Place",
      address: "123 Test St",
      category: "Test",
      lat: 900,
      lng: 0,
    });
    assertEquals(resultInvalidCoords, { error: "Invalid coordinates." }, "Should return error for invalid coordinates.");
    console.log(`Effect: Received error: ${JSON.stringify(resultInvalidCoords)}`);

    console.log("Action: Calling addPlace with no userId.");
    const resultNoUser = await placeCatalog.addPlace({
      userId: "" as ID, // Simulate missing user
      name: "No User Place",
      address: "123 Test St",
      category: "Test",
      lat: 0,
      lng: 0,
    });
    assertEquals(resultNoUser, { error: "User ID is required." }, "Should return error for missing userId.");
    console.log(`Effect: Received error: ${JSON.stringify(resultNoUser)}`);
  });

  await t.step("should successfully verify an unverified place", async () => {
    console.log("--- Test: Verifying a place ---");
    // Ensure the userAddedPlaceId from previous step exists and is unverified
    const beforeVerify = await placeCatalog.places.findOne({ _id: userAddedPlaceId });
    assertExists(beforeVerify, "Place must exist before verification.");
    assertEquals(beforeVerify?.verified, false, "Place should be unverified before test.");

    console.log(`Action: Calling verifyPlace for ID ${userAddedPlaceId} by moderator ${testModerator}.`);
    const result = await placeCatalog.verifyPlace({ placeId: userAddedPlaceId, moderatorId: testModerator });
    assertEquals(result, {}, "Verification should return empty object on success.");
    console.log("Effect: Place verification action performed.");

    const afterVerify = await placeCatalog.places.findOne({ _id: userAddedPlaceId });
    assertExists(afterVerify, "Place should still exist after verification.");
    assertEquals(afterVerify?.verified, true, "Place should be marked as verified after action.");
    console.log("Verification: Place is now verified.");
  });

  await t.step("should fail to verify a non-existent or already verified place", async () => {
    console.log("--- Test: Invalid verification ---");
    const nonExistentId = freshID();
    console.log(`Action: Calling verifyPlace for non-existent ID ${nonExistentId}.`);
    const resultNotFound = await placeCatalog.verifyPlace({ placeId: nonExistentId, moderatorId: testModerator });
    assertEquals(resultNotFound, { error: `Place with ID ${nonExistentId} not found.` }, "Should return error for non-existent place.");
    console.log(`Effect: Received error: ${JSON.stringify(resultNotFound)}`);

    console.log(`Action: Calling verifyPlace again for already verified place ID ${userAddedPlaceId}.`);
    const resultAlreadyVerified = await placeCatalog.verifyPlace({ placeId: userAddedPlaceId, moderatorId: testModerator });
    assertEquals(resultAlreadyVerified, { error: `Place with ID ${userAddedPlaceId} is already verified.` }, "Should return error for already verified place.");
    console.log(`Effect: Received error: ${JSON.stringify(resultAlreadyVerified)}`);

    console.log("Action: Calling verifyPlace with no moderatorId.");
    const resultNoModerator = await placeCatalog.verifyPlace({ placeId: userAddedPlaceId, moderatorId: "" as ID });
    assertEquals(resultNoModerator, { error: "Moderator ID is required for verification." }, "Should return error for missing moderatorId.");
    console.log(`Effect: Received error: ${JSON.stringify(resultNoModerator)}`);
  });

  await t.step("should successfully update an existing place", async () => {
    console.log("--- Test: Updating a place ---");
    const beforeUpdate = await placeCatalog.places.findOne({ _id: userAddedPlaceId });
    assertExists(beforeUpdate, "Place must exist before update.");
    assertEquals(beforeUpdate?.name, "User's Favorite Spot");
    assertEquals(beforeUpdate?.address, "42 Wallaby Way");

    const newName = "User's NEW Favorite Spot";
    const newAddress = "10 Downing Street";
    console.log(`Action: Calling updatePlace for ID ${userAddedPlaceId} by user ${testUser1}.`);
    const result = await placeCatalog.updatePlace({
      placeId: userAddedPlaceId,
      name: newName,
      address: newAddress,
      userId: testUser1,
    });
    assertEquals(result, {}, "Update should return empty object on success.");
    console.log("Effect: Place update action performed.");

    const afterUpdate = await placeCatalog.places.findOne({ _id: userAddedPlaceId });
    assertExists(afterUpdate, "Place should still exist after update.");
    assertEquals(afterUpdate?.name, newName, "Place name should be updated.");
    assertEquals(afterUpdate?.address, newAddress, "Place address should be updated.");
    console.log("Verification: Place details updated successfully.");
  });

  await t.step("should fail to update a non-existent place or with invalid inputs", async () => {
    console.log("--- Test: Invalid place update ---");
    const nonExistentId = freshID();
    console.log(`Action: Calling updatePlace for non-existent ID ${nonExistentId}.`);
    const resultNotFound = await placeCatalog.updatePlace({
      placeId: nonExistentId,
      name: "New Name",
      address: "New Address",
      userId: testUser1,
    });
    assertEquals(resultNotFound, { error: `Place with ID ${nonExistentId} not found.` }, "Should return error for non-existent place.");
    console.log(`Effect: Received error: ${JSON.stringify(resultNotFound)}`);

    console.log(`Action: Calling updatePlace for ID ${userAddedPlaceId} with empty name.`);
    const resultEmptyName = await placeCatalog.updatePlace({
      placeId: userAddedPlaceId,
      name: "",
      address: "Valid Address",
      userId: testUser1,
    });
    assertEquals(resultEmptyName, { error: "Place name cannot be empty." }, "Should return error for empty name.");
    console.log(`Effect: Received error: ${JSON.stringify(resultEmptyName)}`);

    console.log(`Action: Calling updatePlace for ID ${userAddedPlaceId} with no userId.`);
    const resultNoUser = await placeCatalog.updatePlace({
      placeId: userAddedPlaceId,
      name: "Valid Name",
      address: "Valid Address",
      userId: "" as ID,
    });
    assertEquals(resultNoUser, { error: "User ID is required." }, "Should return error for missing userId.");
    console.log(`Effect: Received error: ${JSON.stringify(resultNoUser)}`);

    console.log(`Action: Calling updatePlace for ID ${userAddedPlaceId} with same details.`);
    const placeBefore = await placeCatalog.places.findOne({_id: userAddedPlaceId});
    const resultSameDetails = await placeCatalog.updatePlace({
        placeId: userAddedPlaceId,
        name: placeBefore!.name,
        address: placeBefore!.address,
        userId: testUser1,
    });
    assertEquals(resultSameDetails, { error: `Place with ID ${userAddedPlaceId} details are already up-to-date.` }, "Should return error if no changes are made.");
    console.log(`Effect: Received error: ${JSON.stringify(resultSameDetails)}`);
  });

  let seededPlaceId: ID; // To store a seeded place ID

  await t.step("should retrieve places within a specified area", async () => {
    console.log("--- Test: Retrieving places in area ---");
    // Get a seeded place to use as reference
    const oneSeededPlace = await placeCatalog.places.findOne({ source: "provider" });
    assertExists(oneSeededPlace, "There should be at least one seeded place for this test.");
    seededPlaceId = oneSeededPlace._id;
    const { coordinates: [lng, lat] } = oneSeededPlace.location;

    console.log(`Action: Calling _getPlacesInArea around seeded place (${lat}, ${lng}) with radius 1km.`);
    const result = await placeCatalog._getPlacesInArea({ centerLat: lat, centerLng: lng, radius: 1 });
    assertExists((result as { places: ID[] }).places, "Should return an array of place IDs.");
    const foundPlaces = (result as { places: ID[] }).places;
    assertArrayIncludes(foundPlaces, [seededPlaceId], "Seeded place should be in the list.");
    assertArrayIncludes(foundPlaces, [userAddedPlaceId], "User-added place should also be in the list if in range.");
    console.log(`Effect: Found ${foundPlaces.length} places in the area, including expected ones.`);

    // Test with a larger radius to ensure more places are found (if they exist)
    console.log(`Action: Calling _getPlacesInArea with a larger radius (100km).`);
    const resultLargeRadius = await placeCatalog._getPlacesInArea({ centerLat: lat, centerLng: lng, radius: 100 });
    const allPlaces = await placeCatalog.places.find({}, { projection: { _id: 1 } }).toArray();
    assertEquals((resultLargeRadius as { places: ID[] }).places.length, allPlaces.length, "Larger radius should ideally find all existing places.");
  });

  await t.step("should fail to retrieve places with invalid area inputs", async () => {
    console.log("--- Test: Invalid area query ---");
    console.log("Action: Calling _getPlacesInArea with invalid latitude.");
    const resultInvalidLat = await placeCatalog._getPlacesInArea({ centerLat: 91, centerLng: 0, radius: 1 });
    assertEquals(resultInvalidLat, { error: "Invalid coordinates or radius must be positive." }, "Should return error for invalid latitude.");
    console.log(`Effect: Received error: ${JSON.stringify(resultInvalidLat)}`);

    console.log("Action: Calling _getPlacesInArea with zero radius.");
    const resultZeroRadius = await placeCatalog._getPlacesInArea({ centerLat: 0, centerLng: 0, radius: 0 });
    assertEquals(resultZeroRadius, { error: "Invalid coordinates or radius must be positive." }, "Should return error for zero radius.");
    console.log(`Effect: Received error: ${JSON.stringify(resultZeroRadius)}`);
  });

  await t.step("should retrieve full details of a specific place", async () => {
    console.log("--- Test: Retrieving place details ---");
    console.log(`Action: Calling _getPlaceDetails for ID ${userAddedPlaceId}.`);
    const result = await placeCatalog._getPlaceDetails({ placeId: userAddedPlaceId });
    assertExists((result as { place: any }).place, "Should return place details.");
    const placeDetails = (result as { place: any }).place;

    assertEquals(placeDetails.id, userAddedPlaceId, "Returned ID should match requested ID.");
    assertEquals(placeDetails.name, "User's NEW Favorite Spot"); // From update test
    assertEquals(placeDetails.address, "10 Downing Street"); // From update test
    assertEquals(placeDetails.addedBy, testUser1);
    assertEquals(placeDetails.verified, true); // From verify test
    assertExists(placeDetails.location);
    console.log(`Effect: Retrieved details for place ${userAddedPlaceId}: ${JSON.stringify(placeDetails)}`);
  });

  await t.step("should fail to retrieve details for a non-existent place", async () => {
    console.log("--- Test: Invalid place details query ---");
    const nonExistentId = freshID();
    console.log(`Action: Calling _getPlaceDetails for non-existent ID ${nonExistentId}.`);
    const resultNotFound = await placeCatalog._getPlaceDetails({ placeId: nonExistentId });
    assertEquals(resultNotFound, { error: `Place with ID ${nonExistentId} not found.` }, "Should return error for non-existent place.");
    console.log(`Effect: Received error: ${JSON.stringify(resultNotFound)}`);

    console.log("Action: Calling _getPlaceDetails with empty placeId.");
    const resultEmptyId = await placeCatalog._getPlaceDetails({ placeId: "" as ID });
    assertEquals(resultEmptyId, { error: "Place ID is required." }, "Should return error for empty placeId.");
    console.log(`Effect: Received error: ${JSON.stringify(resultEmptyId)}`);
  });

  await client.close();
});

// # trace:
// This trace demonstrates how the PlaceCatalog concept fulfills its principle:
// "users can add, verify, and update places; system can seed from provider"

Deno.test("PlaceCatalog Principle Trace: Add, Verify, Update, Discover", async () => {
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  const traceUser = "user:Charlie" as ID;
  const traceModerator = "user:DianaModerator" as ID;
  const centerLat = 34.0522;
  const centerLng = -118.2437;
  const searchRadius = 50; // km

  console.log("\n--- TRACE START: PlaceCatalog Principle Fulfillment ---");

  // Step 1: System can seed from provider
  console.log("\n1. SYSTEM SEEDS PLACES (from provider)");
  console.log(`Action: Calling seedPlaces at (${centerLat}, ${centerLng}) with radius ${searchRadius}km.`);
  const seedResult = await placeCatalog.seedPlaces({ centerLat, centerLng, radius: searchRadius });
  assertEquals(seedResult, {}, "Seeding should be successful.");
  const initialSeededPlaces = await placeCatalog.places.find({ source: "provider" }).toArray();
  assertNotEquals(initialSeededPlaces.length, 0, "At least one provider place should be seeded.");
  const exampleSeededPlaceId = initialSeededPlaces[0]._id;
  console.log(`Effect: System seeded ${initialSeededPlaces.length} places. Example ID: ${exampleSeededPlaceId}`);

  // Step 2: Users can add places
  console.log("\n2. USER ADDS A NEW PLACE");
  const newPlaceName = "Charlie's Bookstore";
  const newPlaceAddress = "100 Pine Street";
  const newPlaceCategory = "Bookstore";
  const newPlaceLat = centerLat + 0.001; // Slightly offset
  const newPlaceLng = centerLng + 0.001; // Slightly offset

  console.log(`Action: User '${traceUser}' adding a place: '${newPlaceName}' at (${newPlaceLat}, ${newPlaceLng}).`);
  const addResult = await placeCatalog.addPlace({
    userId: traceUser,
    name: newPlaceName,
    address: newPlaceAddress,
    category: newPlaceCategory,
    lat: newPlaceLat,
    lng: newPlaceLng,
  });
  const addedPlaceId = (addResult as { placeId: ID }).placeId;
  assertExists(addedPlaceId, "New place should be added.");
  console.log(`Effect: User '${traceUser}' added place with ID: ${addedPlaceId}.`);

  const addedPlaceDetails = await placeCatalog._getPlaceDetails({ placeId: addedPlaceId });
  assertEquals((addedPlaceDetails as any).place.name, newPlaceName);
  assertEquals((addedPlaceDetails as any).place.addedBy, traceUser);
  assertEquals((addedPlaceDetails as any).place.verified, false, "New place is initially unverified.");
  console.log("Verification: Added place details are correct and it's unverified.");

  // Step 3: Users (with moderation privileges) can verify places
  console.log("\n3. MODERATOR VERIFIES THE USER-ADDED PLACE");
  console.log(`Action: Moderator '${traceModerator}' verifying place ID: ${addedPlaceId}.`);
  const verifyResult = await placeCatalog.verifyPlace({ placeId: addedPlaceId, moderatorId: traceModerator });
  assertEquals(verifyResult, {}, "Place should be successfully verified.");
  console.log("Effect: Verification action completed.");

  const verifiedPlaceDetails = await placeCatalog._getPlaceDetails({ placeId: addedPlaceId });
  assertEquals((verifiedPlaceDetails as any).place.verified, true, "Place should now be verified.");
  console.log("Verification: Place is now marked as verified.");

  // Step 4: Users can update places
  console.log("\n4. USER UPDATES A PLACE");
  const updatedPlaceName = "Charlie's NEW & Improved Bookstore";
  const updatedPlaceAddress = "200 Oak Street";

  console.log(`Action: User '${traceUser}' updating place ID: ${addedPlaceId} to '${updatedPlaceName}'.`);
  const updateResult = await placeCatalog.updatePlace({
    placeId: addedPlaceId,
    name: updatedPlaceName,
    address: updatedPlaceAddress,
    userId: traceUser,
  });
  assertEquals(updateResult, {}, "Place should be successfully updated.");
  console.log("Effect: Update action completed.");

  const updatedPlaceDetails = await placeCatalog._getPlaceDetails({ placeId: addedPlaceId });
  assertEquals((updatedPlaceDetails as any).place.name, updatedPlaceName, "Place name should be updated.");
  assertEquals((updatedPlaceDetails as any).place.address, updatedPlaceAddress, "Place address should be updated.");
  console.log("Verification: Place details reflect the update.");

  // Step 5: Discoverability - Get places in an area
  console.log("\n5. DISCOVERING PLACES IN AN AREA");
  console.log(`Action: Querying for places in area around (${centerLat}, ${centerLng}) with radius ${searchRadius}km.`);
  const queryResult = await placeCatalog._getPlacesInArea({ centerLat, centerLng, radius: searchRadius });
  const discoveredPlaceIds = (queryResult as { places: ID[] }).places;
  assertArrayIncludes(discoveredPlaceIds, [exampleSeededPlaceId], "Seeded place should be discoverable.");
  assertArrayIncludes(discoveredPlaceIds, [addedPlaceId], "User-added and updated place should be discoverable.");
  console.log(`Effect: Found ${discoveredPlaceIds.length} places. Both the seeded and user-managed places are present.`);
  console.log("Verification: All relevant places are discoverable.");

  console.log("\n--- TRACE END: Principle Fulfillment Demonstrated ---");

  await client.close();
});
```
