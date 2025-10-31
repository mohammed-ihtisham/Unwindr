// Canonical Tag type used across the app
export type Tag =
  | "quiet_spaces"
  | "waterfront_views"
  | "nature_walks"
  | "sunset_spots"
  | "not_crowded"
  | "short_drive"
  | "instagram_worthy"
  | "lively_nightlife"
  | "live_music"
  | "historic_charms"
  | "family_friendly"
  | "coffee_nooks"
  | "scenic_overlook";

// Canonical allowed tags list
export const ALLOWED_TAGS: ReadonlyArray<Tag> = [
  "quiet_spaces",
  "waterfront_views",
  "nature_walks",
  "sunset_spots",
  "not_crowded",
  "short_drive",
  "instagram_worthy",
  "lively_nightlife",
  "live_music",
  "historic_charms",
  "family_friendly",
  "coffee_nooks",
  "scenic_overlook",
] as const;
