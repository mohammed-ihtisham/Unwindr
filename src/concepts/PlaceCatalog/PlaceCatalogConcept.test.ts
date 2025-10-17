import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertNotEquals,
} from "jsr:@std/assert";
import { freshID, testDb } from "@utils/database.ts";
import PlaceCatalogConcept from "./PlaceCatalogConcept.ts";
import { ID } from "@utils/types.ts";

// Helper for checking if a result is an error
const isError = (result: unknown): result is { error: string } =>
  result !== null && typeof result === "object" && "error" in result;

// Principle: users can add, verify, and update places; system can seed from provider
Deno.test("Principle: Users can add, verify, and update places; system can seed from provider", async () => {
  console.log("\n=== Testing Principle Fulfillment ===");
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  try {
    const traceUser = "user:Charlie" as ID;
    const traceModerator = "user:DianaModerator" as ID;
    const centerLat = 34.0522;
    const centerLng = -118.2437;
    const searchRadius = 50; // km

    // Step 1: System can seed from provider
    console.log("\n[ACTION] seedPlaces - System seeds places from provider");
    console.log(
      `  Input: { centerLat: ${centerLat}, centerLng: ${centerLng}, radius: ${searchRadius} }`,
    );
    const seedResult = await placeCatalog.seedPlaces({
      centerLat,
      centerLng,
      radius: searchRadius,
    });
    console.log("  Output:", seedResult);
    assertEquals(isError(seedResult), false, "Seeding should be successful.");
    console.log("  ✓ Seeding completed successfully");

    console.log("\n[VERIFY] Check seeded places");
    const initialSeededPlaces = await placeCatalog.places.find({
      source: "provider",
    }).toArray();
    assertNotEquals(
      initialSeededPlaces.length,
      0,
      "At least one provider place should be seeded.",
    );
    const exampleSeededPlaceId = initialSeededPlaces[0]._id;
    console.log(
      `  ✓ System seeded ${initialSeededPlaces.length} places. Example ID: ${exampleSeededPlaceId}`,
    );

    // Step 2: Users can add places
    console.log("\n[ACTION] addPlace - User adds a new place");
    const newPlaceName = "Charlie's Bookstore";
    const newPlaceAddress = "100 Pine Street";
    const newPlaceCategory = "Bookstore";
    const newPlaceLat = centerLat + 0.001;
    const newPlaceLng = centerLng + 0.001;
    console.log(
      `  Input: { userId: ${traceUser}, name: "${newPlaceName}", address: "${newPlaceAddress}", category: "${newPlaceCategory}", lat: ${newPlaceLat}, lng: ${newPlaceLng} }`,
    );
    const addResult = await placeCatalog.addPlace({
      userId: traceUser,
      name: newPlaceName,
      address: newPlaceAddress,
      category: newPlaceCategory,
      lat: newPlaceLat,
      lng: newPlaceLng,
    });
    console.log("  Output:", addResult);
    assertEquals(isError(addResult), false, "Place should be added.");
    const addedPlaceId = (addResult as { placeId: ID }).placeId;
    assertExists(addedPlaceId, "New place should be added.");
    console.log(`  ✓ User added place with ID: ${addedPlaceId}`);

    console.log("\n[VERIFY] Check added place details");
    const addedPlaceDetails = await placeCatalog._getPlaceDetails({
      placeId: addedPlaceId,
    });
    assertEquals(
      (addedPlaceDetails as { place: { name: string } }).place.name,
      newPlaceName,
    );
    assertEquals(
      (addedPlaceDetails as { place: { addedBy: ID } }).place.addedBy,
      traceUser,
    );
    assertEquals(
      (addedPlaceDetails as { place: { verified: boolean } }).place.verified,
      false,
      "New place is initially unverified.",
    );
    console.log("  ✓ Added place details are correct and it's unverified");

    // Step 3: Users (with moderation privileges) can verify places
    console.log(
      "\n[ACTION] verifyPlace - Moderator verifies the user-added place",
    );
    console.log(
      `  Input: { placeId: ${addedPlaceId}, moderatorId: ${traceModerator} }`,
    );
    const verifyResult = await placeCatalog.verifyPlace({
      placeId: addedPlaceId,
      moderatorId: traceModerator,
    });
    console.log("  Output:", verifyResult);
    assertEquals(isError(verifyResult), false, "Place should be verified.");
    console.log("  ✓ Verification action completed");

    console.log("\n[VERIFY] Check place is now verified");
    const verifiedPlaceDetails = await placeCatalog._getPlaceDetails({
      placeId: addedPlaceId,
    });
    assertEquals(
      (verifiedPlaceDetails as { place: { verified: boolean } }).place.verified,
      true,
      "Place should now be verified.",
    );
    console.log("  ✓ Place is now marked as verified");

    // Step 4: Users can update places
    console.log("\n[ACTION] updatePlace - User updates a place");
    const updatedPlaceName = "Charlie's NEW & Improved Bookstore";
    const updatedPlaceAddress = "200 Oak Street";
    console.log(
      `  Input: { placeId: ${addedPlaceId}, name: "${updatedPlaceName}", address: "${updatedPlaceAddress}", userId: ${traceUser} }`,
    );
    const updateResult = await placeCatalog.updatePlace({
      placeId: addedPlaceId,
      name: updatedPlaceName,
      address: updatedPlaceAddress,
      userId: traceUser,
    });
    console.log("  Output:", updateResult);
    assertEquals(isError(updateResult), false, "Place should be updated.");
    console.log("  ✓ Update action completed");

    console.log("\n[VERIFY] Check place details reflect the update");
    const updatedPlaceDetails = await placeCatalog._getPlaceDetails({
      placeId: addedPlaceId,
    });
    assertEquals(
      (updatedPlaceDetails as { place: { name: string } }).place.name,
      updatedPlaceName,
      "Place name should be updated.",
    );
    assertEquals(
      (updatedPlaceDetails as { place: { address: string } }).place.address,
      updatedPlaceAddress,
      "Place address should be updated.",
    );
    console.log("  ✓ Place details reflect the update");

    // Step 5: Discoverability - Get places in an area
    console.log("\n[QUERY] _getPlacesInArea - Discovering places in an area");
    console.log(
      `  Input: { centerLat: ${centerLat}, centerLng: ${centerLng}, radius: ${searchRadius} }`,
    );
    const queryResult = await placeCatalog._getPlacesInArea({
      centerLat,
      centerLng,
      radius: searchRadius,
    });
    console.log("  Output:", queryResult);
    const discoveredPlaceIds = (queryResult as { places: ID[] }).places;
    assertArrayIncludes(
      discoveredPlaceIds,
      [exampleSeededPlaceId],
      "Seeded place should be discoverable.",
    );
    assertArrayIncludes(
      discoveredPlaceIds,
      [addedPlaceId],
      "User-added and updated place should be discoverable.",
    );
    console.log(
      `  ✓ Found ${discoveredPlaceIds.length} places. Both seeded and user-managed places are present`,
    );

    console.log(
      "\n✅ Principle demonstrated: Users can add, verify, and update places; system can seed from provider",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: seedPlaces successfully seeds places and enforces requirements", async () => {
  console.log("\n=== Testing seedPlaces Action ===");
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  try {
    // Should successfully seed places if none exist
    console.log("\n[TEST] Seed places successfully");
    const initialCount = await placeCatalog.places.countDocuments();
    assertEquals(initialCount, 0, "Collection should be empty initially.");
    console.log("  ✓ Collection is empty initially");

    console.log(
      "  Input: { centerLat: 0, centerLng: 0, radius: 10 }",
    );
    const result = await placeCatalog.seedPlaces({
      centerLat: 0,
      centerLng: 0,
      radius: 10,
    });
    console.log("  Output:", result);
    assertEquals(isError(result), false, "Seeding should succeed.");
    console.log("  ✓ Seeding completed without errors");

    const seededCount = await placeCatalog.places.countDocuments();
    assertNotEquals(
      seededCount,
      0,
      "Places should be seeded after the action.",
    );
    console.log(`  ✓ ${seededCount} places seeded`);

    // Should not add more places on second seed
    console.log("\n[TEST] Prevent re-seeding when places already exist");
    console.log("  Input: { centerLat: 0, centerLng: 0, radius: 10 }");
    const result2 = await placeCatalog.seedPlaces({
      centerLat: 0,
      centerLng: 0,
      radius: 10,
    });
    console.log("  Output:", result2);
    assertEquals(isError(result2), false, "Second seed should not error.");
    const finalCount = await placeCatalog.places.countDocuments();
    assertEquals(
      finalCount,
      seededCount,
      "No new places should be added on second seed.",
    );
    console.log(
      `  ✓ Collection count remains ${finalCount}, no re-seeding occurred`,
    );

    // Should fail to seed with invalid radius
    console.log("\n[TEST] Reject seeding with invalid radius");
    console.log("  Input: { centerLat: 0, centerLng: 0, radius: 0 }");
    const resultInvalidRadius = await placeCatalog.seedPlaces({
      centerLat: 0,
      centerLng: 0,
      radius: 0,
    });
    console.log("  Output:", resultInvalidRadius);
    assertEquals(
      isError(resultInvalidRadius),
      true,
      "Should return error for invalid radius.",
    );
    assertEquals(
      (resultInvalidRadius as { error: string }).error,
      "Invalid coordinates or radius must be positive.",
      "Error message should indicate invalid radius.",
    );
    console.log("  ✓ Correctly rejected invalid radius");

    // Should fail to seed with invalid coordinates
    console.log("\n[TEST] Reject seeding with invalid latitude");
    console.log("  Input: { centerLat: 91, centerLng: 0, radius: 10 }");
    const resultInvalidLat = await placeCatalog.seedPlaces({
      centerLat: 91,
      centerLng: 0,
      radius: 10,
    });
    console.log("  Output:", resultInvalidLat);
    assertEquals(
      isError(resultInvalidLat),
      true,
      "Should return error for invalid latitude.",
    );
    assertEquals(
      (resultInvalidLat as { error: string }).error,
      "Invalid coordinates or radius must be positive.",
      "Error message should indicate invalid coordinates.",
    );
    console.log("  ✓ Correctly rejected invalid latitude");

    console.log("\n✅ All seedPlaces requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Action: addPlace successfully adds places and enforces requirements", async () => {
  console.log("\n=== Testing addPlace Action ===");
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  try {
    const testUser1 = "user:Alice" as ID;

    // Should successfully add a new user-created place
    console.log("\n[TEST] Add a new place successfully");
    const initialCount = await placeCatalog.places.countDocuments();
    console.log(
      `  Input: { userId: ${testUser1}, name: "User's Favorite Spot", address: "42 Wallaby Way", category: "Recreation", lat: 34.0522, lng: -118.2437 }`,
    );
    const result = await placeCatalog.addPlace({
      userId: testUser1,
      name: "User's Favorite Spot",
      address: "42 Wallaby Way",
      category: "Recreation",
      lat: 34.0522,
      lng: -118.2437,
    });
    console.log("  Output:", result);
    assertEquals(isError(result), false, "Place should be added.");
    const userAddedPlaceId = (result as { placeId: ID }).placeId;
    assertExists(userAddedPlaceId, "Should return a place ID on success.");
    console.log(`  ✓ New place added with ID: ${userAddedPlaceId}`);

    const finalCount = await placeCatalog.places.countDocuments();
    assertEquals(
      finalCount,
      initialCount + 1,
      "Place count should increment by one.",
    );

    console.log("\n[VERIFY] Check added place details");
    const addedPlace = await placeCatalog.places.findOne({
      _id: userAddedPlaceId,
    });
    assertExists(addedPlace, "The added place should exist in the database.");
    assertEquals(addedPlace?.name, "User's Favorite Spot");
    assertEquals(addedPlace?.addedBy, testUser1);
    assertEquals(
      addedPlace?.verified,
      false,
      "User-added place should initially be unverified.",
    );
    assertEquals(
      addedPlace?.source,
      "user_added",
      "Source should be 'user_added'.",
    );
    assertEquals(addedPlace?.location.coordinates[0], -118.2437);
    assertEquals(addedPlace?.location.coordinates[1], 34.0522);
    console.log("  ✓ Added place details match expectations");

    // Should fail to add a place with empty name
    console.log("\n[TEST] Reject adding place with empty name");
    console.log(
      `  Input: { userId: ${testUser1}, name: "", address: "123 Test St", category: "Test", lat: 0, lng: 0 }`,
    );
    const resultEmptyName = await placeCatalog.addPlace({
      userId: testUser1,
      name: "",
      address: "123 Test St",
      category: "Test",
      lat: 0,
      lng: 0,
    });
    console.log("  Output:", resultEmptyName);
    assertEquals(
      isError(resultEmptyName),
      true,
      "Should return error for empty name.",
    );
    assertEquals(
      (resultEmptyName as { error: string }).error,
      "Place name cannot be empty.",
      "Error message should indicate empty name.",
    );
    console.log("  ✓ Correctly rejected empty name");

    // Should fail to add a place with invalid coordinates
    console.log("\n[TEST] Reject adding place with invalid coordinates");
    console.log(
      `  Input: { userId: ${testUser1}, name: "Bad Coord Place", address: "123 Test St", category: "Test", lat: 900, lng: 0 }`,
    );
    const resultInvalidCoords = await placeCatalog.addPlace({
      userId: testUser1,
      name: "Bad Coord Place",
      address: "123 Test St",
      category: "Test",
      lat: 900,
      lng: 0,
    });
    console.log("  Output:", resultInvalidCoords);
    assertEquals(
      isError(resultInvalidCoords),
      true,
      "Should return error for invalid coordinates.",
    );
    assertEquals(
      (resultInvalidCoords as { error: string }).error,
      "Invalid coordinates.",
      "Error message should indicate invalid coordinates.",
    );
    console.log("  ✓ Correctly rejected invalid coordinates");

    // Should fail to add a place with no userId
    console.log("\n[TEST] Reject adding place with no userId");
    console.log(
      '  Input: { userId: "", name: "No User Place", address: "123 Test St", category: "Test", lat: 0, lng: 0 }',
    );
    const resultNoUser = await placeCatalog.addPlace({
      userId: "" as ID,
      name: "No User Place",
      address: "123 Test St",
      category: "Test",
      lat: 0,
      lng: 0,
    });
    console.log("  Output:", resultNoUser);
    assertEquals(
      isError(resultNoUser),
      true,
      "Should return error for missing userId.",
    );
    assertEquals(
      (resultNoUser as { error: string }).error,
      "User ID is required.",
      "Error message should indicate missing userId.",
    );
    console.log("  ✓ Correctly rejected missing userId");

    console.log("\n✅ All addPlace requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Action: verifyPlace allows moderators to verify places and enforces requirements", async () => {
  console.log("\n=== Testing verifyPlace Action ===");
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  try {
    const testUser1 = "user:Alice" as ID;
    const testModerator = "user:BobModerator" as ID;

    // Setup: Add an unverified place
    console.log("\n[SETUP] Add an unverified place");
    const addResult = await placeCatalog.addPlace({
      userId: testUser1,
      name: "Test Place",
      address: "Test Address",
      category: "Test",
      lat: 34.0522,
      lng: -118.2437,
    });
    const userAddedPlaceId = (addResult as { placeId: ID }).placeId;
    console.log(`  ✓ Place added with ID: ${userAddedPlaceId}`);

    // Should successfully verify an unverified place
    console.log("\n[TEST] Verify an unverified place successfully");
    const beforeVerify = await placeCatalog.places.findOne({
      _id: userAddedPlaceId,
    });
    assertEquals(
      beforeVerify?.verified,
      false,
      "Place should be unverified before test.",
    );
    console.log("  ✓ Place is currently unverified");

    console.log(
      `  Input: { placeId: ${userAddedPlaceId}, moderatorId: ${testModerator} }`,
    );
    const result = await placeCatalog.verifyPlace({
      placeId: userAddedPlaceId,
      moderatorId: testModerator,
    });
    console.log("  Output:", result);
    assertEquals(
      isError(result),
      false,
      "Verification should succeed.",
    );
    console.log("  ✓ Place verification action performed");

    console.log("\n[VERIFY] Check place is now verified");
    const afterVerify = await placeCatalog.places.findOne({
      _id: userAddedPlaceId,
    });
    assertEquals(
      afterVerify?.verified,
      true,
      "Place should be marked as verified after action.",
    );
    console.log("  ✓ Place is now verified");

    // Should fail to verify a non-existent place
    console.log("\n[TEST] Reject verifying non-existent place");
    const nonExistentId = freshID();
    console.log(
      `  Input: { placeId: ${nonExistentId}, moderatorId: ${testModerator} }`,
    );
    const resultNotFound = await placeCatalog.verifyPlace({
      placeId: nonExistentId,
      moderatorId: testModerator,
    });
    console.log("  Output:", resultNotFound);
    assertEquals(
      isError(resultNotFound),
      true,
      "Should return error for non-existent place.",
    );
    assertEquals(
      (resultNotFound as { error: string }).error,
      `Place with ID ${nonExistentId} not found.`,
      "Error message should indicate place not found.",
    );
    console.log("  ✓ Correctly rejected non-existent place");

    // Should fail to verify an already verified place
    console.log("\n[TEST] Reject verifying already verified place");
    console.log(
      `  Input: { placeId: ${userAddedPlaceId}, moderatorId: ${testModerator} }`,
    );
    const resultAlreadyVerified = await placeCatalog.verifyPlace({
      placeId: userAddedPlaceId,
      moderatorId: testModerator,
    });
    console.log("  Output:", resultAlreadyVerified);
    assertEquals(
      isError(resultAlreadyVerified),
      true,
      "Should return error for already verified place.",
    );
    assertEquals(
      (resultAlreadyVerified as { error: string }).error,
      `Place with ID ${userAddedPlaceId} is already verified.`,
      "Error message should indicate already verified.",
    );
    console.log("  ✓ Correctly rejected already verified place");

    // Should fail to verify with no moderatorId
    console.log("\n[TEST] Reject verifying with no moderatorId");
    console.log(`  Input: { placeId: ${userAddedPlaceId}, moderatorId: "" }`);
    const resultNoModerator = await placeCatalog.verifyPlace({
      placeId: userAddedPlaceId,
      moderatorId: "" as ID,
    });
    console.log("  Output:", resultNoModerator);
    assertEquals(
      isError(resultNoModerator),
      true,
      "Should return error for missing moderatorId.",
    );
    assertEquals(
      (resultNoModerator as { error: string }).error,
      "Moderator ID is required for verification.",
      "Error message should indicate missing moderatorId.",
    );
    console.log("  ✓ Correctly rejected missing moderatorId");

    console.log("\n✅ All verifyPlace requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Action: updatePlace allows users to update places and enforces requirements", async () => {
  console.log("\n=== Testing updatePlace Action ===");
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  try {
    const testUser1 = "user:Alice" as ID;

    // Setup: Add a place to update
    console.log("\n[SETUP] Add a place for update tests");
    const addResult = await placeCatalog.addPlace({
      userId: testUser1,
      name: "Original Name",
      address: "Original Address",
      category: "Test",
      lat: 34.0522,
      lng: -118.2437,
    });
    const userAddedPlaceId = (addResult as { placeId: ID }).placeId;
    console.log(`  ✓ Place added with ID: ${userAddedPlaceId}`);

    // Should successfully update an existing place
    console.log("\n[TEST] Update a place successfully");
    const beforeUpdate = await placeCatalog.places.findOne({
      _id: userAddedPlaceId,
    });
    assertEquals(beforeUpdate?.name, "Original Name");
    assertEquals(beforeUpdate?.address, "Original Address");
    console.log("  ✓ Verified original place details");

    const newName = "Updated Name";
    const newAddress = "Updated Address";
    console.log(
      `  Input: { placeId: ${userAddedPlaceId}, name: "${newName}", address: "${newAddress}", userId: ${testUser1} }`,
    );
    const result = await placeCatalog.updatePlace({
      placeId: userAddedPlaceId,
      name: newName,
      address: newAddress,
      userId: testUser1,
    });
    console.log("  Output:", result);
    assertEquals(isError(result), false, "Update should succeed.");
    console.log("  ✓ Place update action performed");

    console.log("\n[VERIFY] Check place details are updated");
    const afterUpdate = await placeCatalog.places.findOne({
      _id: userAddedPlaceId,
    });
    assertEquals(afterUpdate?.name, newName, "Place name should be updated.");
    assertEquals(
      afterUpdate?.address,
      newAddress,
      "Place address should be updated.",
    );
    console.log("  ✓ Place details updated successfully");

    // Should fail to update a non-existent place
    console.log("\n[TEST] Reject updating non-existent place");
    const nonExistentId = freshID();
    console.log(
      `  Input: { placeId: ${nonExistentId}, name: "New Name", address: "New Address", userId: ${testUser1} }`,
    );
    const resultNotFound = await placeCatalog.updatePlace({
      placeId: nonExistentId,
      name: "New Name",
      address: "New Address",
      userId: testUser1,
    });
    console.log("  Output:", resultNotFound);
    assertEquals(
      isError(resultNotFound),
      true,
      "Should return error for non-existent place.",
    );
    assertEquals(
      (resultNotFound as { error: string }).error,
      `Place with ID ${nonExistentId} not found.`,
      "Error message should indicate place not found.",
    );
    console.log("  ✓ Correctly rejected non-existent place");

    // Should fail to update with empty name
    console.log("\n[TEST] Reject updating with empty name");
    console.log(
      `  Input: { placeId: ${userAddedPlaceId}, name: "", address: "Valid Address", userId: ${testUser1} }`,
    );
    const resultEmptyName = await placeCatalog.updatePlace({
      placeId: userAddedPlaceId,
      name: "",
      address: "Valid Address",
      userId: testUser1,
    });
    console.log("  Output:", resultEmptyName);
    assertEquals(
      isError(resultEmptyName),
      true,
      "Should return error for empty name.",
    );
    assertEquals(
      (resultEmptyName as { error: string }).error,
      "Place name cannot be empty.",
      "Error message should indicate empty name.",
    );
    console.log("  ✓ Correctly rejected empty name");

    // Should fail to update with no userId
    console.log("\n[TEST] Reject updating with no userId");
    console.log(
      `  Input: { placeId: ${userAddedPlaceId}, name: "Valid Name", address: "Valid Address", userId: "" }`,
    );
    const resultNoUser = await placeCatalog.updatePlace({
      placeId: userAddedPlaceId,
      name: "Valid Name",
      address: "Valid Address",
      userId: "" as ID,
    });
    console.log("  Output:", resultNoUser);
    assertEquals(
      isError(resultNoUser),
      true,
      "Should return error for missing userId.",
    );
    assertEquals(
      (resultNoUser as { error: string }).error,
      "User ID is required.",
      "Error message should indicate missing userId.",
    );
    console.log("  ✓ Correctly rejected missing userId");

    // Should fail to update with same details
    console.log("\n[TEST] Reject updating with no changes");
    const placeBefore = await placeCatalog.places.findOne({
      _id: userAddedPlaceId,
    });
    console.log(
      `  Input: { placeId: ${userAddedPlaceId}, name: "${
        placeBefore!.name
      }", address: "${placeBefore!.address}", userId: ${testUser1} }`,
    );
    const resultSameDetails = await placeCatalog.updatePlace({
      placeId: userAddedPlaceId,
      name: placeBefore!.name,
      address: placeBefore!.address,
      userId: testUser1,
    });
    console.log("  Output:", resultSameDetails);
    assertEquals(
      isError(resultSameDetails),
      true,
      "Should return error if no changes are made.",
    );
    assertEquals(
      (resultSameDetails as { error: string }).error,
      `Place with ID ${userAddedPlaceId} details are already up-to-date.`,
      "Error message should indicate no changes.",
    );
    console.log("  ✓ Correctly rejected update with no changes");

    console.log("\n✅ All updatePlace requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getPlacesInArea retrieves places within specified area and enforces requirements", async () => {
  console.log("\n=== Testing _getPlacesInArea Query ===");
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  try {
    const testUser1 = "user:Alice" as ID;

    // Setup: Seed places
    console.log("\n[SETUP] Seed places for area query tests");
    await placeCatalog.seedPlaces({
      centerLat: 0,
      centerLng: 0,
      radius: 10,
    });
    const oneSeededPlace = await placeCatalog.places.findOne({
      source: "provider",
    });
    assertExists(oneSeededPlace, "There should be at least one seeded place.");
    const seededPlaceId = oneSeededPlace._id;
    const { coordinates: [lng, lat] } = oneSeededPlace.location;
    console.log(
      `  ✓ Seeded places available, using reference place at (${lat}, ${lng})`,
    );

    // Add a user place nearby
    console.log("\n[SETUP] Add a user place for query tests");
    const addResult = await placeCatalog.addPlace({
      userId: testUser1,
      name: "Nearby User Place",
      address: "Test Address",
      category: "Test",
      lat: lat + 0.001,
      lng: lng + 0.001,
    });
    const userAddedPlaceId = (addResult as { placeId: ID }).placeId;
    console.log(`  ✓ User place added with ID: ${userAddedPlaceId}`);

    // Should retrieve places within a specified area
    console.log("\n[TEST] Retrieve places in area successfully");
    console.log(
      `  Input: { centerLat: ${lat}, centerLng: ${lng}, radius: 1 }`,
    );
    const result = await placeCatalog._getPlacesInArea({
      centerLat: lat,
      centerLng: lng,
      radius: 1,
    });
    console.log("  Output:", result);
    assertEquals(isError(result), false, "Query should succeed.");
    const foundPlaces = (result as { places: ID[] }).places;
    assertArrayIncludes(
      foundPlaces,
      [seededPlaceId],
      "Seeded place should be in the list.",
    );
    console.log(
      `  ✓ Found ${foundPlaces.length} places in the area, including expected ones`,
    );

    // Test with a larger radius
    console.log("\n[TEST] Retrieve places with larger radius");
    console.log(
      `  Input: { centerLat: ${lat}, centerLng: ${lng}, radius: 100 }`,
    );
    const resultLargeRadius = await placeCatalog._getPlacesInArea({
      centerLat: lat,
      centerLng: lng,
      radius: 100,
    });
    console.log("  Output:", resultLargeRadius);
    const allPlaces = await placeCatalog.places.find({}, {
      projection: { _id: 1 },
    }).toArray();
    assertEquals(
      (resultLargeRadius as { places: ID[] }).places.length,
      allPlaces.length,
      "Larger radius should find all existing places.",
    );
    console.log(
      `  ✓ Larger radius found ${
        (resultLargeRadius as { places: ID[] }).places.length
      } places (all in database)`,
    );

    // Should fail with invalid latitude
    console.log("\n[TEST] Reject query with invalid latitude");
    console.log("  Input: { centerLat: 91, centerLng: 0, radius: 1 }");
    const resultInvalidLat = await placeCatalog._getPlacesInArea({
      centerLat: 91,
      centerLng: 0,
      radius: 1,
    });
    console.log("  Output:", resultInvalidLat);
    assertEquals(
      isError(resultInvalidLat),
      true,
      "Should return error for invalid latitude.",
    );
    assertEquals(
      (resultInvalidLat as { error: string }).error,
      "Invalid coordinates or radius must be positive.",
      "Error message should indicate invalid coordinates.",
    );
    console.log("  ✓ Correctly rejected invalid latitude");

    // Should fail with zero radius
    console.log("\n[TEST] Reject query with zero radius");
    console.log("  Input: { centerLat: 0, centerLng: 0, radius: 0 }");
    const resultZeroRadius = await placeCatalog._getPlacesInArea({
      centerLat: 0,
      centerLng: 0,
      radius: 0,
    });
    console.log("  Output:", resultZeroRadius);
    assertEquals(
      isError(resultZeroRadius),
      true,
      "Should return error for zero radius.",
    );
    assertEquals(
      (resultZeroRadius as { error: string }).error,
      "Invalid coordinates or radius must be positive.",
      "Error message should indicate invalid radius.",
    );
    console.log("  ✓ Correctly rejected zero radius");

    console.log("\n✅ All _getPlacesInArea requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getPlaceDetails retrieves correct place information and enforces requirements", async () => {
  console.log("\n=== Testing _getPlaceDetails Query ===");
  const [db, client] = await testDb();
  const placeCatalog = new PlaceCatalogConcept(db);

  try {
    const testUser1 = "user:Alice" as ID;
    const testModerator = "user:BobModerator" as ID;

    // Setup: Add and verify a place
    console.log("\n[SETUP] Add a place for details query tests");
    const addResult = await placeCatalog.addPlace({
      userId: testUser1,
      name: "Details Test Place",
      address: "Details Test Address",
      category: "Test",
      lat: 34.0522,
      lng: -118.2437,
    });
    const userAddedPlaceId = (addResult as { placeId: ID }).placeId;
    console.log(`  ✓ Place added with ID: ${userAddedPlaceId}`);

    console.log("\n[SETUP] Verify the place");
    await placeCatalog.verifyPlace({
      placeId: userAddedPlaceId,
      moderatorId: testModerator,
    });
    console.log("  ✓ Place verified");

    console.log("\n[SETUP] Update the place");
    await placeCatalog.updatePlace({
      placeId: userAddedPlaceId,
      name: "Updated Details Test Place",
      address: "Updated Details Test Address",
      userId: testUser1,
    });
    console.log("  ✓ Place updated");

    // Should retrieve full details of a specific place
    console.log("\n[TEST] Retrieve place details successfully");
    console.log(`  Input: { placeId: ${userAddedPlaceId} }`);
    const result = await placeCatalog._getPlaceDetails({
      placeId: userAddedPlaceId,
    });
    console.log("  Output:", result);
    assertEquals(isError(result), false, "Query should succeed.");
    const placeDetails = (result as {
      place: {
        id: ID;
        name: string;
        address: string;
        addedBy: ID;
        verified: boolean;
        location: unknown;
      };
    }).place;
    assertExists(placeDetails, "Should return place details.");
    console.log("  ✓ Place details retrieved");

    console.log("\n[VERIFY] Check place details are correct");
    assertEquals(
      placeDetails.id,
      userAddedPlaceId,
      "Returned ID should match requested ID.",
    );
    assertEquals(placeDetails.name, "Updated Details Test Place");
    assertEquals(placeDetails.address, "Updated Details Test Address");
    assertEquals(placeDetails.addedBy, testUser1);
    assertEquals(placeDetails.verified, true);
    assertExists(placeDetails.location);
    console.log("  ✓ All place details are correct");

    // Should fail to retrieve details for non-existent place
    console.log("\n[TEST] Reject query for non-existent place");
    const nonExistentId = freshID();
    console.log(`  Input: { placeId: ${nonExistentId} }`);
    const resultNotFound = await placeCatalog._getPlaceDetails({
      placeId: nonExistentId,
    });
    console.log("  Output:", resultNotFound);
    assertEquals(
      isError(resultNotFound),
      true,
      "Should return error for non-existent place.",
    );
    assertEquals(
      (resultNotFound as { error: string }).error,
      `Place with ID ${nonExistentId} not found.`,
      "Error message should indicate place not found.",
    );
    console.log("  ✓ Correctly rejected non-existent place");

    // Should fail with empty placeId
    console.log("\n[TEST] Reject query with empty placeId");
    console.log('  Input: { placeId: "" }');
    const resultEmptyId = await placeCatalog._getPlaceDetails({
      placeId: "" as ID,
    });
    console.log("  Output:", resultEmptyId);
    assertEquals(
      isError(resultEmptyId),
      true,
      "Should return error for empty placeId.",
    );
    assertEquals(
      (resultEmptyId as { error: string }).error,
      "Place ID is required.",
      "Error message should indicate missing placeId.",
    );
    console.log("  ✓ Correctly rejected empty placeId");

    console.log("\n✅ All _getPlaceDetails requirements verified");
  } finally {
    await client.close();
  }
});
