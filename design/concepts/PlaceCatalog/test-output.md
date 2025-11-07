(base) mohammedihtisham@Ihtishams-MacBook-Pro Unwindr % deno task test:place
Task test:place deno test --allow-read --allow-write --allow-env --allow-net --allow-sys src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
running 6 tests from ./src/concepts/PlaceCatalog/PlaceCatalogConcept.test.ts
Principle: Places can be discovered and retrieved ...
------- output -------

=== Principle Test: Places can be discovered and retrieved ===
[SETUP] Created test place: 019a5c71-f978-7688-80a7-c1974f640436
----- output end -----
  1. Discover places in viewport ...
------- output -------

[QUERY] Discovering places in Boston area
  Output: [
  {
    id: "019a5c71-f978-7688-80a7-c1974f640436",
    name: "Boston Public Garden",
    category: "park",
    lat: 42.35,
    lng: -71.07
  }
]
  ✓ Found 1 place(s) in viewport
----- output end -----
  1. Discover places in viewport ... ok (20ms)
  2. Retrieve full place details ...
------- output -------

[QUERY] Retrieving full details for discovered place
  Output: {
  place: {
    id: "019a5c71-f978-7688-80a7-c1974f640436",
    name: "Boston Public Garden",
    address: "4 Charles Street, Boston, MA",
    category: "park",
    verified: false,
    addedBy: "system:test",
    location: { type: "Point", coordinates: [ -71.07, 42.35 ] },
    source: "user_added"
  }
}
  ✓ Retrieved full place details
----- output end -----
  2. Retrieve full place details ... ok (19ms)
------- output -------

✅ Principle demonstrated: Users discover places, then retrieve details
----- output end -----
Principle: Places can be discovered and retrieved ... ok (749ms)
Scenario: Empty viewport returns no places ...
------- output -------

=== Scenario: Empty viewport ===
[SETUP] Created distant place

[QUERY] Query empty area (no places nearby)
  Output: []
  ✓ Empty viewport correctly returns empty array
----- output end -----
Scenario: Empty viewport returns no places ... ok (670ms)
Scenario: Querying non-existent place returns error ...
------- output -------

=== Scenario: Non-existent place ===

[QUERY] Query non-existent place: 019a5c71-ff0c-75ed-b260-1c7fa95817c3
  Output: {
  error: "Place with ID 019a5c71-ff0c-75ed-b260-1c7fa95817c3 not found."
}
  ✓ Correctly returned error for non-existent place
----- output end -----
Scenario: Querying non-existent place returns error ... ok (689ms)
Scenario: Invalid viewport bounds rejected ...
------- output -------

=== Scenario: Invalid viewport bounds ===

[QUERY] Invalid viewport (south >= north)
  Output: { error: "Invalid viewport bounds." }
  ✓ Rejected viewport with south >= north

[QUERY] Invalid coordinates (lat > 90)
  Output: { error: "Invalid coordinates provided." }
  ✓ Rejected viewport with invalid coordinates

[QUERY] Empty placeId
  Output: { error: "Place ID is required." }
  ✓ Rejected empty placeId
----- output end -----
Scenario: Invalid viewport bounds rejected ... ok (641ms)
Scenario: Multiple places in viewport ...
------- output -------

=== Scenario: Multiple places in viewport ===
[SETUP] Created 3 places: 019a5c72-03fc-7645-bfe3-2d9c12a8a10f, 019a5c72-04b3-7479-a61c-016e622fa691, 019a5c72-04c5-78db-916f-673831da5a05

[QUERY] Query viewport containing multiple places
  Output: [
  {
    id: "019a5c72-03fc-7645-bfe3-2d9c12a8a10f",
    name: "Central Park",
    category: "park",
    lat: 42.36,
    lng: -71.07
  },
  {
    id: "019a5c72-04b3-7479-a61c-016e622fa691",
    name: "City Library",
    category: "library",
    lat: 42.37,
    lng: -71.08
  },
  {
    id: "019a5c72-04c5-78db-916f-673831da5a05",
    name: "Coffee Shop",
    category: "cafe",
    lat: 42.355,
    lng: -71.075
  }
]
  ✓ Found all 3 places in viewport
  ✓ All places have correct structure
----- output end -----
Scenario: Multiple places in viewport ... ok (692ms)
Scenario: Repeated queries return consistent results ...
------- output -------

=== Scenario: Repeated queries ===
[SETUP] Created test place: 019a5c72-06a4-7656-98be-4f151813907a

[QUERY] Query same place multiple times
  First query: {
  place: {
    id: "019a5c72-06a4-7656-98be-4f151813907a",
    name: "Consistent Place",
    address: "123 Test St",
    category: "test",
    verified: false,
    addedBy: "system:test",
    location: { type: "Point", coordinates: [ -71.07, 42.35 ] },
    source: "user_added"
  }
}
  Second query: {
  place: {
    id: "019a5c72-06a4-7656-98be-4f151813907a",
    name: "Consistent Place",
    address: "123 Test St",
    category: "test",
    verified: false,
    addedBy: "system:test",
    location: { type: "Point", coordinates: [ -71.07, 42.35 ] },
    source: "user_added"
  }
}
  Third query: {
  place: {
    id: "019a5c72-06a4-7656-98be-4f151813907a",
    name: "Consistent Place",
    address: "123 Test St",
    category: "test",
    verified: false,
    addedBy: "system:test",
    location: { type: "Point", coordinates: [ -71.07, 42.35 ] },
    source: "user_added"
  }
}
  ✓ All queries return consistent results
----- output end -----
Scenario: Repeated queries return consistent results ... ok (707ms)

ok | 6 passed (2 steps) | 0 failed (4s)

(base) mohammedihtisham@Ihtishams-MacBook-Pro Unwindr % 