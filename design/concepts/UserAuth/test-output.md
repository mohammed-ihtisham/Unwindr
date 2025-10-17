(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:user
Task test:user deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/UserAuth/UserAuthConcept.test.ts
running 5 tests from ./src/concepts/UserAuth/UserAuthConcept.test.ts
Principle: Users must register, log in, and moderators can verify content ...
------- output -------

=== Testing Principle Fulfillment ===

[SETUP] Registering principle_admin...
  Result: { userId: "0199f3a6-b425-750e-864e-4ce04418ac53" }
  ✓ Admin registered with ID: 0199f3a6-b425-750e-864e-4ce04418ac53

[SETUP] Manually granting moderator status to admin...
  ✓ Admin is now a moderator

[ACTION] registerUser - contributor
  Input: { username: "contributor", password: "pass" }
  Output: { userId: "0199f3a6-b4c7-72f1-8cb1-2a012da69653" }
  ✓ Contributor registered with ID: 0199f3a6-b4c7-72f1-8cb1-2a012da69653

[ACTION] registerUser - moderator_candidate
  Input: { username: "moderator_candidate", password: "pass" }
  Output: { userId: "0199f3a6-b54a-7f38-953f-c48c62e5e968" }
  ✓ Moderator candidate registered with ID: 0199f3a6-b54a-7f38-953f-c48c62e5e968

[ACTION] login - contributor
  Input: { username: "contributor", password: "pass" }
  Output: { userId: "0199f3a6-b4c7-72f1-8cb1-2a012da69653" }
  ✓ Contributor logged in successfully

[ACTION] login - moderator_candidate
  Input: { username: "moderator_candidate", password: "pass" }
  Output: { userId: "0199f3a6-b54a-7f38-953f-c48c62e5e968" }
  ✓ Moderator candidate logged in successfully

[ACTION] grantModerator
  Input: { targetUserId: 0199f3a6-b54a-7f38-953f-c48c62e5e968, adminUserId: 0199f3a6-b425-750e-864e-4ce04418ac53 }
  Output: {}
  ✓ Moderator privileges granted successfully

[QUERY] _isModerator
  Input: { userId: 0199f3a6-b54a-7f38-953f-c48c62e5e968 }
  Output: [ { isModerator: true } ]
  ✓ Verified: User is now a moderator

✅ Principle demonstrated: Users can register, log in, and moderators can verify content
----- output end -----
Principle: Users must register, log in, and moderators can verify content ... ok (1s)
Action: registerUser successfully registers users and enforces requirements ...
------- output -------

=== Testing registerUser Action ===

[TEST] Register a user successfully
  Input: { username: "alice", password: "password123" }
  Output: { userId: "0199f3a6-b9ab-7fcb-9e41-f2cfe63e6c4d" }
  ✓ User registered successfully with ID: 0199f3a6-b9ab-7fcb-9e41-f2cfe63e6c4d

[VERIFY] Check user details with _getUserDetails
  Input: { userId: 0199f3a6-b9ab-7fcb-9e41-f2cfe63e6c4d }
  Output: [ { user: { username: "alice", canModerate: false } } ]
  ✓ User details verified: username='alice', canModerate=false

[TEST] Prevent registration with empty password
  Input: { username: "bob", password: "" }
  Output: { error: "Password cannot be empty" }
  ✓ Correctly rejected empty password

[TEST] Prevent registration with duplicate username
  Step 1: Register "charlie"
  Input: { username: "charlie", password: "password123" }
  Output: { userId: "0199f3a6-ba3a-74cb-b5c4-726b7fbbf107" }
  ✓ First registration succeeded
  Step 2: Try to register "charlie" again
  Input: { username: "charlie", password: "anotherpassword" }
  Output: { error: "Username already taken" }
  ✓ Correctly rejected duplicate username

✅ All registerUser requirements verified
----- output end -----
Action: registerUser successfully registers users and enforces requirements ... ok (1s)
Action: login allows valid users and rejects invalid credentials ...
------- output -------

=== Testing login Action ===

[SETUP] Register user for login tests
  Input: { username: "diana", password: "securepassword" }
  Output: { userId: "0199f3a6-bd02-7298-86ac-a7b59d179c9d" }
  ✓ User registered with ID: 0199f3a6-bd02-7298-86ac-a7b59d179c9d

[TEST] Login with valid credentials
  Input: { username: "diana", password: "securepassword" }
  Output: { userId: "0199f3a6-bd02-7298-86ac-a7b59d179c9d" }
  ✓ Login successful, returned userId: 0199f3a6-bd02-7298-86ac-a7b59d179c9d

[TEST] Reject login with incorrect password
  Input: { username: "diana", password: "wrongpassword" }
  Output: { error: "Invalid username or password" }
  ✓ Correctly rejected incorrect password

[TEST] Reject login with non-existent username
  Input: { username: "eve", password: "anypassword" }
  Output: { error: "Invalid username or password" }
  ✓ Correctly rejected non-existent username

✅ All login requirements verified
----- output end -----
Action: login allows valid users and rejects invalid credentials ... ok (913ms)
Action: grantModerator allows admins to grant privileges and enforces requirements ...
------- output -------

=== Testing grantModerator Action ===

[SETUP] Register admin user 'frank'
  ✓ Frank registered with ID: 0199f3a6-c0b1-70f2-bb88-2012b5237100

[SETUP] Register target user 'grace'
  ✓ Grace registered with ID: 0199f3a6-c12e-7a55-bd6f-5d5f1519505b

[SETUP] Register non-mod user 'heidi'
  ✓ Heidi registered with ID: 0199f3a6-c1ac-7790-a558-b9b08098102f

[SETUP] Manually grant frank moderator status
  ✓ Frank is now a moderator

[TEST] Admin grants moderator privileges to target user
  Input: { targetUserId: 0199f3a6-c12e-7a55-bd6f-5d5f1519505b, adminUserId: 0199f3a6-c0b1-70f2-bb88-2012b5237100 }
  Output: {}
  ✓ Grant moderator succeeded

[VERIFY] Check target user is now a moderator
  Input: { userId: 0199f3a6-c12e-7a55-bd6f-5d5f1519505b }
  Output: [ { isModerator: true } ]
  ✓ Target user is now a moderator

[TEST] Reject grant by non-moderator
  Input: { targetUserId: 0199f3a6-c12e-7a55-bd6f-5d5f1519505b, adminUserId: 0199f3a6-c1ac-7790-a558-b9b08098102f }
  Output: { error: "Admin user does not have moderator privileges" }
  ✓ Correctly rejected non-moderator attempt

[TEST] Reject grant by non-existent admin
  Input: { targetUserId: 0199f3a6-c12e-7a55-bd6f-5d5f1519505b, adminUserId: 0199f3a6-c234-7e85-80ae-7deaedc4e5d8 }
  Output: { error: "Admin user not found" }
  ✓ Correctly rejected non-existent admin

[TEST] Reject grant to non-existent target user
  Input: { targetUserId: 0199f3a6-c244-7cea-8cba-3d084737cef3, adminUserId: 0199f3a6-c0b1-70f2-bb88-2012b5237100 }
  Output: { error: "Target user not found" }
  ✓ Correctly rejected non-existent target user

✅ All grantModerator requirements verified
----- output end -----
Action: grantModerator allows admins to grant privileges and enforces requirements ... ok (1s)
Queries: _getUserDetails and _isModerator retrieve correct information ...
------- output -------

=== Testing Query Operations ===

[SETUP] Register user for query tests
  Input: { username: "irene", password: "querypass" }
  Output: { userId: "0199f3a6-c5b7-7b42-9bab-1ff9523d159c" }
  ✓ User registered with ID: 0199f3a6-c5b7-7b42-9bab-1ff9523d159c

[TEST] Query _getUserDetails for existing user
  Input: { userId: 0199f3a6-c5b7-7b42-9bab-1ff9523d159c }
  Output: [ { user: { username: "irene", canModerate: false } } ]
  ✓ User details retrieved: username='irene', canModerate=false

[TEST] Query _getUserDetails for non-existent user
  Input: { userId: 0199f3a6-c5d9-7807-8915-ad47dd7ebd92 }
  Output: { error: "User not found" }
  ✓ Correctly returned error for non-existent user

[TEST] Query _isModerator for regular user
  Input: { userId: 0199f3a6-c5b7-7b42-9bab-1ff9523d159c }
  Output: [ { isModerator: false } ]
  ✓ Correctly reported isModerator=false for regular user

[TEST] Query _isModerator for moderator user
  Setup: Register and promote a moderator
  ✓ Moderator user created with ID: 0199f3a6-c664-7813-940c-96433b3970f5
  Input: { userId: 0199f3a6-c664-7813-940c-96433b3970f5 }
  Output: [ { isModerator: true } ]
  ✓ Correctly reported isModerator=true for moderator

[TEST] Query _isModerator for non-existent user
  Input: { userId: 0199f3a6-c699-722a-9670-0802c5cab0d8 }
  Output: { error: "User not found" }
  ✓ Correctly returned error for non-existent user

✅ All query operations verified
----- output end -----
Queries: _getUserDetails and _isModerator retrieve correct information ... ok (1s)

ok | 5 passed | 0 failed (5s)