(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:interest-filter                                 
Task test:interest-filter deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/InterestFilter/InterestFilterConcept.test.ts
Check file:///Users/mohammedihtisham/Desktop/Unwindr/src/concepts/InterestFilter/InterestFilterConcept.test.ts
running 6 tests from ./src/concepts/InterestFilter/InterestFilterConcept.test.ts
Principle: Users manage preferences and filter places ...
------- output -------

=== Testing Principle Fulfillment for InterestFilter ===
Initializing allowed tags...
  ✓ Initial AllowedTags populated (13 tags)

[ACTION] Alice: setPreferences (manual)
  Input: { userId: user:Alice, tags: [quiet_spaces, waterfront_views] }
  Output: {}
  ✓ Alice's manual preferences set: quiet_spaces, waterfront_views
  [VERIFY] Alice's preferences in DB: {"_id":"user:Alice","source":"manual","tags":["quiet_spaces","waterfront_views"]}

[ACTION] Bob: inferPreferencesFromText (LLM)
  Input: { userId: user:Bob, text: "I want a calm place near water to relax, definitely not crowded." }
LLM call failed, falling back to mock: LLM call failed after 3 attempts: Expected double-quoted property name in JSON at position 121 (line 8 column 21)
  Output: {
  tags: [ "quiet_spaces", "waterfront_views", "not_crowded" ],
  exclusions: [],
  confidence: 0.75,
  rationale: "Based on keyword analysis of your input.",
  warnings: [],
  needsConfirmation: false
}
  ✓ Bob's inferred preferences: quiet_spaces, waterfront_views, not_crowded, exclusions: 
  [VERIFY] Bob's inferred state in DB: {"_id":"user:Bob","confidence":0.75,"exclusions":[],"lastPrompt":"I want a calm place near water to relax, definitely not crowded.","rationale":"Based on keyword analysis of your input.","tags":["quiet_spaces","waterfront_views","not_crowded"],"warnings":[]}
  [VERIFY] Bob's preferences in DB: {"_id":"user:Bob","source":"llm","tags":["quiet_spaces","waterfront_views","not_crowded"]}

[ACTION] Tagging places for matching...
  ✓ Places tagged: place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden, place:Riverside_Jazz_Nights, place:Old_Mill_Stone_Bridge
  [VERIFY] place:Larchmont_Manor_Park tags: ["quiet_spaces","waterfront_views"]

[ACTION] Alice: getMatchingPlaces
  Input: { userId: user:Alice, places: [place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden, place:Riverside_Jazz_Nights, place:Old_Mill_Stone_Bridge, place:Harbor_Lights_Boardwalk] }
  Output: {
  matches: [ "place:Larchmont_Manor_Park", "place:Maplewood_Reading_Garden" ]
}
  ✓ Alice's matched places: place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden

[ACTION] Bob: getMatchingPlaces
  Input: { userId: user:Bob, places: [place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden, place:Riverside_Jazz_Nights, place:Old_Mill_Stone_Bridge, place:Harbor_Lights_Boardwalk] }
  Output: {
  matches: [ "place:Larchmont_Manor_Park", "place:Maplewood_Reading_Garden" ]
}
  ✓ Bob's matched places: place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden

[ACTION] Bob: inferPreferencesFromText with exclusions
  Input: { userId: user:Bob, text: "I want quiet places, but avoid anything with loud music or nightlife." }
  Output: {
  tags: [ "quiet_spaces", "not_crowded" ],
  exclusions: [ "live_music", "lively_nightlife" ],
  confidence: 1,
  rationale: "The user explicitly requested quiet places and to avoid loud music and nightlife.",
  warnings: [],
  needsConfirmation: false
}
  ✓ Bob's inferred exclusions: live_music, lively_nightlife

[ACTION] Bob: getMatchingPlaces with exclusions applied
  Input: { userId: user:Bob, places: [place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden, place:Riverside_Jazz_Nights, place:Old_Mill_Stone_Bridge, place:Harbor_Lights_Boardwalk] }
  Output: {
  matches: [ "place:Larchmont_Manor_Park", "place:Maplewood_Reading_Garden" ]
}
  ✓ Bob's matched places with exclusions: place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden

✅ Principle demonstrated: Users can manage preferences (manual/LLM) and filter places effectively, including with exclusions.
----- output end -----
Principle: Users manage preferences and filter places ... ok (14s)
Action: setPreferences successfully sets and updates user preferences ...
------- output -------

=== Testing setPreferences Action ===

[TEST] Set preferences for Charlie successfully
  Input: { userId: user:Charlie, tags: [nature_walks, sunset_spots] }
Initializing allowed tags...
  Output: {}
  ✓ Charlie's preferences set: {"_id":"user:Charlie","source":"manual","tags":["nature_walks","sunset_spots"]}

[TEST] Update Charlie's preferences
  Input: { userId: user:Charlie, tags: [coffee_nooks] }
  Output: {}
  ✓ Charlie's preferences updated: {"_id":"user:Charlie","source":"manual","tags":["coffee_nooks"]}

[TEST] Reject setPreferences with empty tags
  Input: { userId: user:Charlie, tags: [] }
  Output: { error: "Tags cannot be empty." }
  ✓ Correctly rejected empty tags

[TEST] Reject setPreferences with invalid tags
  Input: { userId: user:Charlie, tags: ["invalid_tag_1", "quiet_spaces"] }
  Output: { error: "Invalid tags provided: invalid_tag_1" }
  ✓ Correctly rejected invalid tags

[TEST] Reject setPreferences with too many tags
  Input: { userId: user:Charlie, tags: [quiet_spaces, waterfront_views, nature_walks, sunset_spots, not_crowded, short_drive, instagram_worthy, lively_nightlife] }
  Output: { error: "Too many tags. Maximum 7 allowed." }
  ✓ Correctly rejected too many tags

✅ All setPreferences requirements and effects verified.
----- output end -----
Action: setPreferences successfully sets and updates user preferences ... ok (884ms)
Action: inferPreferencesFromText interprets text and updates user preferences ...
------- output -------

=== Testing inferPreferencesFromText Action ===

[TEST] Infer preferences for Alice from positive text
  Input: { userId: user:Alice, text: "I really love quiet places, especially with nature walks." }
Initializing allowed tags...
  Output: {
  tags: [ "quiet_spaces", "nature_walks", "not_crowded" ],
  exclusions: [],
  confidence: 0.95,
  rationale: "The user explicitly requested quiet places and nature walks, which are directly mapped to the tags, and 'not_crowded' is inferred from 'quiet places'.",
  warnings: [],
  needsConfirmation: false
}
  ✓ Alice's preferences inferred and stored: {"tags":["nature_walks","not_crowded","quiet_spaces"],"exclusions":[],"confidence":0.95,"rationale":"The user explicitly requested quiet places and nature walks, which are directly mapped to the tags, and 'not_crowded' is inferred from 'quiet places'.","warnings":[],"needsConfirmation":false}

[TEST] Infer preferences for Bob from text with exclusions and low confidence
  Input: { userId: user:Bob, text: "I want places for relaxing, but absolutely no noisy parties. I'm not sure though." }
LLM call failed, falling back to mock: LLM call failed after 3 attempts: Unexpected end of JSON input
  Output: {
  tags: [ "quiet_spaces" ],
  exclusions: [ "lively_nightlife" ],
  confidence: 0.5,
  rationale: "Based on keyword analysis of your input.",
  warnings: [ "User expressed uncertainty, lower confidence." ],
  needsConfirmation: true
}
  ✓ Bob's preferences inferred with exclusions, low confidence: {"tags":["quiet_spaces"],"exclusions":["lively_nightlife"],"confidence":0.5,"rationale":"Based on keyword analysis of your input.","warnings":["User expressed uncertainty, lower confidence."],"needsConfirmation":true}

[TEST] Reject inferPreferencesFromText with empty text
  Input: { userId: user:Charlie, text: "" }
  Output: { error: "Text cannot be empty." }
  ✓ Correctly rejected empty text

[TEST] LLM returns too many tags (should warn and truncate)
  Output: {
  tags: [
    "quiet_spaces",
    "waterfront_views",
    "nature_walks",
    "sunset_spots",
    "not_crowded",
    "short_drive",
    "instagram_worthy"
  ],
  exclusions: [],
  confidence: 0.8,
  rationale: "mock LLM too many tags",
  warnings: [ "LLM suggested too many tags. Keeping first 7." ],
  needsConfirmation: false
}
  ✓ LLM with too many tags handled: truncated, warned.

✅ All inferPreferencesFromText requirements and effects verified.
----- output end -----
Action: inferPreferencesFromText interprets text and updates user preferences ... ok (9s)
Action: tagPlace associates tags with places and enforces requirements ...
------- output -------

=== Testing tagPlace Action ===

[TEST] Tag PLACE_HISTORIC with 'historic_charms'
  Input: { placeId: place:Old_Mill_Stone_Bridge, tag: "historic_charms" }
Initializing allowed tags...
  Output: {}
  ✓ place:Old_Mill_Stone_Bridge tags: ["historic_charms"]

[TEST] Add 'instagram_worthy' to PLACE_HISTORIC
  Input: { placeId: place:Old_Mill_Stone_Bridge, tag: "instagram_worthy" }
  Output: {}
  ✓ place:Old_Mill_Stone_Bridge tags updated: ["historic_charms","instagram_worthy"]

[TEST] Add 'historic_charms' again to PLACE_HISTORIC (should be idempotent)
  Input: { placeId: place:Old_Mill_Stone_Bridge, tag: "historic_charms" }
  Output: {}
  ✓ Tagging existing tag is idempotent: ["historic_charms","instagram_worthy"]

[TEST] Reject tagPlace with an invalid tag
  Input: { placeId: place:Harbor_Lights_Boardwalk, tag: "non_existent_tag" }
  Output: { error: "Tag 'non_existent_tag' is not an allowed tag." }
  ✓ Correctly rejected invalid tag

✅ All tagPlace requirements and effects verified.
----- output end -----
Action: tagPlace associates tags with places and enforces requirements ... ok (896ms)
Action: clearPreferences removes user preferences ...
------- output -------

=== Testing clearPreferences Action ===

[SETUP] Set manual preferences for Alice
Initializing allowed tags...

[SETUP] Infer preferences for Alice
LLM call failed, falling back to mock: LLM call failed after 3 attempts: Unexpected end of JSON input
  ✓ Alice has existing preferences.

[TEST] Clear preferences for Alice
  Input: { userId: user:Alice }
  Output: {}
  ✓ Alice's preferences successfully cleared from DB.

[TEST] Clear preferences for Charlie who has no preferences
  Input: { userId: user:Charlie }
  Output: {}
  ✓ Clearing non-existent preferences is idempotent.

✅ All clearPreferences effects verified.
----- output end -----
Action: clearPreferences removes user preferences ... ok (7s)
Action: getMatchingPlaces returns relevant places based on user preferences and exclusions ...
------- output -------

=== Testing getMatchingPlaces Action ===

[SETUP] Tagging all mock places...
Initializing allowed tags...
  ✓ All mock places tagged.

[SETUP] Alice sets preferences: quiet_spaces, waterfront_views

[TEST] Alice gets matches without exclusions
  Input: { userId: user:Alice, places: [place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden, place:Riverside_Jazz_Nights, place:Old_Mill_Stone_Bridge, place:Harbor_Lights_Boardwalk] }
  Output: {
  matches: [
    "place:Larchmont_Manor_Park",
    "place:Harbor_Lights_Boardwalk",
    "place:Maplewood_Reading_Garden"
  ]
}
  ✓ Alice's matches: place:Larchmont_Manor_Park, place:Harbor_Lights_Boardwalk, place:Maplewood_Reading_Garden

[SETUP] Alice infers preferences with exclusions: avoids lively_nightlife, live_music
LLM call failed, falling back to mock: LLM call failed after 3 attempts: Unexpected end of JSON input
  ✓ Alice now has exclusions: lively_nightlife, live_music

[SETUP] Alice also sets manual preference for 'lively_nightlife'

[TEST] Alice gets matches WITH exclusions (PLACE_BAR should be excluded)
  Input: { userId: user:Alice, places: [place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden, place:Riverside_Jazz_Nights, place:Old_Mill_Stone_Bridge, place:Harbor_Lights_Boardwalk] }
  Output: {
  matches: [ "place:Larchmont_Manor_Park", "place:Maplewood_Reading_Garden" ]
}
  ✓ Alice's matches after exclusions: place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden

[TEST] Reject getMatchingPlaces for user with no preferences
  Input: { userId: user:Charlie, places: [place:Larchmont_Manor_Park, place:Maplewood_Reading_Garden, place:Riverside_Jazz_Nights, place:Old_Mill_Stone_Bridge, place:Harbor_Lights_Boardwalk] }
  Output: { error: "User has no preferences set to filter places." }
  ✓ Correctly rejected user with no preferences

[TEST] Reject getMatchingPlaces with empty places list
  Input: { userId: user:Alice, places: [] }
  Output: { error: "No places provided for matching." }
  ✓ Correctly rejected empty places list

✅ All getMatchingPlaces requirements and effects verified.
----- output end -----
Action: getMatchingPlaces returns relevant places based on user preferences and exclusions ... ok (7s)

ok | 6 passed | 0 failed (40s)
