---
timestamp: 'Mon Oct 20 2025 16:54:04 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_165404.3ba96816.md]]'
content_id: 74dbf1123f163148bea570afc9c67ff3dabdeb0c7e55c5f90e04f602c88ce8d7
---

# API Specification: UserAuth Concept

**Purpose:** authenticate users and manage moderator privileges

***

## API Endpoints

### POST /api/UserAuth/registerUser

**Description:** Creates a new user with default permissions (cannot moderate); returns userId on success or an Error on failure (e.g., username taken).

**Requirements:**

* username unique and password non-empty

**Effects:**

* creates a new user with default permissions (cannot moderate); returns userId on success or an Error on failure (e.g., username taken).

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "userId": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuth/login

**Description:** Creates a new active session, returns a new unique sessionToken on success.

**Requirements:**

* username exists and password matches

**Effects:**

* creates a new active session, returns a new unique sessionToken on success. Returns an Error (e.g., "Invalid credentials") on failure.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "sessionToken": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuth/logout

**Description:** Removes the sessionToken from activeSessions, returns true on success, false otherwise.

**Requirements:**

* sessionToken exists in activeSessions

**Effects:**

* removes the sessionToken from activeSessions, returns true on success, false otherwise.

**Request Body:**

```json
{
  "sessionToken": "string"
}
```

**Success Response Body (Action):**

```json
{
  "success": "boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuth/getAuthenticatedUser

**Description:** Returns a subset of user information for the authenticated user, or null if sessionToken is invalid.

**Requirements:**

* sessionToken is valid and exists in activeSessions

**Effects:**

* returns a subset of user information for the authenticated user, or null if sessionToken is invalid.

**Request Body:**

```json
{
  "sessionToken": "string"
}
```

**Success Response Body (Action):**

```json
{
  "userProfile": {
    "userId": "string",
    "username": "string",
    "canModerate": "boolean"
  }
}
```

*Note: The `userProfile` field can be `null` if the sessionToken is invalid or not found.*

**Error Response Body:**

```json
{
  "error": "string"
}
```

*Note: This specific action typically returns `{ "userProfile": null }` for invalid sessions instead of an explicit error object.*

***

### POST /api/UserAuth/changePassword

**Description:** Updates the passwordHash for the authenticated user, invalidates existing sessionTokens, returns true on success, or an Error on failure.

**Requirements:**

* sessionToken is valid and linked to a user, oldPassword matches the user's current passwordHash, and newPassword is non-empty.

**Effects:**

* updates the passwordHash for the authenticated user, invalidates existing sessionTokens, returns true on success, or an Error on failure.

**Request Body:**

```json
{
  "sessionToken": "string",
  "oldPassword": "string",
  "newPassword": "string"
}
```

**Success Response Body (Action):**

```json
{
  "success": "boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuth/grantModerator

**Description:** Sets canModerate to true for targetUser, returns true on success, or an Error on failure.

**Requirements:**

* adminSessionToken is valid and linked to a user whose canModerate is true, and targetUserId exists.

**Effects:**

* sets canModerate to true for targetUser, returns true on success, or an Error on failure.

**Request Body:**

```json
{
  "targetUserId": "string",
  "adminSessionToken": "string"
}
```

**Success Response Body (Action):**

```json
{
  "success": "boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuth/revokeModerator

**Description:** Sets canModerate to false for targetUser, returns true on success, or an Error on failure.

**Requirements:**

* adminSessionToken is valid and linked to a user whose canModerate is true, and targetUserId exists.

**Effects:**

* sets canModerate to false for targetUser, returns true on success, or an Error on failure.

**Request Body:**

```json
{
  "targetUserId": "string",
  "adminSessionToken": "string"
}
```

**Success Response Body (Action):**

```json
{
  "success": "boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuth/getUserDetails

**Description:** Returns user's username and moderation status.

**Requirements:**

* userId exists

**Effects:**

* returns user's username and moderation status
* Note: This is a query, so it returns an array of results.

**Request Body:**

```json
{
  "userId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "user": {
      "username": "string",
      "canModerate": "boolean"
    }
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuth/isModerator

**Description:** Returns true if user can moderate, false otherwise.

**Requirements:**

* userId exists

**Effects:**

* returns true if user can moderate, false otherwise
* Note: This is a query, so it returns an array of results.

**Request Body:**

```json
{
  "userId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "isModerator": "boolean"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
