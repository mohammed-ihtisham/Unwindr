# Prompt: Is there anything we need to add or update in the UserAuth concept to make sure it is 100% complete for bare-minimum functionality for an MVP?

[@UserAuth-spec](../concepts/UserAuth/UserAuth.md)

# response:

This `UserAuth` concept provides a solid foundation for user authentication and basic moderator privileges. However, to be "100% complete for bare-minimum functionality for an MVP," there are several critical components missing, primarily related to *session management* and *user self-service*.

Here's a breakdown of what needs to be added or updated:

---

### Key Missing Components for MVP Bare-Minimum Functionality:

1.  **Session Management (Core to "Login"):**
    *   **Problem:** The `login` action returns `userId`, but there's no mechanism defined for how this `userId` is used to maintain an authenticated state across multiple requests. An MVP needs a way for users to stay logged in and prove their identity without re-entering credentials for every action.
    *   **Suggestion:**
        *   **State:** Add a mechanism to track active sessions. This typically involves a session token or JWT.
            *   `activeSessions: Map<SessionToken: String, userId: Id>` (or similar)
        *   **Action:** Update `login` to return a `SessionToken`.
            *   `login (username: String, password: String) : (sessionToken: String)`
            *   **Effect:** Returns a new `sessionToken` on successful login, linked to the `userId`. If login fails, it should explicitly indicate failure (e.g., `null` token, or an error object).
        *   **Action:** Add a way to validate a session token for subsequent authenticated requests. This isn't an explicit action the *user* calls, but an implicit requirement for any action that `requires` an authenticated user.
            *   *Implicit Requirement:* All actions requiring authentication will take a `sessionToken` as an input and validate it against `activeSessions` to determine the `userId` and its privileges.
        *   **Action:** Add `logout`.
            *   `logout (sessionToken: String)`
            *   **Requires:** `sessionToken` exists in `activeSessions`.
            *   **Effect:** Removes the `sessionToken` from `activeSessions`, invalidating the session.

2.  **User Self-Service: Change Password:**
    *   **Problem:** Users need to be able to change their password once logged in.
    *   **Suggestion:**
        *   **Action:** Add `changePassword`.
            *   `changePassword (sessionToken: String, oldPassword: String, newPassword: String)`
            *   **Requires:** `sessionToken` is valid, `oldPassword` matches the current `passwordHash` for the authenticated user, `newPassword` is non-empty.
            *   **Effect:** Updates the `passwordHash` for the authenticated user.

3.  **Privilege Management: Revoke Moderator:**
    *   **Problem:** If an admin can grant moderator privileges, they must also be able to revoke them. This is crucial for maintaining control and security.
    *   **Suggestion:**
        *   **Action:** Add `revokeModerator`.
            *   `revokeModerator (targetUserId: Id, adminSessionToken: String)`
            *   **Requires:** `adminSessionToken` is valid and linked to a user whose `canModerate` is true. `targetUserId` exists.
            *   **Effect:** Sets `canModerate` to `false` for `targetUserId`.

4.  **Retrieving Authenticated User Information:**
    *   **Problem:** After login, the frontend (or subsequent backend calls) will need to know details about the authenticated user, such as their username or `canModerate` status, to render the UI correctly or make authorization decisions.
    *   **Suggestion:**
        *   **Action:** Add `getAuthenticatedUser (sessionToken: String) : (user: UserSubset | null)`
            *   **Requires:** `sessionToken` is valid.
            *   **Effect:** Returns a subset of the user's information (e.g., `userId`, `username`, `canModerate`) associated with the `sessionToken`. Returns `null` or an error if the token is invalid.

---

### Minor Refinements/Considerations for MVP:

*   **Error Handling in Actions:** While `requires` clauses are good, explicit return types for failure scenarios in the `effect` descriptions would make it clearer. For example, `login` should specify what happens if credentials don't match (e.g., `returns (sessionToken: String | null, error: String | null)`).
*   **Password Hashing Details:** While `passwordHash` implies security, the concept doesn't specify *how* it's hashed (e.g., with salts, using specific algorithms). For an MVP, it's sufficient to state `passwordHash String`, but the implementation detail is critical.
*   **Id Type:** Ensure consistency. Sometimes it's `Id`, sometimes `userId: Id`. It's clear from context, but being uniform helps.

---

### Updated UserAuth Concept (incorporating suggestions):

```concept
concept UserAuth [User]
purpose authenticate users and manage moderator privileges
principle users must register and log in before contributing; moderators can verify content

state
  a set of Users with
    a userId Id                  // Added explicit userId
    a username String
    a passwordHash String
    a canModerate Flag

  a set of activeSessions with
    a sessionToken String        // New: Unique token for active session
    a userId Id                  // New: Links token to a user
    // A timestamp for expiration could be added for a more robust MVP, but not strictly bare-minimum concept level

actions
  registerUser (username: String, password: String) : (userId: Id | Error)
    requires username unique and password non-empty
    effect creates a new user with default permissions (cannot moderate), returns userId on success or an Error on failure (e.g., username taken).

  login (username: String, password: String) : (sessionToken: String | Error)
    requires username exists and password matches
    effect creates a new active session, returns a new unique sessionToken on success. Returns an Error (e.g., "Invalid credentials") on failure.

  logout (sessionToken: String) : (success: Boolean)
    requires sessionToken exists in activeSessions
    effect removes the sessionToken from activeSessions, returns true on success, false otherwise.

  getAuthenticatedUser (sessionToken: String) : (userProfile: {userId: Id, username: String, canModerate: Flag} | null)
    requires sessionToken is valid and exists in activeSessions
    effect returns a subset of user information for the authenticated user, or null if sessionToken is invalid.

  changePassword (sessionToken: String, oldPassword: String, newPassword: String) : (success: Boolean | Error)
    requires sessionToken is valid and linked to a user, oldPassword matches the user's current passwordHash, and newPassword is non-empty.
    effect updates the passwordHash for the authenticated user, invalidates existing sessionTokens (optional but good security), returns true on success, or an Error on failure.

  grantModerator (targetUserId: Id, adminSessionToken: String) : (success: Boolean | Error)
    requires adminSessionToken is valid and linked to a user whose canModerate is true, and targetUserId exists.
    effect sets canModerate to true for targetUser, returns true on success, or an Error on failure.

  revokeModerator (targetUserId: Id, adminSessionToken: String) : (success: Boolean | Error)
    requires adminSessionToken is valid and linked to a user whose canModerate is true, and targetUserId exists.
    effect sets canModerate to false for targetUser, returns true on success, or an Error on failure.
```

---

With these additions, the `UserAuth` concept now covers the essential flows for user registration, login/logout, self-service password changes, proving authentication across requests, and comprehensive moderator privilege management (grant and revoke) required for a bare-minimum MVP.