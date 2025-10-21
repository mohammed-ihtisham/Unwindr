---
timestamp: 'Mon Oct 20 2025 17:06:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_170646.b2e00b91.md]]'
content_id: 3176cf4691c05136a21746c365d4ee002b3fd04d5050565ff6c9827a2d669462
---

# API Specification: MediaLibrary Concept

**Purpose:** store and retrieve media items for visual discovery

***

## API Endpoints

### POST /api/MediaLibrary/seedMedia

**Description:** Inserts a batch of media items provided by an external source for a specific place.

**Requirements:**

* urls not empty
* placeId provided

**Effects:**

* inserts provider-sourced media items

**Request Body:**

```json
{
  "placeId": "string",
  "urls": "string[]"
}
```

**Success Response Body (Action):**

```json
{
  "count": "number"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/MediaLibrary/addMedia

**Description:** Adds a single media item contributed by a user for a specific place.

**Requirements:**

* userId valid
* imageUrl non-empty
* placeId provided

**Effects:**

* adds user-contributed media

**Request Body:**

```json
{
  "userId": "string",
  "placeId": "string",
  "imageUrl": "string"
}
```

**Success Response Body (Action):**

```json
{
  "mediaId": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/MediaLibrary/deleteMedia

**Description:** Removes a media item if it exists and the user ID matches the contributor ID.

**Requirements:**

* mediaId exists
* userId matches contributorId of mediaId

**Effects:**

* removes media item from the set

**Request Body:**

```json
{
  "userId": "string",
  "mediaId": "string"
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

### POST /api/MediaLibrary/\_getMediaByPlace

**Description:** Retrieves all media item IDs associated with a specific place, ordered by their creation date in descending order.

**Requirements:**

* placeId provided

**Effects:**

* returns media item IDs ordered by createdAt desc

**Request Body:**

```json
{
  "placeId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "mediaIds": "string"
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
