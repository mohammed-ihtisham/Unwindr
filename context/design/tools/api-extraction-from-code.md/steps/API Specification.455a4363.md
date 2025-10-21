---
timestamp: 'Mon Oct 20 2025 17:08:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_170847.f7df1bc4.md]]'
content_id: 455a43634a35b7268bcdb575fa0cb57d3def47a68135652f41a18397cc8d8b63
---

# API Specification: InterestFilter Concept

**Purpose:** allow users to express their interests so places can be filtered to match their preferences

***

## API Endpoints

### POST /api/InterestFilter/setPreferences

**Description:** Saves a user's manually set preferences.

**Requirements:**

* user is authenticated, tags not empty, and all tags in AllowedTags

**Effects:**

* saves preferences for user with source="manual"

**Request Body:**

```json
{
  "userId": "Id",
  "tags": "string[]"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/InterestFilter/inferPreferencesFromText

**Description:** Uses an AI model to interpret natural language text and suggest tags and optional exclusions for a user.

**Requirements:**

* user is authenticated and text is not empty

**Effects:**

* calls an AI model to interpret the text and suggest tags and optional exclusions, records confidence and rationale, stores them in UserInferredPrefs, and updates UserPreferences with source = "llm" and the inferred tags

**Request Body:**

```json
{
  "userId": "Id",
  "text": "string",
  "radius": "number (optional)",
  "locationHint": "string (optional)"
}
```

**Success Response Body (Action):**

```json
{
  "tags": "string[]",
  "exclusions": "string[]",
  "confidence": "number",
  "rationale": "string",
  "warnings": "string[]",
  "needsConfirmation": "boolean (optional)"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/InterestFilter/tagPlace

**Description:** Associates a specific tag with a given place.

**Requirements:**

* place exists and tag in AllowedTags

**Effects:**

* associates the tag with the place in PlaceTags

**Request Body:**

```json
{
  "placeId": "Id",
  "tag": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/InterestFilter/clearPreferences

**Description:** Removes all preferences (manual and inferred) for a specific user.

**Requirements:**

* user is authenticated

**Effects:**

* removes all UserPreferences and UserInferredPrefs for the user

**Request Body:**

```json
{
  "userId": "Id"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/InterestFilter/getMatchingPlaces

**Description:** Retrieves a list of places that match a user's preferences, ranked by relevance.

**Requirements:**

* user has either set manual or llm preferences

**Effects:**

* returns places whose tags overlap with user's preferred tags, ranked by relevance score, down-ranking places that match excluded tags

**Request Body:**

```json
{
  "userId": "Id",
  "places": "Id[]"
}
```

**Success Response Body (Action):**

```json
{
  "matches": "Id[]"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
