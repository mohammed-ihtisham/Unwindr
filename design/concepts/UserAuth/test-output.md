running 5 tests from ./src/concepts/UserAuth/UserAuthConcept.test.ts
Principle: Users must register, log in, and moderators can verify content ...
------- post-test output -------

=== Testing Principle Fulfillment ===

[SETUP] Registering principle_admin...
  Result: { userId: "0199eff7-1388-7591-9309-fffdf9344775" }
  ✓ Admin registered with ID: 0199eff7-1388-7591-9309-fffdf9344775

[SETUP] Manually granting moderator status to admin...
  ✓ Admin is now a moderator

[ACTION] registerUser - contributor
  Input: { username: "contributor", password: "pass" }
  Output: { userId: "0199eff7-1439-77ba-8f56-9b3db08b7493" }
  ✓ Contributor registered with ID: 0199eff7-1439-77ba-8f56-9b3db08b7493

[ACTION] registerUser - moderator_candidate
  Input: { username: "moderator_candidate", password: "pass" }
  Output: { userId: "0199eff7-14b8-7c9c-bf60-5455aa07c03b" }
  ✓ Moderator candidate registered with ID: 0199eff7-14b8-7c9c-bf60-5455aa07c03b

[ACTION] login - contributor
  Input: { username: "contributor", password: "pass" }
  Output: { userId: "0199eff7-1439-77ba-8f56-9b3db08b7493" }
  ✓ Contributor logged in successfully

[ACTION] login - moderator_candidate
  Input: { username: "moderator_candidate", password: "pass" }
  Output: { userId: "0199eff7-14b8-7c9c-bf60-5455aa07c03b" }
  ✓ Moderator candidate logged in successfully

[ACTION] grantModerator
  Input: { targetUserId: 0199eff7-14b8-7c9c-bf60-5455aa07c03b, adminUserId: 0199eff7-1388-7591-9309-fffdf9344775 }
  Output: {}
  ✓ Moderator privileges granted successfully

[QUERY] _isModerator
  Input: { userId: 0199eff7-14b8-7c9c-bf60-5455aa07c03b }
  Output: [ { isModerator: true } ]
  ✓ Verified: User is now a moderator

✅ Principle demonstrated: Users can register, log in, and moderators can verify content
----- post-test output end -----
Principle: Users must register, log in, and moderators can verify content ... ok (1s)
Action: registerUser successfully registers users and enforces requirements ...
------- post-test output -------

=== Testing registerUser Action ===

[TEST] Register a user successfully
  Input: { username: "alice", password: "password123" }
  Output: { userId: "0199eff7-18cf-7380-ba37-66f0ffd3ebea" }
  ✓ User registered successfully with ID: 0199eff7-18cf-7380-ba37-66f0ffd3ebea

[VERIFY] Check user details with _getUserDetails
  Input: { userId: 0199eff7-18cf-7380-ba37-66f0ffd3ebea }
  Output: [ { user: { username: "alice", canModerate: false } } ]
  ✓ User details verified: username='alice', canModerate=false

[TEST] Prevent registration with empty password
  Input: { username: "bob", password: "" }
  Output: { error: "Password cannot be empty" }
  ✓ Correctly rejected empty password

[TEST] Prevent registration with duplicate username
  Step 1: Register "charlie"
  Input: { username: "charlie", password: "password123" }
  Output: { userId: "0199eff7-1967-7de3-bbb2-d52a4df94ba4" }
  ✓ First registration succeeded
  Step 2: Try to register "charlie" again
  Input: { username: "charlie", password: "anotherpassword" }
  Output: { error: "Username already taken" }
  ✓ Correctly rejected duplicate username

✅ All registerUser requirements verified
----- post-test output end -----
Action: registerUser successfully registers users and enforces requirements ... ok (933ms)
Action: login allows valid users and rejects invalid credentials ...
------- post-test output -------

=== Testing login Action ===

[SETUP] Register user for login tests
  Input: { username: "diana", password: "securepassword" }
  Output: { userId: "0199eff7-1c86-7dd7-92fb-49b5ea5ce4bb" }
  ✓ User registered with ID: 0199eff7-1c86-7dd7-92fb-49b5ea5ce4bb

[TEST] Login with valid credentials
  Input: { username: "diana", password: "securepassword" }
  Output: { userId: "0199eff7-1c86-7dd7-92fb-49b5ea5ce4bb" }
  ✓ Login successful, returned userId: 0199eff7-1c86-7dd7-92fb-49b5ea5ce4bb

[TEST] Reject login with incorrect password
  Input: { username: "diana", password: "wrongpassword" }
  Output: { error: "Invalid username or password" }
  ✓ Correctly rejected incorrect password

[TEST] Reject login with non-existent username
  Input: { username: "eve", password: "anypassword" }
  Output: { error: "Invalid username or password" }
  ✓ Correctly rejected non-existent username

✅ All login requirements verified
----- post-test output end -----
Action: login allows valid users and rejects invalid credentials ... ok (1s)
Action: grantModerator allows admins to grant privileges and enforces requirements ...
------- post-test output -------

=== Testing grantModerator Action ===

[SETUP] Register admin user 'frank'
  ✓ Frank registered with ID: 0199eff7-2076-73e2-beac-5ea711af93db

[SETUP] Register target user 'grace'
  ✓ Grace registered with ID: 0199eff7-20f4-72e1-bb64-211a91425121

[SETUP] Register non-mod user 'heidi'
  ✓ Heidi registered with ID: 0199eff7-2173-7e22-aa57-84af7e919052

[SETUP] Manually grant frank moderator status
  ✓ Frank is now a moderator

[TEST] Admin grants moderator privileges to target user
  Input: { targetUserId: 0199eff7-20f4-72e1-bb64-211a91425121, adminUserId: 0199eff7-2076-73e2-beac-5ea711af93db }
  Output: {}
  ✓ Grant moderator succeeded

[VERIFY] Check target user is now a moderator
  Input: { userId: 0199eff7-20f4-72e1-bb64-211a91425121 }
  Output: [ { isModerator: true } ]
  ✓ Target user is now a moderator

[TEST] Reject grant by non-moderator
  Input: { targetUserId: 0199eff7-20f4-72e1-bb64-211a91425121, adminUserId: 0199eff7-2173-7e22-aa57-84af7e919052 }
  Output: { error: "Admin user does not have moderator privileges" }
  ✓ Correctly rejected non-moderator attempt

[TEST] Reject grant by non-existent admin
  Input: { targetUserId: 0199eff7-20f4-72e1-bb64-211a91425121, adminUserId: 0199eff7-21ff-7646-b652-61edcdf4072f }
  Output: { error: "Admin user not found" }
  ✓ Correctly rejected non-existent admin

[TEST] Reject grant to non-existent target user
  Input: { targetUserId: 0199eff7-220f-7b1f-aa37-79b3e1cac32c, adminUserId: 0199eff7-2076-73e2-beac-5ea711af93db }
  Output: { error: "Target user not found" }
  ✓ Correctly rejected non-existent target user

✅ All grantModerator requirements verified
----- post-test output end -----
Action: grantModerator allows admins to grant privileges and enforces requirements ... ok (1s)
Queries: _getUserDetails and _isModerator retrieve correct information ...
------- post-test output -------

=== Testing Query Operations ===

[SETUP] Register user for query tests
  Input: { username: "irene", password: "querypass" }
  Output: { userId: "0199eff7-2529-75fc-962e-9fe2a41172d4" }
  ✓ User registered with ID: 0199eff7-2529-75fc-962e-9fe2a41172d4

[TEST] Query _getUserDetails for existing user
  Input: { userId: 0199eff7-2529-75fc-962e-9fe2a41172d4 }
  Output: [ { user: { username: "irene", canModerate: false } } ]
  ✓ User details retrieved: username='irene', canModerate=false

[TEST] Query _getUserDetails for non-existent user
  Input: { userId: 0199eff7-254a-7d51-ae66-77880273009a }
  Output: { error: "User not found" }
  ✓ Correctly returned error for non-existent user

[TEST] Query _isModerator for regular user
  Input: { userId: 0199eff7-2529-75fc-962e-9fe2a41172d4 }
  Output: [ { isModerator: false } ]
  ✓ Correctly reported isModerator=false for regular user

[TEST] Query _isModerator for moderator user
  Setup: Register and promote a moderator
  ✓ Moderator user created with ID: 0199eff7-25d4-72ab-9ddd-e4adfe384a6f
  Input: { userId: 0199eff7-25d4-72ab-9ddd-e4adfe384a6f }
  Output: [ { isModerator: true } ]
  ✓ Correctly reported isModerator=true for moderator

[TEST] Query _isModerator for non-existent user
  Input: { userId: 0199eff7-2608-7ebf-880d-fdf0f46c5ba6 }
  Output: { error: "User not found" }
  ✓ Correctly returned error for non-existent user

✅ All query operations verified
----- post-test output end -----
Queries: _getUserDetails and _isModerator retrieve correct information ... ok (997ms)