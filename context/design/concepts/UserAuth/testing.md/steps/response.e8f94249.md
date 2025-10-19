---
timestamp: 'Sat Oct 18 2025 12:23:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_122336.a905e716.md]]'
content_id: e8f942492e57bd9729016c26661b0c0b79652f6ed6f028e53e658a71383aa4aa
---

# response:

Here's the updated `UserAuthConcept.test.ts` file, incorporating all the new actions, updated return types, and the use of `sessionToken` for authenticated actions as per the new `UserAuthConcept.ts` implementation.

```typescript
// file: src/concepts/UserAuth/UserAuthConcept.test.ts
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import UserAuthConcept from "./UserAuthConcept.ts";

// Helper for checking if a result is an error
const isError = (result: any): result is { error: string } =>
  result && typeof result === "object" && "error" in result;

// Principle: users must register and log in before contributing; moderators can verify content
Deno.test("Principle: Users must register, log in, and moderators can verify content", async () => {
  console.log("\n=== Testing Principle Fulfillment ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    // Setup: Create an admin user and manually grant moderator status (bootstrapping)
    console.log("\n[SETUP] Registering principle_admin...");
    const principleAdminRegResult = await concept.registerUser({
      username: "principle_admin",
      password: "admin_pass",
    });
    console.log("  Result:", principleAdminRegResult);
    assertEquals(
      isError(principleAdminRegResult),
      false,
      "Admin registration should succeed.",
    );
    const principleAdminId = (principleAdminRegResult as { userId: ID })
      .userId;
    console.log(`  ✓ Admin registered with ID: ${principleAdminId}`);

    console.log("[SETUP] Manually granting moderator status to principle_admin...");
    await concept.users.updateOne(
      { _id: principleAdminId },
      { $set: { canModerate: true } },
    );
    const adminStatusQuery = await concept._isModerator({
      userId: principleAdminId,
    });
    assertEquals(
      isError(adminStatusQuery),
      false,
      "Admin status query should succeed.",
    );
    assertEquals(
      (adminStatusQuery as Array<{ isModerator: boolean }>)[0].isModerator,
      true,
      "Admin should be a moderator after manual grant.",
    );
    console.log("  ✓ Admin is now a moderator");

    // 1. Admin logs in to get a session token
    console.log("\n[ACTION] Admin login to obtain sessionToken");
    console.log('  Input: { username: "principle_admin", password: "admin_pass" }');
    const adminLoginResult = await concept.login({
      username: "principle_admin",
      password: "admin_pass",
    });
    console.log("  Output:", adminLoginResult);
    assertEquals(isError(adminLoginResult), false, "Admin login should succeed.");
    const adminSessionToken = (adminLoginResult as { sessionToken: string }).sessionToken;
    console.log(`  ✓ Admin logged in with session token: ${adminSessionToken}`);

    // 2. Register User "Contributor"
    console.log("\n[ACTION] registerUser - contributor");
    console.log('  Input: { username: "contributor", password: "pass" }');
    const contributorRegResult = await concept.registerUser({
      username: "contributor",
      password: "pass",
    });
    console.log("  Output:", contributorRegResult);
    assertEquals(isError(contributorRegResult), false);
    const contributorId = (contributorRegResult as { userId: ID }).userId;
    console.log(`  ✓ Contributor registered with ID: ${contributorId}`);

    // 3. Register User "ModeratorCandidate"
    console.log("\n[ACTION] registerUser - moderator_candidate");
    console.log(
      '  Input: { username: "moderator_candidate", password: "pass" }',
    );
    const modCandidateRegResult = await concept.registerUser({
      username: "moderator_candidate",
      password: "pass",
    });
    console.log("  Output:", modCandidateRegResult);
    assertEquals(isError(modCandidateRegResult), false);
    const modCandidateId = (modCandidateRegResult as { userId: ID }).userId;
    console.log(
      `  ✓ Moderator candidate registered with ID: ${modCandidateId}`,
    );

    // 4. Login Contributor
    console.log("\n[ACTION] login - contributor");
    console.log('  Input: { username: "contributor", password: "pass" }');
    const contributorLoginResult = await concept.login({
      username: "contributor",
      password: "pass",
    });
    console.log("  Output:", contributorLoginResult);
    assertEquals(isError(contributorLoginResult), false);
    const contributorSessionToken = (contributorLoginResult as { sessionToken: string }).sessionToken;
    assertEquals(
      typeof contributorSessionToken,
      "string",
      "Contributor login successful, returned session token.",
    );
    console.log(`  ✓ Contributor logged in successfully with session token: ${contributorSessionToken}`);

    // 5. Login ModeratorCandidate (not yet a moderator)
    console.log("\n[ACTION] login - moderator_candidate");
    console.log(
      '  Input: { username: "moderator_candidate", password: "pass" }',
    );
    const modCandidateLoginResult = await concept.login({
      username: "moderator_candidate",
      password: "pass",
    });
    console.log("  Output:", modCandidateLoginResult);
    assertEquals(isError(modCandidateLoginResult), false);
    const modCandidateSessionToken = (modCandidateLoginResult as { sessionToken: string }).sessionToken;
    assertEquals(
      typeof modCandidateSessionToken,
      "string",
      "Moderator Candidate login successful, returned session token.",
    );
    console.log(`  ✓ Moderator candidate logged in successfully with session token: ${modCandidateSessionToken}`);

    // 6. Admin grants moderator status to ModeratorCandidate using adminSessionToken
    console.log("\n[ACTION] grantModerator (by Admin)");
    console.log(
      `  Input: { targetUserId: ${modCandidateId}, adminSessionToken: ${adminSessionToken} }`,
    );
    const grantResult = await concept.grantModerator({
      targetUserId: modCandidateId,
      adminSessionToken: adminSessionToken,
    });
    console.log("  Output:", grantResult);
    assertEquals(
      isError(grantResult),
      false,
      "Grant moderator should succeed.",
    );
    console.log(`  ✓ Moderator privileges granted successfully`);

    // 7. Verify ModeratorCandidate is now a moderator
    console.log("\n[QUERY] _isModerator");
    console.log(`  Input: { userId: ${modCandidateId} }`);
    const isModCandidateMod = await concept._isModerator({
      userId: modCandidateId,
    });
    console.log("  Output:", isModCandidateMod);
    assertEquals(isError(isModCandidateMod), false);
    assertEquals(
      (isModCandidateMod as Array<{ isModerator: boolean }>)[0].isModerator,
      true,
      "Moderator Candidate should now be a moderator.",
    );
    console.log(`  ✓ Verified: User is now a moderator`);

    console.log(
      "\n✅ Principle demonstrated: Users can register, log in, and moderators can verify content",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: registerUser successfully registers users and enforces requirements", async () => {
  console.log("\n=== Testing registerUser Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    // Should register a user successfully
    console.log("\n[TEST] Register a user successfully");
    console.log('  Input: { username: "alice", password: "password123" }');
    const result = await concept.registerUser({
      username: "alice",
      password: "password123",
    });
    console.log("  Output:", result);
    assertEquals(
      isError(result),
      false,
      "Registration should not return an error.",
    );
    const { userId } = result as { userId: ID };
    assertEquals(typeof userId, "string", "User ID should be a string.");
    console.log(`  ✓ User registered successfully with ID: ${userId}`);

    // Verify user details
    console.log("\n[VERIFY] Check user details with _getUserDetails");
    console.log(`  Input: { userId: ${userId} }`);
    const userDetails = await concept._getUserDetails({ userId });
    console.log("  Output:", userDetails);
    assertEquals(
      isError(userDetails),
      false,
      "Should retrieve user details.",
    );
    if (isError(userDetails)) return;
    assertEquals(
      userDetails[0].user.username,
      "alice",
      "Username should match.",
    );
    assertEquals(
      userDetails[0].user.canModerate,
      false,
      "canModerate should be false by default.",
    );
    console.log(
      `  ✓ User details verified: username='alice', canModerate=false`,
    );

    // Should prevent registration with empty password
    console.log("\n[TEST] Prevent registration with empty password");
    console.log('  Input: { username: "bob", password: "" }');
    const emptyPasswordResult = await concept.registerUser({
      username: "bob",
      password: "",
    });
    console.log("  Output:", emptyPasswordResult);
    assertEquals(
      isError(emptyPasswordResult),
      true,
      "Should return an error for empty password.",
    );
    assertEquals(
      (emptyPasswordResult as { error: string }).error,
      "Password cannot be empty",
      "Error message should indicate empty password.",
    );
    console.log(`  ✓ Correctly rejected empty password`);

    // Should prevent registration with duplicate username
    console.log("\n[TEST] Prevent registration with duplicate username");
    console.log('  Step 1: Register "charlie"');
    console.log('  Input: { username: "charlie", password: "password123" }');
    const charlieResult = await concept.registerUser({
      username: "charlie",
      password: "password123",
    });
    console.log("  Output:", charlieResult);
    assertEquals(
      isError(charlieResult),
      false,
      "First registration should succeed.",
    );
    console.log(`  ✓ First registration succeeded`);

    console.log('  Step 2: Try to register "charlie" again');
    console.log(
      '  Input: { username: "charlie", password: "anotherpassword" }',
    );
    const duplicateCharlieResult = await concept.registerUser({
      username: "charlie",
      password: "anotherpassword",
    });
    console.log("  Output:", duplicateCharlieResult);
    assertEquals(
      isError(duplicateCharlieResult),
      true,
      "Should return an error for duplicate username.",
    );
    assertEquals(
      (duplicateCharlieResult as { error: string }).error,
      "Username already taken",
      "Error message should indicate duplicate username.",
    );
    console.log(`  ✓ Correctly rejected duplicate username`);

    console.log("\n✅ All registerUser requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Action: login allows valid users and rejects invalid credentials", async () => {
  console.log("\n=== Testing login Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    const testUsername = "diana";
    const testPassword = "securepassword";

    // Setup: Register user
    console.log("\n[SETUP] Register user for login tests");
    console.log(
      `  Input: { username: "${testUsername}", password: "${testPassword}" }`,
    );
    const registerResult = await concept.registerUser({
      username: testUsername,
      password: testPassword,
    });
    console.log("  Output:", registerResult);
    assertEquals(isError(registerResult), false);
    const dianaId = (registerResult as { userId: ID }).userId;
    console.log(`  ✓ User registered with ID: ${dianaId}`);

    // Should allow a user to login successfully
    console.log("\n[TEST] Login with valid credentials");
    console.log(
      `  Input: { username: "${testUsername}", password: "${testPassword}" }`,
    );
    const loginResult = await concept.login({
      username: testUsername,
      password: testPassword,
    });
    console.log("  Output:", loginResult);
    assertEquals(isError(loginResult), false, "Login should succeed.");
    const { sessionToken } = loginResult as { sessionToken: string };
    assertEquals(
      typeof sessionToken,
      "string",
      "Returned sessionToken should be a string.",
    );
    console.log(`  ✓ Login successful, returned sessionToken: ${sessionToken}`);

    // Verify sessionToken with getAuthenticatedUser
    console.log("\n[VERIFY] Check authenticated user with _getAuthenticatedUser");
    const authUserResult = await concept.getAuthenticatedUser({ sessionToken });
    console.log("  Output:", authUserResult);
    assertEquals(authUserResult.userProfile?.userId, dianaId, "Authenticated user ID should match.");
    assertEquals(authUserResult.userProfile?.username, testUsername, "Authenticated username should match.");
    console.log("  ✓ Session token successfully verified.");

    // Should prevent login with incorrect password
    console.log("\n[TEST] Reject login with incorrect password");
    console.log(
      `  Input: { username: "${testUsername}", password: "wrongpassword" }`,
    );
    const wrongPasswordResult = await concept.login({
      username: testUsername,
      password: "wrongpassword",
    });
    console.log("  Output:", wrongPasswordResult);
    assertEquals(
      isError(wrongPasswordResult),
      true,
      "Login should fail with wrong password.",
    );
    assertEquals(
      (wrongPasswordResult as { error: string }).error,
      "Invalid username or password",
      "Error message should indicate invalid credentials.",
    );
    console.log(`  ✓ Correctly rejected incorrect password`);

    // Should prevent login with non-existent username
    console.log("\n[TEST] Reject login with non-existent username");
    console.log('  Input: { username: "eve", password: "anypassword" }');
    const nonExistentResult = await concept.login({
      username: "eve",
      password: "anypassword",
    });
    console.log("  Output:", nonExistentResult);
    assertEquals(
      isError(nonExistentResult),
      true,
      "Login should fail for non-existent user.",
    );
    assertEquals(
      (nonExistentResult as { error: string }).error,
      "Invalid username or password",
      "Error message should indicate invalid credentials.",
    );
    console.log(`  ✓ Correctly rejected non-existent username`);

    console.log("\n✅ All login requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Action: logout successfully invalidates sessions", async () => {
  console.log("\n=== Testing logout Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    const username = "john_doe";
    const password = "password123";

    // Setup: Register and login a user
    console.log("\n[SETUP] Register user 'john_doe'");
    const regResult = await concept.registerUser({ username, password });
    assertEquals(isError(regResult), false, "Registration should succeed.");
    const userId = (regResult as { userId: ID }).userId;
    console.log(`  ✓ User registered with ID: ${userId}`);

    console.log("\n[SETUP] Login user 'john_doe'");
    const loginResult = await concept.login({ username, password });
    assertEquals(isError(loginResult), false, "Login should succeed.");
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`  ✓ User logged in with session token: ${sessionToken}`);

    console.log("\n[VERIFY] Check session is active before logout");
    const authUserBeforeLogout = await concept.getAuthenticatedUser({ sessionToken });
    assertEquals(authUserBeforeLogout.userProfile?.userId, userId, "Session should be active.");
    console.log("  ✓ Session active before logout.");

    // Should logout a user successfully
    console.log("\n[TEST] Logout active session");
    console.log(`  Input: { sessionToken: ${sessionToken} }`);
    const logoutResult = await concept.logout({ sessionToken });
    console.log("  Output:", logoutResult);
    assertEquals(logoutResult.success, true, "Logout should succeed.");
    console.log("  ✓ Session successfully logged out.");

    // Verify session is no longer active
    console.log("\n[VERIFY] Check session is inactive after logout");
    const authUserAfterLogout = await concept.getAuthenticatedUser({ sessionToken });
    assertEquals(authUserAfterLogout.userProfile, null, "Session should be null after logout.");
    console.log("  ✓ Session is inactive after logout.");

    // Should gracefully handle logging out a non-existent session
    console.log("\n[TEST] Attempt to logout a non-existent session");
    const fakeSessionToken = freshID();
    console.log(`  Input: { sessionToken: ${fakeSessionToken} }`);
    const fakeLogoutResult = await concept.logout({ sessionToken: fakeSessionToken });
    console.log("  Output:", fakeLogoutResult);
    assertEquals(fakeLogoutResult.success, false, "Logout of non-existent session should return false.");
    console.log("  ✓ Gracefully handled logout of non-existent session.");

    console.log("\n✅ All logout requirements verified");
  } finally {
    await client.close();
  }
});

Deno.test("Action: getAuthenticatedUser correctly retrieves user data or null", async () => {
  console.log("\n=== Testing getAuthenticatedUser Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    const username = "karen";
    const password = "password";

    // Setup: Register a user
    console.log("\n[SETUP] Register user 'karen'");
    const regResult = await concept.registerUser({ username, password });
    assertEquals(isError(regResult), false, "Registration should succeed.");
    const userId = (regResult as { userId: ID }).userId;
    console.log(`  ✓ User registered with ID: ${userId}`);

    // Login the user
    console.log("\n[SETUP] Login user 'karen'");
    const loginResult = await concept.login({ username, password });
    assertEquals(isError(loginResult), false, "Login should succeed.");
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`  ✓ User logged in with session token: ${sessionToken}`);

    // Should return user profile for a valid session token
    console.log("\n[TEST] Get authenticated user for valid session");
    console.log(`  Input: { sessionToken: ${sessionToken} }`);
    const authResult = await concept.getAuthenticatedUser({ sessionToken });
    console.log("  Output:", authResult);
    assertEquals(authResult.userProfile !== null, true, "Should return a user profile.");
    assertEquals(authResult.userProfile?.userId, userId, "User ID should match.");
    assertEquals(authResult.userProfile?.username, username, "Username should match.");
    assertEquals(authResult.userProfile?.canModerate, false, "canModerate should be false.");
    console.log("  ✓ Successfully retrieved user profile for valid session.");

    // Should return null for an invalid session token
    console.log("\n[TEST] Get authenticated user for invalid session");
    const fakeSessionToken = freshID();
    console.log(`  Input: { sessionToken: ${fakeSessionToken} }`);
    const invalidAuthResult = await concept.getAuthenticatedUser({ sessionToken: fakeSessionToken });
    console.log("  Output:", invalidAuthResult);
    assertEquals(invalidAuthResult.userProfile, null, "Should return null for invalid session.");
    console.log("  ✓ Correctly returned null for invalid session.");

    // Simulate data inconsistency: session exists but user is deleted
    console.log("\n[TEST] Simulate session with deleted user and verify cleanup");
    const userToDeleteUsername = "user_to_delete";
    const userToDeletePassword = "password";
    const userToDeleteReg = await concept.registerUser({ username: userToDeleteUsername, password: userToDeletePassword });
    const userToDeleteId = (userToDeleteReg as { userId: ID }).userId;
    const userToDeleteLogin = await concept.login({ username: userToDeleteUsername, password: userToDeletePassword });
    const userToDeleteSessionToken = (userToDeleteLogin as { sessionToken: string }).sessionToken;

    // Manually delete the user from the database (simulating external deletion or bug)
    await concept.users.deleteOne({ _id: userToDeleteId });
    console.log(`  ✓ Simulated deletion of user ${userToDeleteId}`);

    console.log(`  Input: { sessionToken: ${userToDeleteSessionToken} }`);
    const inconsistentAuthResult = await concept.getAuthenticatedUser({ sessionToken: userToDeleteSessionToken });
    console.log("  Output:", inconsistentAuthResult);
    assertEquals(inconsistentAuthResult.userProfile, null, "Should return null for inconsistent session.");
    // Verify the session was cleaned up
    const sessionAfterCleanup = await concept.activeSessions.findOne({ _id: userToDeleteSessionToken });
    assertEquals(sessionAfterCleanup, null, "Inconsistent session should be cleaned up.");
    console.log("  ✓ Inconsistent session handled and cleaned up.");

    console.log("\n✅ All getAuthenticatedUser requirements verified");
  } finally {
    await client.close();
  }
});


Deno.test("Action: changePassword allows users to update password and invalidates sessions", async () => {
  console.log("\n=== Testing changePassword Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    const username = "liam";
    const oldPassword = "old_password";
    const newPassword = "new_secure_password";

    // Setup: Register and login a user
    console.log("\n[SETUP] Register user 'liam'");
    const regResult = await concept.registerUser({ username, password: oldPassword });
    assertEquals(isError(regResult), false, "Registration should succeed.");
    const userId = (regResult as { userId: ID }).userId;
    console.log(`  ✓ User registered with ID: ${userId}`);

    console.log("\n[SETUP] Login user 'liam' to get initial session");
    const loginResult1 = await concept.login({ username, password: oldPassword });
    assertEquals(isError(loginResult1), false, "First login should succeed.");
    const sessionToken1 = (loginResult1 as { sessionToken: string }).sessionToken;
    console.log(`  ✓ User logged in with session token 1: ${sessionToken1}`);

    console.log("\n[SETUP] Login user 'liam' again to get a second session (for invalidation test)");
    const loginResult2 = await concept.login({ username, password: oldPassword });
    assertEquals(isError(loginResult2), false, "Second login should succeed.");
    const sessionToken2 = (loginResult2 as { sessionToken: string }).sessionToken;
    console.log(`  ✓ User logged in with session token 2: ${sessionToken2}`);

    // Test successful password change
    console.log("\n[TEST] Change password with valid old and new passwords");
    console.log(`  Input: { sessionToken: ${sessionToken1}, oldPassword: "${oldPassword}", newPassword: "${newPassword}" }`);
    const changePwdResult = await concept.changePassword({
      sessionToken: sessionToken1,
      oldPassword: oldPassword,
      newPassword: newPassword,
    });
    console.log("  Output:", changePwdResult);
    assertEquals(isError(changePwdResult), false, "Password change should succeed.");
    assertEquals((changePwdResult as { success: boolean }).success, true, "Password change should return success: true.");
    console.log("  ✓ Password successfully changed.");

    // Verify old sessions are invalidated
    console.log("\n[VERIFY] Check if session 1 is invalidated");
    const authOldSession1 = await concept.getAuthenticatedUser({ sessionToken: sessionToken1 });
    assertEquals(authOldSession1.userProfile, null, "Old session 1 should be invalidated.");
    console.log("  ✓ Old session 1 invalidated.");

    console.log("\n[VERIFY] Check if session 2 is invalidated");
    const authOldSession2 = await concept.getAuthenticatedUser({ sessionToken: sessionToken2 });
    assertEquals(authOldSession2.userProfile, null, "Old session 2 should be invalidated.");
    console.log("  ✓ Old session 2 invalidated.");

    // Verify login with new password works
    console.log("\n[VERIFY] Login with new password");
    const newLoginResult = await concept.login({ username, password: newPassword });
    assertEquals(isError(newLoginResult), false, "Login with new password should succeed.");
    const newSessionToken = (newLoginResult as { sessionToken: string }).sessionToken;
    assertEquals(typeof newSessionToken, "string", "New login should return a session token.");
    console.log("  ✓ Login with new password successful.");

    // Test changing password with incorrect old password
    console.log("\n[TEST] Attempt to change password with incorrect old password");
    const tempSessionResult = await concept.login({ username, password: newPassword }); // Need a new session
    const tempSessionToken = (tempSessionResult as { sessionToken: string }).sessionToken;
    console.log(`  Input: { sessionToken: ${tempSessionToken}, oldPassword: "wrong_password", newPassword: "even_newer_password" }`);
    const wrongOldPwdResult = await concept.changePassword({
      sessionToken: tempSessionToken,
      oldPassword: "wrong_password",
      newPassword: "even_newer_password",
    });
    console.log("  Output:", wrongOldPwdResult);
    assertEquals(isError(wrongOldPwdResult), true, "Should return an error for incorrect old password.");
    assertEquals((wrongOldPwdResult as { error: string }).error, "Old password does not match", "Error message should match.");
    // Verify session is NOT invalidated in this case
    const authTempSession = await concept.getAuthenticatedUser({ sessionToken: tempSessionToken });
    assertEquals(authTempSession.userProfile?.userId, userId, "Session should NOT be invalidated for incorrect old password.");
    console.log("  ✓ Correctly rejected incorrect old password, session not invalidated.");


    // Test changing password with empty new password
    console.log("\n[TEST] Attempt to change password with empty new password");
    console.log(`  Input: { sessionToken: ${tempSessionToken}, oldPassword: "${newPassword}", newPassword: "" }`);
    const emptyNewPwdResult = await concept.changePassword({
      sessionToken: tempSessionToken,
      oldPassword: newPassword,
      newPassword: "",
    });
    console.log("  Output:", emptyNewPwdResult);
    assertEquals(isError(emptyNewPwdResult), true, "Should return an error for empty new password.");
    assertEquals((emptyNewPwdResult as { error: string }).error, "New password cannot be empty", "Error message should match.");
    console.log("  ✓ Correctly rejected empty new password.");

    // Test changing password with invalid session token
    console.log("\n[TEST] Attempt to change password with invalid session token");
    const fakeSessionToken = freshID();
    console.log(`  Input: { sessionToken: ${fakeSessionToken}, oldPassword: "any", newPassword: "any" }`);
    const invalidSessionResult = await concept.changePassword({
      sessionToken: fakeSessionToken,
      oldPassword: "any",
      newPassword: "any",
    });
    console.log("  Output:", invalidSessionResult);
    assertEquals(isError(invalidSessionResult), true, "Should return an error for invalid session token.");
    assertEquals((invalidSessionResult as { error: string }).error, "Invalid session", "Error message should match.");
    console.log("  ✓ Correctly rejected invalid session token.");

    console.log("\n✅ All changePassword requirements verified");
  } finally {
    await client.close();
  }
});


Deno.test("Action: grantModerator allows admins to grant privileges and enforces requirements", async () => {
  console.log("\n=== Testing grantModerator Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    // Setup: Register admin user 'frank'
    console.log("\n[SETUP] Register admin user 'frank'");
    const frankRegister = await concept.registerUser({
      username: "frank",
      password: "password",
    });
    assertEquals(isError(frankRegister), false);
    const adminUserId = (frankRegister as { userId: ID }).userId;
    console.log(`  ✓ Frank registered with ID: ${adminUserId}`);

    console.log("\n[SETUP] Register target user 'grace'");
    const graceRegister = await concept.registerUser({
      username: "grace",
      password: "password",
    });
    assertEquals(isError(graceRegister), false);
    const targetUserId = (graceRegister as { userId: ID }).userId;
    console.log(`  ✓ Grace registered with ID: ${targetUserId}`);

    console.log("\n[SETUP] Register non-mod user 'heidi'");
    const heidiRegister = await concept.registerUser({
      username: "heidi",
      password: "password",
    });
    assertEquals(isError(heidiRegister), false);
    const nonModUserId = (heidiRegister as { userId: ID }).userId;
    console.log(`  ✓ Heidi registered with ID: ${nonModUserId}`);

    // Manually set 'frank' as moderator (bootstrapping for this test)
    console.log("\n[SETUP] Manually grant frank moderator status");
    await concept.users.updateOne(
      { _id: adminUserId },
      { $set: { canModerate: true } },
    );
    const frankStatus = await concept._isModerator({ userId: adminUserId });
    assertEquals(
      (frankStatus as Array<{ isModerator: boolean }>)[0].isModerator,
      true,
      "Frank should be a moderator.",
    );
    console.log(`  ✓ Frank is now a moderator`);

    // Login 'frank' to get an adminSessionToken
    console.log("\n[SETUP] Login admin 'frank' to get session token");
    const adminLoginResult = await concept.login({ username: "frank", password: "password" });
    assertEquals(isError(adminLoginResult), false);
    const adminSessionToken = (adminLoginResult as { sessionToken: string }).sessionToken;
    console.log(`  ✓ Admin 'frank' logged in with session token: ${adminSessionToken}`);

    // Login 'heidi' to get a nonModSessionToken
    console.log("\n[SETUP] Login non-mod 'heidi' to get session token");
    const nonModLoginResult = await concept.login({ username: "heidi", password: "password" });
    assertEquals(isError(nonModLoginResult), false);
    const nonModSessionToken = (nonModLoginResult as { sessionToken: string }).sessionToken;
    console.log(`  ✓ Non-mod 'heidi' logged in with session token: ${nonModSessionToken}`);


    // Should allow an admin to grant moderator privileges
    console.log("\n[TEST] Admin grants moderator privileges to target user 'grace'");
    console.log(
      `  Input: { targetUserId: ${targetUserId}, adminSessionToken: ${adminSessionToken} }`,
    );
    const grantResult = await concept.grantModerator({
      targetUserId,
      adminSessionToken,
    });
    console.log("  Output:", grantResult);
    assertEquals(
      isError(grantResult),
      false,
      "Grant moderator should succeed.",
    );
    assertEquals((grantResult as { success: boolean }).success, true, "Grant moderator should return success: true.");
    console.log(`  ✓ Grant moderator succeeded`);

    console.log("\n[VERIFY] Check target user 'grace' is now a moderator");
    console.log(`  Input: { userId: ${targetUserId} }`);
    const isGraceMod = await concept._isModerator({ userId: targetUserId });
    console.log("  Output:", isGraceMod);
    assertEquals(isError(isGraceMod), false);
    assertEquals(
      (isGraceMod as Array<{ isModerator: boolean }>)[0].isModerator,
      true,
      "Target user should now be a moderator.",
    );
    console.log(`  ✓ Target user is now a moderator`);

    // Should prevent non-moderator from granting privileges
    console.log("\n[TEST] Reject grant by non-moderator 'heidi'");
    console.log(
      `  Input: { targetUserId: ${targetUserId}, adminSessionToken: ${nonModSessionToken} }`,
    );
    const nonModGrantResult = await concept.grantModerator({
      targetUserId,
      adminSessionToken: nonModSessionToken,
    });
    console.log("  Output:", nonModGrantResult);
    assertEquals(
      isError(nonModGrantResult),
      true,
      "Grant moderator by non-mod should fail.",
    );
    assertEquals(
      (nonModGrantResult as { error: string }).error,
      "Admin user does not have moderator privileges",
      "Error message should indicate insufficient privileges.",
    );
    console.log(`  ✓ Correctly rejected non-moderator attempt`);

    // Should prevent granting privileges by non-existent admin session
    console.log("\n[TEST] Reject grant by non-existent admin session");
    const fakeAdminSessionToken = freshID();
    console.log(
      `  Input: { targetUserId: ${targetUserId}, adminSessionToken: ${fakeAdminSessionToken} }`,
    );
    const fakeAdminGrantResult = await concept.grantModerator({
      targetUserId,
      adminSessionToken: fakeAdminSessionToken,
    });
    console.log("  Output:", fakeAdminGrantResult);
    assertEquals(
      isError(fakeAdminGrantResult),
      true,
      "Should fail for non-existent admin session.",
    );
    assertEquals(
      (fakeAdminGrantResult as { error: string }).error,
      "Invalid admin session",
      "Error message should indicate invalid admin session.",
    );
    console.log(`  ✓ Correctly rejected non-existent admin session`);

    // Should prevent granting privileges to non-existent target user
    console.log("\n[TEST] Reject grant to non-existent target user");
    const fakeTargetId = freshID();
    console.log(
      `  Input: { targetUserId: ${fakeTargetId}, adminSessionToken: ${adminSessionToken} }`,
    );
    const fakeTargetGrantResult = await concept.grantModerator({
      targetUserId: fakeTargetId,
      adminSessionToken,
    });
    console.log("  Output:", fakeTargetGrantResult);
    assertEquals(
      isError(fakeTargetGrantResult),
      true,
      "Should fail for non-existent target user.",
    );
    assertEquals(
      (fakeTargetGrantResult as { error: string }).error,
      "Target user not found",
      "Error message should indicate target user not found.",
    );
    console.log(`  ✓ Correctly rejected non-existent target user`);

    console.log("\n✅ All grantModerator requirements verified");
  } finally {
    await client.close();
  }
});


Deno.test("Action: revokeModerator allows admins to revoke privileges and enforces requirements", async () => {
  console.log("\n=== Testing revokeModerator Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    // Setup: Register admin user 'oliver'
    console.log("\n[SETUP] Register admin user 'oliver'");
    const oliverReg = await concept.registerUser({ username: "oliver", password: "admin_pass" });
    assertEquals(isError(oliverReg), false);
    const oliverId = (oliverReg as { userId: ID }).userId;
    await concept.users.updateOne({ _id: oliverId }, { $set: { canModerate: true } }); // Manually make admin
    console.log(`  ✓ Oliver registered and made admin: ${oliverId}`);

    // Login admin 'oliver'
    console.log("\n[SETUP] Login admin 'oliver'");
    const oliverLogin = await concept.login({ username: "oliver", password: "admin_pass" });
    assertEquals(isError(oliverLogin), false);
    const adminSessionToken = (oliverLogin as { sessionToken: string }).sessionToken;
    console.log(`  ✓ Admin 'oliver' logged in with session token: ${adminSessionToken}`);

    // Setup: Register target user 'patricia'
    console.log("\n[SETUP] Register target user 'patricia'");
    const patriciaReg = await concept.registerUser({ username: "patricia", password: "user_pass" });
    assertEquals(isError(patriciaReg), false);
    const patriciaId = (patriciaReg as { userId: ID }).userId;
    console.log(`  ✓ Patricia registered: ${patriciaId}`);

    // Grant Patricia moderator status initially
    console.log("\n[SETUP] Grant 'patricia' moderator status (via admin)");
    const grantResult = await concept.grantModerator({ targetUserId: patriciaId, adminSessionToken });
    assertEquals(isError(grantResult), false, "Granting moderator status should succeed.");
    const isPatriciaModBeforeRevoke = await concept._isModerator({ userId: patriciaId });
    assertEquals(isError(isPatriciaModBeforeRevoke), false);
    assertEquals((isPatriciaModBeforeRevoke as Array<{ isModerator: boolean }>)[0].isModerator, true, "Patricia should be a moderator.");
    console.log("  ✓ Patricia is now a moderator.");

    // Should allow an admin to revoke moderator privileges
    console.log("\n[TEST] Admin revokes moderator privileges from 'patricia'");
    console.log(`  Input: { targetUserId: ${patriciaId}, adminSessionToken: ${adminSessionToken} }`);
    const revokeResult = await concept.revokeModerator({ targetUserId: patriciaId, adminSessionToken });
    console.log("  Output:", revokeResult);
    assertEquals(isError(revokeResult), false, "Revoking moderator should succeed.");
    assertEquals((revokeResult as { success: boolean }).success, true, "Revoke moderator should return success: true.");
    console.log("  ✓ Moderator privileges revoked.");

    // Verify Patricia is no longer a moderator
    console.log("\n[VERIFY] Check 'patricia' is no longer a moderator");
    const isPatriciaModAfterRevoke = await concept._isModerator({ userId: patriciaId });
    console.log("  Output:", isPatriciaModAfterRevoke);
    assertEquals(isError(isPatriciaModAfterRevoke), false);
    assertEquals((isPatriciaModAfterRevoke as Array<{ isModerator: boolean }>)[0].isModerator, false, "Patricia should no longer be a moderator.");
    console.log("  ✓ Patricia is no longer a moderator.");

    // Test revoking privileges from a user who is not a moderator (idempotency)
    console.log("\n[TEST] Attempt to revoke moderator from a non-moderator (idempotency)");
    const nonModUserReg = await concept.registerUser({ username: "qbert", password: "pass" });
    const nonModUserId = (nonModUserReg as { userId: ID }).userId;
    console.log(`  Input: { targetUserId: ${nonModUserId}, adminSessionToken: ${adminSessionToken} }`);
    const revokeNonModResult = await concept.revokeModerator({ targetUserId: nonModUserId, adminSessionToken });
    console.log("  Output:", revokeNonModResult);
    assertEquals(isError(revokeNonModResult), false, "Revoking non-moderator should succeed (idempotent).");
    assertEquals((revokeNonModResult as { success: boolean }).success, true, "Should return success: true.");
    const isQbertMod = await concept._isModerator({ userId: nonModUserId });
    assertEquals(isError(isQbertMod), false);
    assertEquals((isQbertMod as Array<{ isModerator: boolean }>)[0].isModerator, false, "Qbert should remain non-moderator.");
    console.log("  ✓ Correctly handled revoking non-moderator (idempotent).");

    // Test revoking privileges by a non-admin
    console.log("\n[TEST] Reject revoke by non-admin");
    const regularUserReg = await concept.registerUser({ username: "ryan", password: "user_pass" });
    const regularUserId = (regularUserReg as { userId: ID }).userId;
    const regularUserLogin = await concept.login({ username: "ryan", password: "user_pass" });
    const regularUserSessionToken = (regularUserLogin as { sessionToken: string }).sessionToken;

    console.log(`  Input: { targetUserId: ${patriciaId}, adminSessionToken: ${regularUserSessionToken} }`);
    const nonAdminRevokeResult = await concept.revokeModerator({ targetUserId: patriciaId, adminSessionToken: regularUserSessionToken });
    console.log("  Output:", nonAdminRevokeResult);
    assertEquals(isError(nonAdminRevokeResult), true, "Revoke by non-admin should fail.");
    assertEquals((nonAdminRevokeResult as { error: string }).error, "Admin user does not have moderator privileges", "Error message should match.");
    console.log("  ✓ Correctly rejected non-admin revoke attempt.");

    // Test revoking privileges to non-existent target user
    console.log("\n[TEST] Reject revoke to non-existent target user");
    const fakeTargetId = freshID();
    console.log(`  Input: { targetUserId: ${fakeTargetId}, adminSessionToken: ${adminSessionToken} }`);
    const fakeTargetRevokeResult = await concept.revokeModerator({ targetUserId: fakeTargetId, adminSessionToken });
    console.log("  Output:", fakeTargetRevokeResult);
    assertEquals(isError(fakeTargetRevokeResult), true, "Should fail for non-existent target user.");
    assertEquals((fakeTargetRevokeResult as { error: string }).error, "Target user not found", "Error message should match.");
    console.log("  ✓ Correctly rejected non-existent target user.");

    console.log("\n✅ All revokeModerator requirements verified");
  } finally {
    await client.close();
  }
});


Deno.test("Queries: _getUserDetails and _isModerator retrieve correct information", async () => {
  console.log("\n=== Testing Query Operations ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    const queryUsername = "irene";
    const queryPassword = "querypass";

    // Setup: Register user
    console.log("\n[SETUP] Register user for query tests");
    console.log(
      `  Input: { username: "${queryUsername}", password: "${queryPassword}" }`,
    );
    const registerResult = await concept.registerUser({
      username: queryUsername,
      password: queryPassword,
    });
    console.log("  Output:", registerResult);
    assertEquals(isError(registerResult), false);
    const ireneId = (registerResult as { userId: ID }).userId;
    console.log(`  ✓ User registered with ID: ${ireneId}`);

    // Should retrieve user details for an existing user
    console.log("\n[TEST] Query _getUserDetails for existing user");
    console.log(`  Input: { userId: ${ireneId} }`);
    const userDetails = await concept._getUserDetails({ userId: ireneId });
    console.log("  Output:", userDetails);
    assertEquals(isError(userDetails), false, "Query should succeed.");
    if (isError(userDetails)) return;
    assertEquals(
      userDetails.length,
      1,
      "Should return exactly one user detail.",
    );
    assertEquals(
      userDetails[0].user.username,
      queryUsername,
      "Username in details should match.",
    );
    assertEquals(
      userDetails[0].user.canModerate,
      false,
      "canModerate in details should be false.",
    );
    console.log(
      `  ✓ User details retrieved: username='${queryUsername}', canModerate=false`,
    );

    // Should return error for non-existent user details
    console.log("\n[TEST] Query _getUserDetails for non-existent user");
    const fakeId = freshID();
    console.log(`  Input: { userId: ${fakeId} }`);
    const fakeUserDetails = await concept._getUserDetails({ userId: fakeId });
    console.log("  Output:", fakeUserDetails);
    assertEquals(
      isError(fakeUserDetails),
      true,
      "Query should return an error.",
    );
    assertEquals(
      (fakeUserDetails as { error: string }).error,
      "User not found",
      "Error message should indicate user not found.",
    );
    console.log(`  ✓ Correctly returned error for non-existent user`);

    // Should correctly report moderator status for regular user
    console.log("\n[TEST] Query _isModerator for regular user");
    console.log(`  Input: { userId: ${ireneId} }`);
    const isIreneMod = await concept._isModerator({ userId: ireneId });
    console.log("  Output:", isIreneMod);
    assertEquals(isError(isIreneMod), false);
    assertEquals(
      (isIreneMod as Array<{ isModerator: boolean }>)[0].isModerator,
      false,
      "Irene should not be a moderator.",
    );
    console.log(`  ✓ Correctly reported isModerator=false for regular user`);

    // Should correctly report moderator status for a moderator
    console.log("\n[TEST] Query _isModerator for moderator user");
    console.log("  Setup: Register and promote a moderator");
    const localAdminRegResult = await concept.registerUser({
      username: "local_admin_for_query_test",
      password: "password",
    });
    assertEquals(
      isError(localAdminRegResult),
      false,
      "Local admin registration should succeed.",
    );
    const localAdminId = (localAdminRegResult as { userId: ID }).userId;
    await concept.users.updateOne({ _id: localAdminId }, {
      $set: { canModerate: true },
    });
    console.log(`  ✓ Moderator user created with ID: ${localAdminId}`);

    console.log(`  Input: { userId: ${localAdminId} }`);
    const isLocalAdminMod = await concept._isModerator({
      userId: localAdminId,
    });
    console.log("  Output:", isLocalAdminMod);
    assertEquals(isError(isLocalAdminMod), false);
    assertEquals(
      (isLocalAdminMod as Array<{ isModerator: boolean }>)[0].isModerator,
      true,
      "Local Admin should be a moderator.",
    );
    console.log(`  ✓ Correctly reported isModerator=true for moderator`);

    // Should return error for non-existent user moderator status
    console.log("\n[TEST] Query _isModerator for non-existent user");
    const fakeModId = freshID();
    console.log(`  Input: { userId: ${fakeModId} }`);
    const isModResult = await concept._isModerator({ userId: fakeModId });
    console.log("  Output:", isModResult);
    assertEquals(
      isError(isModResult),
      true,
      "Query should return an error.",
    );
    assertEquals(
      (isModResult as { error: string }).error,
      "User not found",
      "Error message should indicate user not found.",
    );
    console.log(`  ✓ Correctly returned error for non-existent user`);

    console.log("\n✅ All query operations verified");
  } finally {
    await client.close();
  }
});
```
