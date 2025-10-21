---
timestamp: 'Mon Oct 20 2025 17:07:31 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_170731.9c3a76bc.md]]'
content_id: 1e26f3e7af0e20feef895745b7967f6a8f14a73bf1e4bb3404769e874714a299
---

# API Specification: MediaAnalytics Concept

**Purpose:** record and compute engagement scores for media items

***

## API Endpoints

### POST /api/MediaAnalytics/recordInteraction

**Description:** Records a user's interaction with a media item and updates its engagement score.

**Requirements:**

* interactionType of interaction is valid

**Effects:**

* logs interaction and increments engagement score by weight(interactionType)

**Request Body:**

```json
{
  "userId": "ID",
  "mediaItemId": "ID",
  "interactionType": "string"
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

### POST /api/MediaAnalytics/\_getEngagement

**Description:** Retrieves the current engagement score for a specific media item.

**Requirements:**

* mediaItemId provided is valid (interpreted as a non-empty string ID)

**Effects:**

* returns engagement score or 0 (if no engagement data is found for the item)

**Request Body:**

```json
{
  "mediaItemId": "ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "score": "number"
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

### POST /api/MediaAnalytics/recomputeScoresForPlace

**Description:** Recalculates engagement scores for a given set of media items based on all historical interactions.

**Requirements:**

* placeId (contextual identifier) and mediaItemIds (items to recompute) must exist and be valid IDs

**Effects:**

* recomputes scores for the specified media items from all logged interactions, resetting existing scores and updating them based on current interaction data.
* The 'placeId' is a contextual argument and not used to filter internal state within this concept due to concept independence.

**Request Body:**

```json
{
  "placeId": "ID",
  "mediaItemIds": ["ID"]
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
