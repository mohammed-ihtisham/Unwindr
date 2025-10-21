---
timestamp: 'Mon Oct 20 2025 17:08:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_170808.015adc77.md]]'
content_id: 3fe67e6bcc9bfea29b00f48c96d63f74d4648bb44b3fdd686e55c28d348bf4a7
---

# API Specification: QualityRanking Concept

**Purpose:** surface lesser-known places that have high engagement but low mainstream visibility

***

## API Endpoints

### POST /api/QualityRanking/updateMetrics

**Description:** Updates metrics (visitorVolume, engagementRatio, lastUpdated) for a given place. If metrics for the place do not exist, they are created. This action does NOT recompute the qualityScore; that is handled by `calculateQualityScore`.

**Requirements:**

* place exists and visits >= 0 and engagement >= 0

**Effects:**

* updates metrics (visitorVolume, engagementRatio, lastUpdated) for a given place.
* If metrics for the place do not exist, they are created.
* This action does NOT recompute the qualityScore; that is handled by `calculateQualityScore`.

**Request Body:**

```json
{
  "placeId": "string",
  "visits": "number",
  "engagement": "number"
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

### POST /api/QualityRanking/calculateQualityScore

**Description:** Computes the engagement-to-visit ratio using the formula `engagement / max(visits, 1)`, updates the `qualityScore` for the place in the database, and returns the newly computed score.

**Requirements:**

* place exists and has engagement metrics (visitorVolume and engagementRatio) recorded

**Effects:**

* computes the engagement-to-visit ratio using the formula `engagement / max(visits, 1)`
* updates the `qualityScore` for the place in the database
* returns the newly computed score.

**Request Body:**

```json
{
  "placeId": "string"
}
```

**Success Response Body (Action):**

```json
{
  "score": "number"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/QualityRanking/setPreferences

**Description:** Stores or updates the ranking preferences for the given user, including their preference for emergent places and their desired recommendation radius.

**Requirements:**

* user is authenticated (this external check is typically handled by syncs) and radius > 0

**Effects:**

* stores or updates the ranking preferences for the given user, including their preference for emergent places and their desired recommendation radius.

**Request Body:**

```json
{
  "userId": "string",
  "prefersEmergent": "boolean",
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

### POST /api/QualityRanking/\_getRecommendedPlaces

**Description:** Returns a list of recommended places (by their ID), ranked according to user preferences. (Note: geographical filtering using `centerLat`, `centerLng`, and `radius` is currently ignored due to concept's state limitations; it ranks all available places.)

**Requirements:**

* user has ranking preferences and coordinates (centerLat, centerLng) are valid

**Effects:**

* returns a list of recommended places (by their ID), ranked according to user preferences.

**Request Body:**

```json
{
  "userId": "string",
  "centerLat": "number",
  "centerLng": "number"
}
```

**Success Response Body (Query):**

```json
[
  {
    "place": "string"
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
