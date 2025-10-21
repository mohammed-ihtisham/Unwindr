---
timestamp: 'Mon Oct 20 2025 17:05:10 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_170510.d2ca6ad2.md]]'
content_id: 82317bb8b389d36b4185f46d4c0c7c16ee16dc8132f11eee12229fbf908b4465
---

# API Specification: PlaceCatalog Concept

**Purpose:** Support the discovery, management, and verification of geographical places for users.

***

## API Endpoints

### POST /api/PlaceCatalog/seedPlaces

**Description:** loads places from provider within specified area.

**Requirements:**

* coordinates are valid and radius > 0

**Effects:**

* loads places from provider within specified area.
* (For this implementation, it adds a few dummy places if none exist, to simulate seeding from a provider.)

**Request Body:**

```json
{
  "centerLat": "number",
  "centerLng": "number",
  "radius": "number"
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

### POST /api/PlaceCatalog/addPlace

**Description:** creates a new user-added place and returns its ID.

**Requirements:**

* user is authenticated (assumed here)
* name is not empty
* coordinates are valid

**Effects:**

* creates a new user-added place and returns its ID.

**Request Body:**

```json
{
  "userId": "ID",
  "name": "string",
  "address": "string",
  "category": "string",
  "lat": "number",
  "lng": "number"
}
```

**Success Response Body (Action):**

```json
{
  "placeId": "ID"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PlaceCatalog/setPlaceVerificationStatus

**Description:** sets the verification status of the place (true for verified, false for unverified/deactivated).

**Requirements:**

* user has moderation privileges and place exists

**Effects:**

* sets the verification status of the place (true for verified, false for unverified/deactivated).

**Request Body:**

```json
{
  "placeId": "ID",
  "moderatorId": "ID",
  "isVerified": "boolean"
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

### POST /api/PlaceCatalog/updatePlace

**Description:** updates the name and address of the specified place.

**Requirements:**

* place exists and user is authenticated (assumed here)
* (Further restrictions, e.g., only `addedBy` user can update, would be in syncs)

**Effects:**

* updates the name and address of the specified place.

**Request Body:**

```json
{
  "placeId": "ID",
  "name": "string",
  "address": "string",
  "userId": "ID"
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

### POST /api/PlaceCatalog/\_getPlacesInArea

**Description:** returns an array of IDs of places found within the specified circular area.

**Requirements:**

* coordinates are valid and radius > 0

**Effects:**

* returns an array of IDs of places found within the specified circular area.
* The radius is in kilometers.

**Request Body:**

```json
{
  "centerLat": "number",
  "centerLng": "number",
  "radius": "number"
}
```

**Success Response Body (Query):**

```json
[
  {
    "places": [
      "ID",
      "ID"
    ]
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

### POST /api/PlaceCatalog/\_getPlaceDetails

**Description:** returns the full details of the specified place.

**Requirements:**

* place exists

**Effects:**

* returns the full details of the specified place.

**Request Body:**

```json
{
  "placeId": "ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "place": {
      "id": "ID",
      "name": "string",
      "address": "string",
      "category": "string",
      "verified": "boolean",
      "addedBy": "ID",
      "location": {
        "type": "Point",
        "coordinates": [
          "number",
          "number"
        ]
      },
      "source": "provider"
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
