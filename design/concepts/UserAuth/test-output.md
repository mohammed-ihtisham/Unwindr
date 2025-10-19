(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:user
Task test:user deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/UserAuth/UserAuthConcept.test.ts
running 10 tests from ./src/concepts/UserAuth/UserAuthConcept.test.ts
Principle: users must register and log in before contributing; moderators can verify content ...
------- output -------

=== Principle Test: Users register, log in, and moderation flow ===
----- output end -----
  1. Register User1 ...
------- output -------

[ACTION] Registering user1 (Alice)
  Output: { userId: "0199f9f9-b79b-7074-8d18-f06bac36d79c" }
  ✓ Alice registered with ID: 0199f9f9-b79b-7074-8d18-f06bac36d79c
----- output end -----
  1. Register User1 ... ok (286ms)
  2. Register Admin User ...
------- output -------

[ACTION] Registering admin user (Bob)
  Output: { userId: "0199f9f9-b81b-7f5f-b0a6-f2fb563f94a6" }
  ✓ BobAdmin registered with ID: 0199f9f9-b81b-7f5f-b0a6-f2fb563f94a6
----- output end -----
  2. Register Admin User ... ok (124ms)
  3. Log in User1 ...
------- output -------

[ACTION] Alice attempts to log in
  Output: { sessionToken: "0199f9f9-b896-786c-ba98-e002cd28221f" }
  ✓ Alice logged in with session: 0199f9f9-b896-786c-ba98-e002cd28221f
----- output end -----
  3. Log in User1 ... ok (124ms)
  4. Log in Admin User and grant moderator privilege to themselves ...
------- output -------

[ACTION] BobAdmin attempts to log in
  Output: { sessionToken: "0199f9f9-b910-7816-8b1f-5d0d5125d94d" }
  ✓ BobAdmin logged in with session: 0199f9f9-b910-7816-8b1f-5d0d5125d94d

[ACTION] BobAdmin grants themselves moderator status
  Output: { success: true }

[QUERY] Verify BobAdmin is a moderator
  Output: [ { isModerator: true } ]
  ✓ BobAdmin is confirmed as a moderator
----- output end -----
  4. Log in Admin User and grant moderator privilege to themselves ... ok (200ms)
  5. User1 (non-moderator) attempts to grant moderator status (should fail) ...
------- output -------

[ACTION] Alice (non-moderator) attempts to grant moderator status to someone
  Output: { error: "Admin user does not have moderator privileges" }
  ✓ Alice correctly prevented from granting moderator status
----- output end -----
  5. User1 (non-moderator) attempts to grant moderator status (should fail) ... ok (33ms)
  6. Admin grants moderator privilege to User1 ...
------- output -------

[ACTION] BobAdmin grants Alice moderator status
  Output: { success: true }

[QUERY] Verify Alice is now a moderator
  Output: [ { isModerator: true } ]
  ✓ Alice is confirmed as a moderator
----- output end -----
  6. Admin grants moderator privilege to User1 ... ok (78ms)
  7. User1 (now moderator) attempts to revoke moderator status (should succeed) ...
------- output -------

[ACTION] Alice (now moderator) revokes BobAdmin's moderator status
  Output: { success: true }

[QUERY] Verify BobAdmin is no longer a moderator
  Output: [ { isModerator: false } ]
  ✓ BobAdmin is confirmed as no longer a moderator
----- output end -----
  7. User1 (now moderator) attempts to revoke moderator status (should succeed) ... ok (79ms)
  8. User1 logs out ...
------- output -------

[ACTION] Alice logs out
  Output: { success: true }

[QUERY] Verify Alice's session is invalidated
  Output: { userProfile: null }
  ✓ Alice's session invalidated
----- output end -----
  8. User1 logs out ... ok (33ms)
------- output -------

✅ Principle demonstrated: Users can register and log in. Moderator privileges can be managed by authenticated moderators.
----- output end -----
Principle: users must register and log in before contributing; moderators can verify content ... ok (1s)
Action: registerUser - ensures unique usernames, non-empty passwords ...
------- output -------

=== Testing registerUser Action ===
----- output end -----
  Successful registration ...
------- output -------

[ACTION] registerUser({ username: "testuser", password: "securepassword" })
  Output: { userId: "0199f9f9-bd6b-75a5-aa1a-d71d90dbfe7b" }
  ✓ User "testuser" registered successfully.
  ✓ User details verified in DB.
----- output end -----
  Successful registration ... ok (304ms)
  Rejection of duplicate username ...
------- output -------

[ACTION] registerUser({ username: "testuser", password: "securepassword" }) (duplicate attempt)
  Output: { error: "Username already taken" }
  ✓ Duplicate username "testuser" rejected.
----- output end -----
  Rejection of duplicate username ... ok (17ms)
  Rejection of empty password ...
------- output -------

[ACTION] registerUser({ username: "nopass", password: "" })
  Output: { error: "Password cannot be empty" }
  ✓ Empty password rejected.
----- output end -----
  Rejection of empty password ... ok (0ms)
Action: registerUser - ensures unique usernames, non-empty passwords ... ok (860ms)
Action: login - handles correct/incorrect credentials ...
------- output -------

=== Testing login Action ===
[SETUP] Registered user: loginuser (ID: 0199f9f9-c0ec-7792-821b-82946b450c77)
----- output end -----
  Successful login with correct credentials ...
------- output -------

[ACTION] login({ username: "loginuser", password: "loginpassword" })
  Output: { sessionToken: "0199f9f9-c168-7283-ab29-bef7c7a7d3a9" }
  ✓ User "loginuser" logged in successfully.
  ✓ Session verified in DB.
----- output end -----
  Successful login with correct credentials ... ok (138ms)
  Rejection with incorrect password ...
------- output -------

[ACTION] login({ username: "loginuser", password: "wrongpassword" })
  Output: { error: "Invalid username or password" }
  ✓ Login with incorrect password rejected.
----- output end -----
  Rejection with incorrect password ... ok (107ms)
  Rejection with non-existent username ...
------- output -------

[ACTION] login({ username: "nonexistent", password: "loginpassword" })
  Output: { error: "Invalid username or password" }
  ✓ Login with non-existent username rejected.
----- output end -----
  Rejection with non-existent username ... ok (16ms)
  Multiple logins create unique sessions ...
------- output -------
  ✓ Multiple logins result in unique session tokens.
----- output end -----
  Multiple logins create unique sessions ... ok (389ms)
Action: login - handles correct/incorrect credentials ... ok (1s)
Action: logout - invalidates sessions ...
------- output -------

=== Testing logout Action ===
[SETUP] Logged in user: logoutuser with session: 0199f9f9-c727-78ac-b204-1110bed20a8f
----- output end -----
  Successful logout ...
------- output -------

[ACTION] logout({ sessionToken: "0199f9f9-c727-78ac-b204-1110bed20a8f" })
  Output: { success: true }
  ✓ Session "0199f9f9-c727-78ac-b204-1110bed20a8f" successfully logged out.
  ✓ Session removed from DB.
----- output end -----
  Successful logout ... ok (35ms)
  Attempt to logout with an already invalid session ...
------- output -------

[ACTION] logout({ sessionToken: "0199f9f9-c727-78ac-b204-1110bed20a8f" }) (already logged out)
  Output: { success: false }
  ✓ Attempt to logout invalid session handled correctly.
----- output end -----
  Attempt to logout with an already invalid session ... ok (21ms)
  Attempt to logout with a non-existent session ...
------- output -------

[ACTION] logout({ sessionToken: "0199f9f9-c772-7f01-b968-d787f0e367fd" }) (non-existent)
  Output: { success: false }
  ✓ Attempt to logout non-existent session handled correctly.
----- output end -----
  Attempt to logout with a non-existent session ... ok (16ms)
Action: logout - invalidates sessions ... ok (1s)
Action: getAuthenticatedUser - retrieves user profile or null ...
------- output -------

=== Testing getAuthenticatedUser Action ===
[SETUP] Registered and logged in user: authuser (ID: 0199f9f9-ca6d-78ae-b727-9140ee9daa94) with session: 0199f9f9-cae8-7e3c-830b-3e92df560c9f
----- output end -----
  Retrieve profile for a valid session ...
------- output -------

[ACTION] getAuthenticatedUser({ sessionToken: "0199f9f9-cae8-7e3c-830b-3e92df560c9f" })
  Output: {
  userProfile: {
    userId: "0199f9f9-ca6d-78ae-b727-9140ee9daa94",
    username: "authuser",
    canModerate: false
  }
}
  ✓ User profile retrieved successfully for valid session.
----- output end -----
  Retrieve profile for a valid session ... ok (30ms)
  Return null for an invalid session token ...
------- output -------

[ACTION] getAuthenticatedUser({ sessionToken: "0199f9f9-cb18-78fa-beda-09c476a5072d" }) (invalid)
  Output: { userProfile: null }
  ✓ Correctly returned null for invalid session.
----- output end -----
  Return null for an invalid session token ... ok (17ms)
  Return null and clean up session if user is missing but session exists (data inconsistency) ...
------- output -------
[SETUP] Created ghost session "0199f9f9-cb29-7ded-a56f-73d5c87843c3" for non-existent user "0199f9f9-cb29-791d-bb97-626f93f41a13"

[ACTION] getAuthenticatedUser({ sessionToken: "0199f9f9-cb29-7ded-a56f-73d5c87843c3" }) (ghost session)
  Output: { userProfile: null }
  ✓ Correctly returned null for ghost session.
  ✓ Ghost session cleaned up.
----- output end -----
  Return null and clean up session if user is missing but session exists (data inconsistency) ... ok (80ms)
Action: getAuthenticatedUser - retrieves user profile or null ... ok (1s)
Action: changePassword - updates password and invalidates sessions ...
------- output -------

=== Testing changePassword Action ===
[SETUP] User "pwuser" (ID: 0199f9f9-ce67-7d49-8e4b-84ba1f618cb3) registered and logged in with sessions: 0199f9f9-cee3-74a5-bf7b-0f69cb447055, 0199f9f9-cf5f-7c2a-82ab-cbd4e13f66b8
----- output end -----
  Successful password change invalidates all sessions ...
------- output -------

[ACTION] changePassword({ sessionToken: "0199f9f9-cee3-74a5-bf7b-0f69cb447055", oldPassword: "oldpassword", newPassword: "newpassword" })
  Output: { success: true }
  ✓ Password changed successfully.
  ✓ All old sessions invalidated.
  ✓ Login with new password successful.
----- output end -----
  Successful password change invalidates all sessions ... ok (409ms)
  Rejection with invalid old password ...
------- output -------

[ACTION] changePassword({ sessionToken: "0199f9f9-d182-74c1-ac92-77dd975db0ad", oldPassword: "wrong", newPassword: "newerpassword" })
  Output: { error: "Old password does not match" }
  ✓ Rejected change with invalid old password.
----- output end -----
  Rejection with invalid old password ... ok (263ms)
  Rejection with invalid session token ...
------- output -------

[ACTION] changePassword({ sessionToken: "0199f9f9-d211-7824-8036-ce142a8a0dc5", oldPassword: "newpassword", newPassword: "anotherpassword" })
  Output: { error: "Invalid session" }
  ✓ Rejected change with invalid session token.
----- output end -----
  Rejection with invalid session token ... ok (16ms)
  Rejection with empty new password ...
------- output -------

[ACTION] changePassword({ sessionToken: "0199f9f9-d28a-7514-b277-f096c3d87142", oldPassword: "newpassword", newPassword: "" })
  Output: { error: "New password cannot be empty" }
  ✓ Rejected change with empty new password.
----- output end -----
  Rejection with empty new password ... ok (123ms)
Action: changePassword - updates password and invalidates sessions ... ok (1s)
Action: grantModerator - assigns moderator privileges ...
------- output -------

=== Testing grantModerator Action ===
[SETUP] Admin user "adminbob" (ID: 0199f9f9-d5cb-7651-b9a5-34313fdd2e91) is a moderator.
[SETUP] Regular user "charlie" (ID: 0199f9f9-d64b-75e0-b7a0-c7fb61cabaef) is NOT a moderator.
----- output end -----
  Successful grant by admin to regular user ...
------- output -------

[ACTION] Admin grants moderator to "charlie" (ID: 0199f9f9-d64b-75e0-b7a0-c7fb61cabaef)
  Output: { success: true }
  ✓ "charlie" is now a moderator.
----- output end -----
  Successful grant by admin to regular user ... ok (82ms)
  Idempotency: Granting moderator twice to same user ...
------- output -------

[ACTION] Admin grants moderator to "charlie" again
  Output: { success: true }
  ✓ Granting twice has no negative effect.
----- output end -----
  Idempotency: Granting moderator twice to same user ... ok (49ms)
  Success: Moderator user can grant moderator to another user ...
------- output -------

[ACTION] "charlie" (now moderator) grants moderator to "diana"
  Output: { success: true }
  ✓ Moderator "charlie" successfully granted privileges.
----- output end -----
  Success: Moderator user can grant moderator to another user ... ok (84ms)
  Rejection: Invalid admin session token ...
------- output -------

[ACTION] Grant with invalid admin session token
  Output: { error: "Invalid admin session" }
  ✓ Invalid admin session token rejected.
----- output end -----
  Rejection: Invalid admin session token ... ok (18ms)
  Rejection: Non-existent target user ...
------- output -------

[ACTION] Admin grants moderator to non-existent user "0199f9f9-d90b-78c7-a1c6-88ee854b653b"
  Output: { error: "Target user not found" }
  ✓ Non-existent target user rejected.
----- output end -----
  Rejection: Non-existent target user ... ok (73ms)
Action: grantModerator - assigns moderator privileges ... ok (1s)
Action: revokeModerator - removes moderator privileges ...
------- output -------

=== Testing revokeModerator Action ===
[SETUP] Admin user "superadmin" (ID: 0199f9f9-dc66-7c9d-9cf2-6fa456e80fad) is a moderator.
[SETUP] Moderator user "modjane" (ID: 0199f9f9-dce2-70ca-bd50-d922e765a5dc) is a moderator.
[SETUP] Non-moderator user "frank" (ID: 0199f9f9-dd5c-7896-b6df-d937c261f226) is NOT a moderator.
----- output end -----
  Successful revoke by admin of a moderator ...
------- output -------

[ACTION] Admin revokes moderator status from "modjane" (ID: 0199f9f9-dce2-70ca-bd50-d922e765a5dc)
  Output: { success: true }
  ✓ "modjane" is no longer a moderator.
----- output end -----
  Successful revoke by admin of a moderator ... ok (80ms)
  Idempotency: Revoking moderator twice from same user ...
------- output -------

[ACTION] Admin revokes moderator status from "modjane" again
  Output: { success: true }
  ✓ Revoking twice has no negative effect.
----- output end -----
  Idempotency: Revoking moderator twice from same user ... ok (47ms)
  Success: Moderator user can revoke another moderator ...
------- output -------

[ACTION] "modjane" (moderator) revokes "superadmin"'s moderator status
  Output: { success: true }
  ✓ Moderator "modjane" successfully revoked privileges.
----- output end -----
  Success: Moderator user can revoke another moderator ... ok (163ms)
  Rejection: Invalid admin session token ...
------- output -------

[ACTION] Revoke with invalid admin session token
  Output: { error: "Invalid admin session" }
  ✓ Invalid admin session token rejected.
----- output end -----
  Rejection: Invalid admin session token ... ok (16ms)
  Rejection: Non-existent target user ...
------- output -------

[ACTION] Admin revokes moderator from non-existent user "0199f9f9-e065-7797-98ca-341da54cc096"
  Output: { error: "Target user not found" }
  ✓ Non-existent target user rejected.
----- output end -----
  Rejection: Non-existent target user ... ok (111ms)
Action: revokeModerator - removes moderator privileges ... ok (1s)
Query: _getUserDetails - retrieves user profile ...
------- output -------

=== Testing _getUserDetails Query ===
[SETUP] Registered user: detailuser (ID: 0199f9f9-e392-7096-a2e8-ec4b9f711782)
----- output end -----
  Retrieve details for an existing user ...
------- output -------

[QUERY] _getUserDetails({ userId: "0199f9f9-e392-7096-a2e8-ec4b9f711782" })
  Output: [ { user: { username: "detailuser", canModerate: false } } ]
  ✓ User details retrieved successfully.
----- output end -----
  Retrieve details for an existing user ... ok (17ms)
  Return error for a non-existent user ...
------- output -------

[QUERY] _getUserDetails({ userId: "0199f9f9-e3b6-75fe-8500-b8145aea771d" }) (non-existent)
  Output: { error: "User not found" }
  ✓ Correctly returned error for non-existent user.
----- output end -----
  Return error for a non-existent user ... ok (16ms)
Query: _getUserDetails - retrieves user profile ... ok (817ms)
Query: _isModerator - checks moderator status ...
------- output -------

=== Testing _isModerator Query ===
[SETUP] Regular user "regular" (ID: 0199f9f9-e6d4-7e60-a8ae-9f4cd6e74fea)
[SETUP] Moderator user "moderator" (ID: 0199f9f9-e74f-7099-a337-8c366d216b49)
----- output end -----
  Check moderator status for a regular user (should be false) ...
------- output -------

[QUERY] _isModerator({ userId: "0199f9f9-e6d4-7e60-a8ae-9f4cd6e74fea" })
  Output: [ { isModerator: false } ]
  ✓ Correctly identified regular user as not a moderator.
----- output end -----
  Check moderator status for a regular user (should be false) ... ok (16ms)
  Check moderator status for a moderator user (should be true) ...
------- output -------

[QUERY] _isModerator({ userId: "0199f9f9-e74f-7099-a337-8c366d216b49" })
  Output: [ { isModerator: true } ]
  ✓ Correctly identified moderator user as a moderator.
----- output end -----
  Check moderator status for a moderator user (should be true) ... ok (17ms)
  Return error for a non-existent user ...
------- output -------

[QUERY] _isModerator({ userId: "0199f9f9-e8fd-73cb-ab6a-4de7f7aaec6f" }) (non-existent)
  Output: { error: "User not found" }
  ✓ Correctly returned error for non-existent user.
----- output end -----
  Return error for a non-existent user ... ok (17ms)
Query: _isModerator - checks moderator status ... ok (1s)

ok | 10 passed (40 steps) | 0 failed (13s)

(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % 