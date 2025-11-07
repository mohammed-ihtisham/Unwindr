(base) mohammedihtisham@Ihtishams-MacBook-Pro Unwindr % deno task test:user
Task test:user deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/UserAuth/UserAuthConcept.test.ts
running 5 tests from ./src/concepts/UserAuth/UserAuthConcept.test.ts
Principle: users must register and log in before contributing ...
------- output -------

=== Principle Test: Users register and log in ===
----- output end -----
  1. Register User1 ...
------- output -------

[ACTION] Registering user1 (Alice)
  Output: { userId: "019a5c65-1a49-70aa-9ff4-b42ea5068e58" }
  ✓ Alice registered with ID: 019a5c65-1a49-70aa-9ff4-b42ea5068e58
----- output end -----
  1. Register User1 ... ok (308ms)
  2. Log in User1 ...
------- output -------

[ACTION] Alice attempts to log in
  Output: { sessionToken: "019a5c65-1ad0-781f-a545-9d59e5ff1284" }
  ✓ Alice logged in with session: 019a5c65-1ad0-781f-a545-9d59e5ff1284
----- output end -----
  2. Log in User1 ... ok (146ms)
  3. Verify authenticated user ...
------- output -------

[ACTION] Get authenticated user for Alice
  Output: {
  userProfile: { userId: "019a5c65-1a49-70aa-9ff4-b42ea5068e58", username: "Alice" }
}
  ✓ Alice is authenticated
----- output end -----
  3. Verify authenticated user ... ok (36ms)
  4. User1 logs out ...
------- output -------

[ACTION] Alice logs out
  Output: { success: true }

[QUERY] Verify Alice's session is invalidated
  Output: { userProfile: null }
  ✓ Alice's session invalidated
----- output end -----
  4. User1 logs out ... ok (39ms)
------- output -------

✅ Principle demonstrated: Users can register and log in.
----- output end -----
Principle: users must register and log in before contributing ... ok (1s)
Action: registerUser - ensures unique usernames, non-empty passwords ...
------- output -------

=== Testing registerUser Action ===
----- output end -----
  Successful registration ...
------- output -------

[ACTION] registerUser({ username: "testuser", password: "securepassword" })
  Output: { userId: "019a5c65-1e38-7070-b858-d7b93b7b461c" }
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
Action: registerUser - ensures unique usernames, non-empty passwords ... ok (814ms)
Action: login - handles correct/incorrect credentials ...
------- output -------

=== Testing login Action ===
[SETUP] Registered user: loginuser (ID: 019a5c65-2198-75f9-a50a-2d96110afb47)
----- output end -----
  Successful login with correct credentials ...
------- output -------

[ACTION] login({ username: "loginuser", password: "loginpassword" })
  Output: { sessionToken: "019a5c65-222d-7202-97af-996cc3793850" }
  ✓ User "loginuser" logged in successfully.
  ✓ Session verified in DB.
----- output end -----
  Successful login with correct credentials ... ok (177ms)
  Rejection with incorrect password ...
------- output -------

[ACTION] login({ username: "loginuser", password: "wrongpassword" })
  Output: { error: "Invalid username or password" }
  ✓ Login with incorrect password rejected.
----- output end -----
  Rejection with incorrect password ... ok (128ms)
  Rejection with non-existent username ...
------- output -------

[ACTION] login({ username: "nonexistent", password: "loginpassword" })
  Output: { error: "Invalid username or password" }
  ✓ Login with non-existent username rejected.
----- output end -----
  Rejection with non-existent username ... ok (17ms)
  Multiple logins create unique sessions ...
------- output -------
  ✓ Multiple logins result in unique session tokens.
----- output end -----
  Multiple logins create unique sessions ... ok (265ms)
Action: login - handles correct/incorrect credentials ... ok (1s)
Action: logout - invalidates sessions ...
------- output -------

=== Testing logout Action ===
[SETUP] Logged in user: logoutuser with session: 019a5c65-2757-78b2-91fc-76c839fc71d9
----- output end -----
  Successful logout ...
------- output -------

[ACTION] logout({ sessionToken: "019a5c65-2757-78b2-91fc-76c839fc71d9" })
  Output: { success: true }
  ✓ Session "019a5c65-2757-78b2-91fc-76c839fc71d9" successfully logged out.
  ✓ Session removed from DB.
----- output end -----
  Successful logout ... ok (37ms)
  Attempt to logout with an already invalid session ...
------- output -------

[ACTION] logout({ sessionToken: "019a5c65-2757-78b2-91fc-76c839fc71d9" }) (already logged out)
  Output: { success: false }
  ✓ Attempt to logout invalid session handled correctly.
----- output end -----
  Attempt to logout with an already invalid session ... ok (18ms)
  Attempt to logout with a non-existent session ...
------- output -------

[ACTION] logout({ sessionToken: "019a5c65-27b1-7e86-8226-c0239d816319" }) (non-existent)
  Output: { success: false }
  ✓ Attempt to logout non-existent session handled correctly.
----- output end -----
  Attempt to logout with a non-existent session ... ok (18ms)
Action: logout - invalidates sessions ... ok (967ms)
Action: getAuthenticatedUser - retrieves user profile or null ...
------- output -------

=== Testing getAuthenticatedUser Action ===
[SETUP] Registered and logged in user: authuser (ID: 019a5c65-2a9f-738e-a1d0-407bb3529462) with session: 019a5c65-2b1b-7837-b03a-79e4efbf5b37
----- output end -----
  Retrieve profile for a valid session ...
------- output -------

[ACTION] getAuthenticatedUser({ sessionToken: "019a5c65-2b1b-7837-b03a-79e4efbf5b37" })
  Output: {
  userProfile: {
    userId: "019a5c65-2a9f-738e-a1d0-407bb3529462",
    username: "authuser"
  }
}
  ✓ User profile retrieved successfully for valid session.
----- output end -----
  Retrieve profile for a valid session ... ok (34ms)
  Return null for an invalid session token ...
------- output -------

[ACTION] getAuthenticatedUser({ sessionToken: "019a5c65-2b5c-7cda-8c71-228c9d32680b" }) (invalid)
  Output: { userProfile: null }
  ✓ Correctly returned null for invalid session.
----- output end -----
  Return null for an invalid session token ... ok (16ms)
  Return null and clean up session if user is missing but session exists (data inconsistency) ...
------- output -------
[SETUP] Created ghost session "019a5c65-2b6c-70b6-aa40-3caa7885d3b7" for non-existent user "019a5c65-2b6c-7331-8ad5-25341a0eaed5"

[ACTION] getAuthenticatedUser({ sessionToken: "019a5c65-2b6c-70b6-aa40-3caa7885d3b7" }) (ghost session)
  Output: { userProfile: null }
  ✓ Correctly returned null for ghost session.
  ✓ Ghost session cleaned up.
----- output end -----
  Return null and clean up session if user is missing but session exists (data inconsistency) ... ok (140ms)
Action: getAuthenticatedUser - retrieves user profile or null ... ok (1s)

ok | 5 passed (17 steps) | 0 failed (5s)

(base) mohammedihtisham@Ihtishams-MacBook-Pro Unwindr % 