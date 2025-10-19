---
timestamp: 'Sat Oct 18 2025 17:54:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_175418.48040985.md]]'
content_id: eea3a4859f9368351899b6052dcbd5449dbcd30b9b31f095e451ce07619fb8c6
---

# response:

```typescript
// file: src/concepts/UserAuth/UserAuthConcept.test.ts
import { assertEquals, assert, assertFalse, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthConcept from "./UserAuthConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("UserAuth Concept", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  await t.step("Principle: users must register and log in before contributing; moderators can verify content", async () => {
    console.log("\n--- Principle Test: Register, Login, Grant/Verify Moderator ---");

    // 1. Register a regular user
    console.log("Attempting to register user 'Alice'...");
    const registerAliceResult = await userAuth.registerUser({
      username: "Alice",
      password: "password123",
    });
    assert("userId" in registerAliceResult, `Alice registration failed: ${registerAliceResult.error}`);
    const aliceId = registerAliceResult.userId;
    console.log(`Registered Alice with ID: ${aliceId}`);

    // Verify Alice is not a moderator by default
    const aliceDetailsInitial = await userAuth._getUserDetails({ userId: aliceId });
    assert(!("error" in aliceDetailsInitial), `Error getting Alice details: ${aliceDetailsInitial.error}`);
    assertEquals(aliceDetailsInitial[0].user.canModerate, false, "Alice should not be a moderator initially");
    console.log(`Verified Alice is not a moderator initially: ${aliceDetailsInitial[0].user.canModerate}`);

    // 2. Log in as Alice
    console.log("Attempting to log in as Alice...");
    const loginAliceResult = await userAuth.login({
      username: "Alice",
      password: "password123",
    });
    assert("sessionToken" in loginAliceResult, `Alice login failed: ${loginAliceResult.error}`);
    const aliceSessionToken = loginAliceResult.sessionToken;
    console.log(`Alice logged in successfully with session token: ${aliceSessionToken}`);

    // Verify Alice is authenticated
    const authenticatedAlice = await userAuth.getAuthenticatedUser({ sessionToken: aliceSessionToken });
    assert(authenticatedAlice.userProfile !== null, "Alice should be authenticated");
    assertEquals(authenticatedAlice.userProfile?.userId, aliceId, "Authenticated user ID should match Alice's ID");
    console.log(`Verified Alice is authenticated: ${authenticatedAlice.userProfile?.username}`);

    // 3. Register an admin user
    console.log("Attempting to register user 'Admin'...");
    const registerAdminResult = await userAuth.registerUser({
      username: "Admin",
      password: "adminpassword",
    });
    assert("userId" in registerAdminResult, `Admin registration failed: ${registerAdminResult.error}`);
    const adminId = registerAdminResult.userId;
    console.log(`Registered Admin with ID: ${adminId}`);

    // 4. Log in as Admin
    console.log("Attempting to log in as Admin...");
    const loginAdminResult = await userAuth.login({
      username: "Admin",
      password: "adminpassword",
    });
    assert("sessionToken" in loginAdminResult, `Admin login failed: ${loginAdminResult.error}`);
    const adminSessionToken = loginAdminResult.sessionToken;
    console.log(`Admin logged in successfully with session token: ${adminSessionToken}`);

    // 5. Admin grants moderator status to Alice
    console.log(`Admin (${adminId}) attempting to grant moderator status to Alice (${aliceId})...`);
    const grantAdminSelfResult = await userAuth.grantModerator({
      targetUserId: adminId,
      adminSessionToken: adminSessionToken,
    });
    assert("success" in grantAdminSelfResult && grantAdminSelfResult.success, `Admin failed to grant self moderator: ${grantAdminSelfResult.error}`);
    console.log("Admin granted self moderator privileges.");

    const grantResult = await userAuth.grantModerator({
      targetUserId: aliceId,
      adminSessionToken: adminSessionToken,
    });
    assert("success" in grantResult && grantResult.success, `Grant moderator to Alice failed: ${grantResult.error}`);
    console.log(`Admin successfully granted moderator status to Alice.`);

    // 6. Verify Alice is now a moderator
    const aliceDetailsAfterGrant = await userAuth._getUserDetails({ userId: aliceId });
    assert(!("error" in aliceDetailsAfterGrant), `Error getting Alice details after grant: ${aliceDetailsAfterGrant.error}`);
    assertEquals(aliceDetailsAfterGrant[0].user.canModerate, true, "Alice should now be a moderator");
    console.log(`Verified Alice is now a moderator: ${aliceDetailsAfterGrant[0].user.canModerate}`);

    const isAliceModerator = await userAuth._isModerator({ userId: aliceId });
    assert(!("error" in isAliceModerator), `Error checking Alice's moderator status: ${isAliceModerator.error}`);
    assertEquals(isAliceModerator[0].isModerator, true, "Alice should be confirmed as a moderator by _isModerator query");
    console.log(`Verified Alice's moderator status using _isModerator: ${isAliceModerator[0].isModerator}`);

    // 7. Revoke moderator status from Alice
    console.log(`Admin (${adminId}) attempting to revoke moderator status from Alice (${aliceId})...`);
    const revokeResult = await userAuth.revokeModerator({
      targetUserId: aliceId,
      adminSessionToken: adminSessionToken,
    });
    assert("success" in revokeResult && revokeResult.success, `Revoke moderator from Alice failed: ${revokeResult.error}`);
    console.log(`Admin successfully revoked moderator status from Alice.`);

    // 8. Verify Alice is no longer a moderator
    const aliceDetailsAfterRevoke = await userAuth._getUserDetails({ userId: aliceId });
    assert(!("error" in aliceDetailsAfterRevoke), `Error getting Alice details after revoke: ${aliceDetailsAfterRevoke.error}`);
    assertEquals(aliceDetailsAfterRevoke[0].user.canModerate, false, "Alice should no longer be a moderator");
    console.log(`Verified Alice is no longer a moderator: ${aliceDetailsAfterRevoke[0].user.canModerate}`);

    // Clean up sessions
    await userAuth.logout({ sessionToken: aliceSessionToken });
    await userAuth.logout({ sessionToken: adminSessionToken });
  });

  await t.step("registerUser action", async (t) => {
    console.log("\n--- Testing registerUser Action ---");

    await t.step("should successfully register a new user", async () => {
      console.log("Registering 'testUser1'...");
      const result = await userAuth.registerUser({
        username: "testUser1",
        password: "password",
      });
      assert("userId" in result, `Registration failed: ${result.error}`);
      const userId = result.userId;
      assert(userId.startsWith("id_"), "User ID should be a valid ID string");
      console.log(`Registered user: ${userId}`);

      const user = await userAuth.users.findOne({ _id: userId });
      assert(user !== null, "User should exist in the database");
      assertEquals(user?.username, "testUser1", "Username should match");
      assertFalse(user?.canModerate, "New user should not be a moderator by default");
      console.log("Verification: User exists, username matches, not moderator.");
    });

    await t.step("should fail to register with an empty password", async () => {
      console.log("Attempting to register 'testUser2' with an empty password...");
      const result = await userAuth.registerUser({
        username: "testUser2",
        password: "",
      });
      assert("error" in result, "Registration with empty password should return an error");
      assertEquals(result.error, "Password cannot be empty", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });

    await t.step("should fail to register with a duplicate username", async () => {
      console.log("Registering 'duplicateUser' first time...");
      await userAuth.registerUser({ username: "duplicateUser", password: "password" });

      console.log("Attempting to register 'duplicateUser' again...");
      const result = await userAuth.registerUser({
        username: "duplicateUser",
        password: "anotherpassword",
      });
      assert("error" in result, "Registration with duplicate username should return an error");
      assertEquals(result.error, "Username already taken", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });
  });

  await t.step("login action", async (t) => {
    console.log("\n--- Testing login Action ---");
    const { userId: bobId } = await userAuth.registerUser({ username: "Bob", password: "bobpassword" }) as { userId: ID };

    await t.step("should successfully log in a registered user", async () => {
      console.log("Attempting to log in 'Bob'...");
      const result = await userAuth.login({
        username: "Bob",
        password: "bobpassword",
      });
      assert("sessionToken" in result, `Login failed: ${result.error}`);
      const sessionToken = result.sessionToken;
      assert(sessionToken.startsWith("id_"), "Session token should be a valid ID string");
      console.log(`Logged in Bob with session token: ${sessionToken}`);

      const session = await userAuth.activeSessions.findOne({ _id: sessionToken as ID });
      assert(session !== null, "Session should exist in the database");
      assertEquals(session?.userId, bobId, "Session should be linked to Bob's ID");
      console.log("Verification: Session exists and linked to Bob.");

      // Clean up session
      await userAuth.logout({ sessionToken });
    });

    await t.step("should fail to log in with an invalid username", async () => {
      console.log("Attempting to log in with invalid username 'NonExistentUser'...");
      const result = await userAuth.login({
        username: "NonExistentUser",
        password: "somepassword",
      });
      assert("error" in result, "Login with invalid username should return an error");
      assertEquals(result.error, "Invalid username or password", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });

    await t.step("should fail to log in with an incorrect password", async () => {
      console.log("Attempting to log in 'Bob' with an incorrect password...");
      const result = await userAuth.login({
        username: "Bob",
        password: "wrongpassword",
      });
      assert("error" in result, "Login with incorrect password should return an error");
      assertEquals(result.error, "Invalid username or password", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });
  });

  await t.step("logout action", async (t) => {
    console.log("\n--- Testing logout Action ---");
    const { userId: charlieId } = await userAuth.registerUser({ username: "Charlie", password: "charliepassword" }) as { userId: ID };
    const { sessionToken: charlieSession } = await userAuth.login({ username: "Charlie", password: "charliepassword" }) as { sessionToken: string };

    await t.step("should successfully log out an active session", async () => {
      console.log(`Logging out Charlie's session: ${charlieSession}`);
      const result = await userAuth.logout({ sessionToken: charlieSession });
      assertEquals(result.success, true, "Logout should be successful");
      console.log("Verification: Logout reported success.");

      const session = await userAuth.activeSessions.findOne({ _id: charlieSession as ID });
      assertEquals(session, null, "Session should no longer exist in the database");
      console.log("Verification: Session no longer exists in DB.");
    });

    await t.step("should return false for an invalid or already logged out session", async () => {
      const invalidSession = "invalidSessionToken" as ID;
      console.log(`Attempting to log out invalid session: ${invalidSession}`);
      const result = await userAuth.logout({ sessionToken: invalidSession });
      assertEquals(result.success, false, "Logout of invalid session should return false");
      console.log("Verification: Logout reported failure for invalid session.");
    });
  });

  await t.step("getAuthenticatedUser action", async (t) => {
    console.log("\n--- Testing getAuthenticatedUser Action ---");
    const { userId: davidId } = await userAuth.registerUser({ username: "David", password: "davidpassword" }) as { userId: ID };
    const { sessionToken: davidSession } = await userAuth.login({ username: "David", password: "davidpassword" }) as { sessionToken: string };

    await t.step("should return user profile for a valid session", async () => {
      console.log(`Getting authenticated user for David's session: ${davidSession}`);
      const result = await userAuth.getAuthenticatedUser({ sessionToken: davidSession });
      assert(result.userProfile !== null, "User profile should not be null");
      assertEquals(result.userProfile?.userId, davidId, "User ID should match David's ID");
      assertEquals(result.userProfile?.username, "David", "Username should match");
      assertFalse(result.userProfile?.canModerate, "David should not be a moderator");
      console.log("Verification: User profile retrieved with correct details.");
    });

    await t.step("should return null for an invalid session token", async () => {
      const invalidSession = "nonExistentSession" as ID;
      console.log(`Getting authenticated user for invalid session: ${invalidSession}`);
      const result = await userAuth.getAuthenticatedUser({ sessionToken: invalidSession });
      assertEquals(result.userProfile, null, "User profile should be null for invalid session");
      console.log("Verification: Null user profile for invalid session.");
    });

    // Clean up session
    await userAuth.logout({ sessionToken: davidSession });
  });

  await t.step("changePassword action", async (t) => {
    console.log("\n--- Testing changePassword Action ---");
    const { userId: eveId } = await userAuth.registerUser({ username: "Eve", password: "evepassword" }) as { userId: ID };
    const { sessionToken: eveSession1 } = await userAuth.login({ username: "Eve", password: "evepassword" }) as { sessionToken: string };
    const { sessionToken: eveSession2 } = await userAuth.login({ username: "Eve", password: "evepassword" }) as { sessionToken: string };
    assertNotEquals(eveSession1, eveSession2, "Should create distinct sessions");

    await t.step("should successfully change password and invalidate all user sessions", async () => {
      console.log(`Changing password for Eve (session: ${eveSession1})...`);
      const result = await userAuth.changePassword({
        sessionToken: eveSession1,
        oldPassword: "evepassword",
        newPassword: "new_evepassword",
      });
      assert("success" in result && result.success, `Password change failed: ${result.error}`);
      console.log("Verification: Password change reported success.");

      // Verify old sessions are invalidated
      const authEve1 = await userAuth.getAuthenticatedUser({ sessionToken: eveSession1 });
      assertEquals(authEve1.userProfile, null, `Session ${eveSession1} should be invalidated`);
      console.log(`Verification: Session ${eveSession1} is invalidated.`);

      const authEve2 = await userAuth.getAuthenticatedUser({ sessionToken: eveSession2 });
      assertEquals(authEve2.userProfile, null, `Session ${eveSession2} should be invalidated`);
      console.log(`Verification: Session ${eveSession2} is invalidated.`);

      // Verify login with new password works
      console.log("Attempting to log in with new password...");
      const loginNewResult = await userAuth.login({
        username: "Eve",
        password: "new_evepassword",
      });
      assert("sessionToken" in loginNewResult, `Login with new password failed: ${loginNewResult.error}`);
      console.log("Verification: Login with new password successful.");

      // Clean up new session
      await userAuth.logout({ sessionToken: loginNewResult.sessionToken });
    });

    await t.step("should fail to change password with an invalid session token", async () => {
      console.log("Attempting to change password with an invalid session token...");
      const result = await userAuth.changePassword({
        sessionToken: "invalidEveSession",
        oldPassword: "old",
        newPassword: "new",
      });
      assert("error" in result, "Password change with invalid session should return an error");
      assertEquals(result.error, "Invalid session", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });

    await t.step("should fail to change password with an incorrect old password", async () => {
      const { userId: frankId } = await userAuth.registerUser({ username: "Frank", password: "frankpassword" }) as { userId: ID };
      const { sessionToken: frankSession } = await userAuth.login({ username: "Frank", password: "frankpassword" }) as { sessionToken: string };

      console.log("Attempting to change password with incorrect old password...");
      const result = await userAuth.changePassword({
        sessionToken: frankSession,
        oldPassword: "wrong_frankpassword",
        newPassword: "new_frankpassword",
      });
      assert("error" in result, "Password change with incorrect old password should return an error");
      assertEquals(result.error, "Old password does not match", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);

      // Clean up session
      await userAuth.logout({ sessionToken: frankSession });
    });

    await t.step("should fail to change password with an empty new password", async () => {
      const { userId: graceId } = await userAuth.registerUser({ username: "Grace", password: "gracepassword" }) as { userId: ID };
      const { sessionToken: graceSession } = await userAuth.login({ username: "Grace", password: "gracepassword" }) as { sessionToken: string };

      console.log("Attempting to change password with empty new password...");
      const result = await userAuth.changePassword({
        sessionToken: graceSession,
        oldPassword: "gracepassword",
        newPassword: "",
      });
      assert("error" in result, "Password change with empty new password should return an error");
      assertEquals(result.error, "New password cannot be empty", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);

      // Clean up session
      await userAuth.logout({ sessionToken: graceSession });
    });
  });

  await t.step("grantModerator action", async (t) => {
    console.log("\n--- Testing grantModerator Action ---");
    const { userId: adminUserId } = await userAuth.registerUser({ username: "SuperAdmin", password: "adminpassword" }) as { userId: ID };
    const { sessionToken: adminSessionToken } = await userAuth.login({ username: "SuperAdmin", password: "adminpassword" }) as { sessionToken: string };
    await userAuth.grantModerator({ targetUserId: adminUserId, adminSessionToken: adminSessionToken }); // Grant admin self moderator

    const { userId: userToModerateId } = await userAuth.registerUser({ username: "UserToModerate", password: "password" }) as { userId: ID };

    await t.step("should successfully grant moderator privileges", async () => {
      console.log(`Admin (${adminUserId}) granting moderator to ${userToModerateId}...`);
      const result = await userAuth.grantModerator({
        targetUserId: userToModerateId,
        adminSessionToken: adminSessionToken,
      });
      assert("success" in result && result.success, `Grant moderator failed: ${result.error}`);
      console.log("Verification: Grant moderator reported success.");

      const isModerator = await userAuth._isModerator({ userId: userToModerateId });
      assert(!("error" in isModerator), `Error checking moderator status: ${isModerator.error}`);
      assertEquals(isModerator[0].isModerator, true, "User should now be a moderator");
      console.log("Verification: User is now a moderator.");
    });

    await t.step("should be idempotent (granting to an already moderate user)", async () => {
      console.log(`Admin (${adminUserId}) attempting to grant moderator to already moderate user ${userToModerateId}...`);
      const result = await userAuth.grantModerator({
        targetUserId: userToModerateId,
        adminSessionToken: adminSessionToken,
      });
      assert("success" in result && result.success, `Idempotent grant failed: ${result.error}`);
      console.log("Verification: Idempotent grant reported success.");

      const isModerator = await userAuth._isModerator({ userId: userToModerateId });
      assert(!("error" in isModerator), `Error checking moderator status: ${isModerator.error}`);
      assertEquals(isModerator[0].isModerator, true, "User should still be a moderator");
      console.log("Verification: User is still a moderator.");
    });

    await t.step("should fail if admin session is invalid", async () => {
      console.log("Attempting to grant moderator with invalid admin session...");
      const result = await userAuth.grantModerator({
        targetUserId: userToModerateId,
        adminSessionToken: "invalidAdminSession",
      });
      assert("error" in result, "Grant moderator with invalid admin session should fail");
      assertEquals(result.error, "Invalid admin session", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });

    await t.step("should fail if the granting user is not a moderator", async () => {
      const { userId: nonAdminId } = await userAuth.registerUser({ username: "NonAdmin", password: "password" }) as { userId: ID };
      const { sessionToken: nonAdminSession } = await userAuth.login({ username: "NonAdmin", password: "password" }) as { sessionToken: string };
      const { userId: anotherUser } = await userAuth.registerUser({ username: "AnotherUser", password: "password" }) as { userId: ID };

      console.log(`Non-admin (${nonAdminId}) attempting to grant moderator to ${anotherUser}...`);
      const result = await userAuth.grantModerator({
        targetUserId: anotherUser,
        adminSessionToken: nonAdminSession,
      });
      assert("error" in result, "Grant moderator by non-admin should fail");
      assertEquals(result.error, "Admin user does not have moderator privileges", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);

      await userAuth.logout({ sessionToken: nonAdminSession });
    });

    await t.step("should fail if target user does not exist", async () => {
      const nonExistentUserId = "nonExistentUser" as ID;
      console.log(`Admin (${adminUserId}) attempting to grant moderator to non-existent user ${nonExistentUserId}...`);
      const result = await userAuth.grantModerator({
        targetUserId: nonExistentUserId,
        adminSessionToken: adminSessionToken,
      });
      assert("error" in result, "Grant moderator to non-existent user should fail");
      assertEquals(result.error, "Target user not found", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });

    // Clean up admin session and revoke moderator from userToModerate for next tests
    await userAuth.revokeModerator({ targetUserId: userToModerateId, adminSessionToken });
    await userAuth.logout({ sessionToken: adminSessionToken });
  });

  await t.step("revokeModerator action", async (t) => {
    console.log("\n--- Testing revokeModerator Action ---");
    const { userId: adminUserId } = await userAuth.registerUser({ username: "MegaAdmin", password: "adminpassword" }) as { userId: ID };
    const { sessionToken: adminSessionToken } = await userAuth.login({ username: "MegaAdmin", password: "adminpassword" }) as { sessionToken: string };
    await userAuth.grantModerator({ targetUserId: adminUserId, adminSessionToken: adminSessionToken }); // Grant admin self moderator

    const { userId: userToRevokeId } = await userAuth.registerUser({ username: "UserToRevoke", password: "password" }) as { userId: ID };
    await userAuth.grantModerator({ targetUserId: userToRevokeId, adminSessionToken: adminSessionToken }); // Grant initially for revoking

    await t.step("should successfully revoke moderator privileges", async () => {
      console.log(`Admin (${adminUserId}) revoking moderator from ${userToRevokeId}...`);
      const result = await userAuth.revokeModerator({
        targetUserId: userToRevokeId,
        adminSessionToken: adminSessionToken,
      });
      assert("success" in result && result.success, `Revoke moderator failed: ${result.error}`);
      console.log("Verification: Revoke moderator reported success.");

      const isModerator = await userAuth._isModerator({ userId: userToRevokeId });
      assert(!("error" in isModerator), `Error checking moderator status: ${isModerator.error}`);
      assertEquals(isModerator[0].isModerator, false, "User should no longer be a moderator");
      console.log("Verification: User is no longer a moderator.");
    });

    await t.step("should be idempotent (revoking from a non-moderate user)", async () => {
      console.log(`Admin (${adminUserId}) attempting to revoke moderator from already non-moderate user ${userToRevokeId}...`);
      const result = await userAuth.revokeModerator({
        targetUserId: userToRevokeId,
        adminSessionToken: adminSessionToken,
      });
      assert("success" in result && result.success, `Idempotent revoke failed: ${result.error}`);
      console.log("Verification: Idempotent revoke reported success.");

      const isModerator = await userAuth._isModerator({ userId: userToRevokeId });
      assert(!("error" in isModerator), `Error checking moderator status: ${isModerator.error}`);
      assertEquals(isModerator[0].isModerator, false, "User should still not be a moderator");
      console.log("Verification: User is still not a moderator.");
    });

    await t.step("should fail if admin session is invalid", async () => {
      console.log("Attempting to revoke moderator with invalid admin session...");
      const result = await userAuth.revokeModerator({
        targetUserId: userToRevokeId,
        adminSessionToken: "invalidAdminSession",
      });
      assert("error" in result, "Revoke moderator with invalid admin session should fail");
      assertEquals(result.error, "Invalid admin session", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });

    await t.step("should fail if the revoking user is not a moderator", async () => {
      const { userId: nonAdminId } = await userAuth.registerUser({ username: "NonAdminRevoke", password: "password" }) as { userId: ID };
      const { sessionToken: nonAdminSession } = await userAuth.login({ username: "NonAdminRevoke", password: "password" }) as { sessionToken: string };
      const { userId: anotherUser } = await userAuth.registerUser({ username: "AnotherUserRevoke", password: "password" }) as { userId: ID };
      await userAuth.grantModerator({ targetUserId: anotherUser, adminSessionToken: adminSessionToken }); // Grant initially

      console.log(`Non-admin (${nonAdminId}) attempting to revoke moderator from ${anotherUser}...`);
      const result = await userAuth.revokeModerator({
        targetUserId: anotherUser,
        adminSessionToken: nonAdminSession,
      });
      assert("error" in result, "Revoke moderator by non-admin should fail");
      assertEquals(result.error, "Admin user does not have moderator privileges", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);

      await userAuth.logout({ sessionToken: nonAdminSession });
    });

    await t.step("should fail if target user does not exist", async () => {
      const nonExistentUserId = "nonExistentUserRevoke" as ID;
      console.log(`Admin (${adminUserId}) attempting to revoke moderator from non-existent user ${nonExistentUserId}...`);
      const result = await userAuth.revokeModerator({
        targetUserId: nonExistentUserId,
        adminSessionToken: adminSessionToken,
      });
      assert("error" in result, "Revoke moderator from non-existent user should fail");
      assertEquals(result.error, "Target user not found", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });

    // Clean up admin session
    await userAuth.logout({ sessionToken: adminSessionToken });
  });

  await t.step("_getUserDetails query", async (t) => {
    console.log("\n--- Testing _getUserDetails Query ---");
    const { userId: queryUserId } = await userAuth.registerUser({ username: "QueryUser", password: "password" }) as { userId: ID };

    await t.step("should return user details for an existing user", async () => {
      console.log(`Querying details for user: ${queryUserId}`);
      const result = await userAuth._getUserDetails({ userId: queryUserId });
      assert(!("error" in result), `Query failed: ${result.error}`);
      assertEquals(result.length, 1, "Should return exactly one result");
      assertEquals(result[0].user.username, "QueryUser", "Username should match");
      assertFalse(result[0].user.canModerate, "canModerate should be false");
      console.log("Verification: Details retrieved successfully.");
    });

    await t.step("should return an error for a non-existent user", async () => {
      const nonExistentUserId = "nonExistentQueryUser" as ID;
      console.log(`Querying details for non-existent user: ${nonExistentUserId}`);
      const result = await userAuth._getUserDetails({ userId: nonExistentUserId });
      assert("error" in result, "Query for non-existent user should return an error");
      assertEquals(result.error, "User not found", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });
  });

  await t.step("_isModerator query", async (t) => {
    console.log("\n--- Testing _isModerator Query ---");
    const { userId: modTestUserId } = await userAuth.registerUser({ username: "ModTestUser", password: "password" }) as { userId: ID };
    const { userId: adminUserId } = await userAuth.registerUser({ username: "AdminForModTest", password: "adminpassword" }) as { userId: ID };
    const { sessionToken: adminSessionToken } = await userAuth.login({ username: "AdminForModTest", password: "adminpassword" }) as { sessionToken: string };
    await userAuth.grantModerator({ targetUserId: adminUserId, adminSessionToken: adminSessionToken }); // Grant admin self moderator

    await t.step("should return false for a non-moderator", async () => {
      console.log(`Checking moderator status for non-moderator: ${modTestUserId}`);
      const result = await userAuth._isModerator({ userId: modTestUserId });
      assert(!("error" in result), `Query failed: ${result.error}`);
      assertEquals(result.length, 1, "Should return exactly one result");
      assertEquals(result[0].isModerator, false, "Should return false for non-moderator");
      console.log("Verification: User is not a moderator.");
    });

    await t.step("should return true for a moderator", async () => {
      await userAuth.grantModerator({ targetUserId: modTestUserId, adminSessionToken: adminSessionToken });
      console.log(`Checking moderator status for moderator: ${modTestUserId}`);
      const result = await userAuth._isModerator({ userId: modTestUserId });
      assert(!("error" in result), `Query failed: ${result.error}`);
      assertEquals(result.length, 1, "Should return exactly one result");
      assertEquals(result[0].isModerator, true, "Should return true for moderator");
      console.log("Verification: User is a moderator.");
    });

    await t.step("should return an error for a non-existent user", async () => {
      const nonExistentUserId = "nonExistentModUser" as ID;
      console.log(`Checking moderator status for non-existent user: ${nonExistentUserId}`);
      const result = await userAuth._isModerator({ userId: nonExistentUserId });
      assert("error" in result, "Query for non-existent user should return an error");
      assertEquals(result.error, "User not found", "Error message should match");
      console.log(`Verification: Failed with expected error: '${result.error}'`);
    });

    // Clean up admin session
    await userAuth.logout({ sessionToken: adminSessionToken });
  });

  await client.close();
});
```
