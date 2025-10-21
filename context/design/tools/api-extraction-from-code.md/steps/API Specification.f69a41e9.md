---
timestamp: 'Mon Oct 20 2025 16:32:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_163215.da54fecc.md]]'
content_id: f69a41e9585e3b85439c2826b43cb925c472593e01c94b7e081b54313a95bdba
---

# API Specification: Labeling Concept

**Purpose:** Associate labels with items and then retrieve items that match a given label.

***

## API Endpoints

### POST /api/Labeling/createLabel

**Description:** Creates a new label with the specified name and returns its unique identifier.

**Requirements:**

* no Label with the given `name` already exists

**Effects:**

* creates a new Label `l`
* sets the name of `l` to `name`
* returns `l` as `label`

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response Body (Action):**

```json
{
  "label": "ID"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Labeling/addLabel

**Description:** Associates a given label with a specific item.

**Requirements:**

* the `item` exists
* the `label` exists

**Effects:**

* adds `label` to the set of labels for `item` if not already present

**Request Body:**

```json
{
  "item": "ID",
  "label": "ID"
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

### POST /api/Labeling/deleteLabel

**Description:** Removes the association between a specified label and an item.

**Requirements:**

* the `item` exists
* the `label` exists and is associated with the `item`

**Effects:**

* removes `label` from the set of labels for `item`

**Request Body:**

```json
{
  "item": "ID",
  "label": "ID"
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
