---
timestamp: 'Fri Nov 07 2025 11:44:45 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_114445.19bec917.md]]'
content_id: ef0d36538341c9f239e00d9f7b498f45cb72a17aa6f10b09b127af0f41e09744
---

# file: src/concepts/UserAuth/UserAuthConcept.test.ts

```typescript
import { assert, assertEquals, assertNotEquals } from "jsr:@std/assert";
import { freshID, testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserAuthConcept from "./UserAuthConcept.ts";

// Helper for checking if a result is an error
const isError = (result: any): result is { error: string } =>
  result && typeof result === "object" && "error" in result;

Deno.test("Principle: users must register and log in before contributing", async (t) => {
  console.log(
    "\n=== Principle Test: Users register and log in ===",
  );
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    let user1Id: ID;
    let user1SessionToken: ID;

    await t.step("1. Register User1", async () => {
      console.log("\n[ACTION] Registering user1 (Alice)");
      const registerResult = await concept.registerUser({
        username: "Alice",
        password: "password123",
      });
      console.log("  Output:", registerResult);
      assertEquals(
        isError(registerResult),
        false,
        "Registration should succeed",
      );
      user1Id = (registerResult as { userId: ID }).userId;
      assert(user1Id, "User1 ID should be returned");
      console.log(`  ✓ Alice registered with ID: ${user1Id}`);
    });

    await t.step("2. Log in User1", async () => {
      console.log("\n[ACTION] Alice attempts to log in");
      const loginResult = await concept.login({
        username: "Alice",
        password: "password123",
      });
      console.log("  Output:", loginResult);
      assertEquals(isError(loginResult), false, "Alice login should succeed");
      user1SessionToken = (loginResult as { sessionToken: ID }).sessionToken;
      assert(user1SessionToken, "Alice's session token should be returned");
      console.log(`  ✓ Alice logged in with session: ${user1SessionToken}`);
    });

    await t.step("3. Verify authenticated user", async () => {
      console.log("\n[ACTION] Get authenticated user for Alice");
      const authResult = await concept.getAuthenticatedUser({
        sessionToken: user1SessionToken,
      });
      console.log("  Output:", authResult);
      assertEquals(
        authResult.userProfile !== null,
        true,
        "Should return a user profile",
      );
      assertEquals(
        authResult.userProfile?.userId,
        user1Id,
        "User ID should match",
      );
      assertEquals(
        authResult.userProfile?.username,
        "Alice",
        "Username should match",
      );
      console.log("  ✓ Alice is authenticated");
    });

    await t.step("4. User1 logs out", async () => {
      console.log("\n[ACTION] Alice logs out");
      const logoutResult = await concept.logout({
        sessionToken: user1SessionToken,
      });
      console.log("  Output:", logoutResult);
      assertEquals(
        (logoutResult as { success: boolean }).success,
        true,
        "Logout should succeed",
      );

      console.log("\n[QUERY] Verify Alice's session is invalidated");
      const authenticatedUser = await concept.getAuthenticatedUser({
        sessionToken: user1SessionToken,
      });
      console.log("  Output:", authenticatedUser);
      assertEquals(
        authenticatedUser.userProfile,
        null,
        "User should not be authenticated after logout",
      );
      console.log("  ✓ Alice's session invalidated");
    });

    console.log(
      "\n✅ Principle demonstrated: Users can register and log in.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: registerUser - ensures unique usernames, non-empty passwords", async (t) => {
  console.log("\n=== Testing registerUser Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  try {
    const username = "testuser";
    const password = "securepassword";

    await t.step("Successful registration", async () => {
      console.log(
        `\n[ACTION] registerUser({ username: "${username}", password: "${password}" })`,
      );
      const result = await concept.registerUser({ username, password });
      console.log("  Output:", result);
      assertEquals(isError(result), false, "Registration should succeed");
      assert((result as { userId: ID }).userId, "User ID should be returned");
      console.log(`  ✓ User "${username}" registered successfully.`);

      const user = await concept.users.findOne({ username });
      assert(user, "User should exist in database");
      assertEquals(user.username, username, "Username should match");
      console.log("  ✓ User details verified in DB.");
    });

    await t.step("Rejection of duplicate username", async () => {
      console.log(
        `\n[ACTION] registerUser({ username: "${username}", password: "${password}" }) (duplicate attempt)`,
      );
      const result = await concept.registerUser({ username, password });
      console.log("  Output:", result);
      assertEquals(isError(result), true, "Duplicate registration should fail");
      assertEquals(
        (result as { error: string }).error,
        "Username already taken",
        "Error message should indicate duplicate username",
      );
      console.log(`  ✓ Duplicate username "${username}" rejected.`);
    });

    await t.step("Rejection of empty password", async () => {
      console.log(
        `\n[ACTION] registerUser({ username: "nopass", password: "" })`,
      );
      const result = await concept.registerUser({
        username: "nopass",
        password: "",
      });
      console.log("  Output:", result);
      assertEquals(
        isError(result),
        true,
        "Empty password registration should fail",
      );
      assertEquals(
        (result as { error: string }).error,
        "Password cannot be empty",
        "Error message should indicate empty password",
      );
      console.log("  ✓ Empty password rejected.");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: login - handles correct/incorrect credentials", async (t) => {
  console.log("\n=== Testing login Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  const username = "loginuser";
  const password = "loginpassword";
  let userId: ID;

  try {
    // Setup: Register a user first
    const registerResult = await concept.registerUser({ username, password });
    userId = (registerResult as { userId: ID }).userId;
    console.log(`[SETUP] Registered user: ${username} (ID: ${userId})`);

    await t.step("Successful login with correct credentials", async () => {
      console.log(
        `\n[ACTION] login({ username: "${username}", password: "${password}" })`,
      );
      const loginResult = await concept.login({ username, password });
      console.log("  Output:", loginResult);
      assertEquals(isError(loginResult), false, "Login should succeed");
      assert(
        (loginResult as { sessionToken: ID }).sessionToken,
        "Session token should be returned",
      );
      console.log(`  ✓ User "${username}" logged in successfully.`);

      // Verify session exists in DB
      const session = await concept.activeSessions.findOne({
        _id: (loginResult as { sessionToken: ID }).sessionToken,
      });
      assert(session, "Session should exist in DB");
      assertEquals(
        session.userId,
        userId,
        "Session should be linked to correct user",
      );
      console.log("  ✓ Session verified in DB.");
    });

    await t.step("Rejection with incorrect password", async () => {
      console.log(
        `\n[ACTION] login({ username: "${username}", password: "wrongpassword" })`,
      );
      const loginResult = await concept.login({
        username,
        password: "wrongpassword",
      });
      console.log("  Output:", loginResult);
      assertEquals(
        isError(loginResult),
        true,
        "Login with wrong password should fail",
      );
      assertEquals(
        (loginResult as { error: string }).error,
        "Invalid username or password",
        "Error message should indicate invalid credentials",
      );
      console.log("  ✓ Login with incorrect password rejected.");
    });

    await t.step("Rejection with non-existent username", async () => {
      console.log(
        `\n[ACTION] login({ username: "nonexistent", password: "${password}" })`,
      );
      const loginResult = await concept.login({
        username: "nonexistent",
        password: password,
      });
      console.log("  Output:", loginResult);
      assertEquals(
        isError(loginResult),
        true,
        "Login with non-existent username should fail",
      );
      assertEquals(
        (loginResult as { error: string }).error,
        "Invalid username or password",
        "Error message should indicate invalid credentials",
      );
      console.log("  ✓ Login with non-existent username rejected.");
    });

    await t.step("Multiple logins create unique sessions", async () => {
      const loginResult1 = await concept.login({ username, password });
      const loginResult2 = await concept.login({ username, password });
      assertNotEquals(
        (loginResult1 as { sessionToken: ID }).sessionToken,
        (loginResult2 as { sessionToken: ID }).sessionToken,
        "Multiple logins should yield unique session tokens",
      );
      console.log("  ✓ Multiple logins result in unique session tokens.");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: logout - invalidates sessions", async (t) => {
  console.log("\n=== Testing logout Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  const username = "logoutuser";
  const password = "logoutpassword";
  let sessionToken: ID;

  try {
    // Setup: Register and login a user
    await concept.registerUser({ username, password });
    const loginResult = await concept.login({ username, password });
    sessionToken = (loginResult as { sessionToken: ID }).sessionToken;
    console.log(
      `[SETUP] Logged in user: ${username} with session: ${sessionToken}`,
    );

    await t.step("Successful logout", async () => {
      console.log(`\n[ACTION] logout({ sessionToken: "${sessionToken}" })`);
      const logoutResult = await concept.logout({ sessionToken });
      console.log("  Output:", logoutResult);
      assertEquals(
        (logoutResult as { success: boolean }).success,
        true,
        "Logout should succeed",
      );
      console.log(`  ✓ Session "${sessionToken}" successfully logged out.`);

      // Verify session is no longer active
      const activeSession = await concept.activeSessions.findOne({
        _id: sessionToken,
      });
      assertEquals(
        activeSession,
        null,
        "Session should be removed from activeSessions",
      );
      console.log("  ✓ Session removed from DB.");
    });

    await t.step(
      "Attempt to logout with an already invalid session",
      async () => {
        console.log(
          `\n[ACTION] logout({ sessionToken: "${sessionToken}" }) (already logged out)`,
        );
        const logoutResult = await concept.logout({ sessionToken });
        console.log("  Output:", logoutResult);
        assertEquals(
          (logoutResult as { success: boolean }).success,
          false,
          "Logging out an invalid session should return false",
        );
        console.log(`  ✓ Attempt to logout invalid session handled correctly.`);
      },
    );

    await t.step("Attempt to logout with a non-existent session", async () => {
      const nonExistentToken = freshID();
      console.log(
        `\n[ACTION] logout({ sessionToken: "${nonExistentToken}" }) (non-existent)`,
      );
      const logoutResult = await concept.logout({
        sessionToken: nonExistentToken,
      });
      console.log("  Output:", logoutResult);
      assertEquals(
        (logoutResult as { success: boolean }).success,
        false,
        "Logging out a non-existent session should return false",
      );
      console.log(
        "  ✓ Attempt to logout non-existent session handled correctly.",
      );
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: getAuthenticatedUser - retrieves user profile or null", async (t) => {
  console.log("\n=== Testing getAuthenticatedUser Action ===");
  const [db, client] = await testDb();
  const concept = new UserAuthConcept(db);

  const username = "authuser";
  const password = "authpassword";
  let userId: ID;
  let sessionToken: ID;

  try {
    // Setup: Register and login a user
    const registerResult = await concept.registerUser({ username, password });
    userId = (registerResult as { userId: ID }).userId;
    const loginResult = await concept.login({ username, password });
    sessionToken = (loginResult as { sessionToken: ID }).sessionToken;
    console.log(
      `[SETUP] Registered and logged in user: ${username} (ID: ${userId}) with session: ${sessionToken}`,
    );

    await t.step("Retrieve profile for a valid session", async () => {
      console.log(
        `\n[ACTION] getAuthenticatedUser({ sessionToken: "${sessionToken}" })`,
      );
      const authResult = await concept.getAuthenticatedUser({ sessionToken });
      console.log("  Output:", authResult);
      assertEquals(
        authResult.userProfile !== null,
        true,
        "Should return a user profile",
      );
      assertEquals(
        authResult.userProfile?.userId,
        userId,
        "User ID should match",
      );
      assertEquals(
        authResult.userProfile?.username,
        username,
        "Username should match",
      );
      console.log("  ✓ User profile retrieved successfully for valid session.");
    });

    await t.step("Return null for an invalid session token", async () => {
      const invalidToken = freshID();
      console.log(
        `\n[ACTION] getAuthenticatedUser({ sessionToken: "${invalidToken}" }) (invalid)`,
      );
      const authResult = await concept.getAuthenticatedUser({
        sessionToken: invalidToken,
      });
      console.log("  Output:", authResult);
      assertEquals(
        authResult.userProfile,
        null,
        "Should return null for invalid session",
      );
      console.log("  ✓ Correctly returned null for invalid session.");
    });

    await t.step(
      "Return null and clean up session if user is missing but session exists (data inconsistency)",
      async () => {
        // Manually create a session for a non-existent user
        const ghostSessionToken = freshID();
        const ghostUserId = freshID();
        await concept.activeSessions.insertOne({
          _id: ghostSessionToken,
          userId: ghostUserId,
          createdAt: new Date(),
        });
        console.log(
          `[SETUP] Created ghost session "${ghostSessionToken}" for non-existent user "${ghostUserId}"`,
        );

        console.log(
          `\n[ACTION] getAuthenticatedUser({ sessionToken: "${ghostSessionToken}" }) (ghost session)`,
        );
        const authResult = await concept.getAuthenticatedUser({
          sessionToken: ghostSessionToken,
        });
        console.log("  Output:", authResult);
        assertEquals(
          authResult.userProfile,
          null,
          "Should return null for ghost session",
        );
        console.log("  ✓ Correctly returned null for ghost session.");

        // Verify the ghost session was cleaned up
        const ghostSession = await concept.activeSessions.findOne({
          _id: ghostSessionToken,
        });
        assertEquals(
          ghostSession,
          null,
          "Ghost session should have been deleted",
        );
        console.log("  ✓ Ghost session cleaned up.");
      },
    );
  } finally {
    await client.close();
  }
});

```
