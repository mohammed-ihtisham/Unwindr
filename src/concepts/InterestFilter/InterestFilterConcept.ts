import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { callGeminiJSON } from "@utils/llm.ts";
import { PROMPT_BASELINE, type PromptBuilder } from "@utils/prompts.ts";

// Declare collection prefix using the concept name
const PREFIX = "InterestFilter" + ".";

// Generic types for this concept
type User = ID;
type Place = ID;
type TagString = string; // Using string for tags as per concept state description

// --- Helper Data and Constants from the original `data.ts` ---

// Canonical set of interest tags that users can have and places can be tagged with
// Note: This is now just a string, not a union type, for flexibility as per spec.
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

// Tag definition with human-readable description (used for AllowedTag collection)
interface AllowedTagData {
  tag: TagString;
  description: string;
}

// Complete list of allowed tags with descriptions
const INITIAL_ALLOWED_TAGS: AllowedTagData[] = [
  { tag: "quiet_spaces", description: "calm, low-noise places for relaxing" },
  { tag: "waterfront_views", description: "visible bodies of water nearby" },
  { tag: "nature_walks", description: "walkable paths/trails in nature" },
  { tag: "sunset_spots", description: "good west-facing sunset views" },
  { tag: "not_crowded", description: "typically low foot traffic" },
  { tag: "short_drive", description: "≈ within ~45 minutes by car" },
  { tag: "instagram_worthy", description: "notably photogenic scenes" },
  {
    tag: "lively_nightlife",
    description: "energetic evening venues/districts",
  },
  { tag: "live_music", description: "scheduled musical performances" },
  { tag: "historic_charms", description: "notable historic structures/areas" },
  { tag: "family_friendly", description: "amenities suitable for families" },
  { tag: "coffee_nooks", description: "cafés suited to lingering/reading" },
  { tag: "scenic_overlook", description: "elevated viewpoint with vistas" },
];

// Tag pairs that represent contradictory preferences
export type ContradictionPair = readonly [TagString, TagString];
const CONTRADICTION_PAIRS: ContradictionPair[] = [
  ["quiet_spaces", "lively_nightlife"],
  ["quiet_spaces", "live_music"],
] as const;

// Convenience array for validation (just the tag strings)
const ALLOWED_TAG_STRINGS: TagString[] = INITIAL_ALLOWED_TAGS.map((t) => t.tag);

// --- Concept State Interfaces (for MongoDB documents) ---

/**
 * a set of AllowedTag with
 *   a tag String
 *   a description String
 *
 * Stored as documents where _id is the tag string itself.
 */
interface AllowedTagDoc {
  _id: TagString;
  description: string;
}

/**
 * a set of UserPreferences with
 *   a userId Id
 *   a tags set of String
 *   a source String // "manual" or "llm"
 *
 * Stored as documents where _id is the userId.
 */
interface UserPreferencesDoc {
  _id: User;
  tags: TagString[];
  source: "manual" | "llm";
}

/**
 * a set of UserInferredPrefs with
 *   a userId Id
 *   a tags set String
 *   an exclusions set String
 *   a confidence Number
 *   a rationale String
 *   a warnings set String
 *   a lastPrompt String
 *
 * Stored as documents where _id is the userId.
 */
interface UserInferredPrefsDoc {
  _id: User;
  tags: TagString[];
  exclusions: TagString[];
  confidence: number;
  rationale: string;
  warnings: string[];
  lastPrompt: string;
}

/**
 * a set of PlaceTags with
 *   a placeId Id
 *   a tags set String
 *
 * Stored as documents where _id is the placeId.
 */
interface PlaceTagsDoc {
  _id: Place;
  tags: TagString[];
}

// --- Constants for validators ---
const TAG_MAX_COUNT = 7;
const CONFIDENCE_THRESHOLD = 0.65; // For needsConfirmation flag

/**
 * concept InterestFilter [User, Place]
 *
 * purpose allow users to express their interests so places can be filtered to match their preferences
 *
 * principle users pick preference tags or describe their desired "vibe" in natural language,
 * which gets translated into interest tags by LLMs, so places can be filtered to match their
 * preferences
 */
export default class InterestFilterConcept {
  allowedTags: Collection<AllowedTagDoc>;
  userPreferences: Collection<UserPreferencesDoc>;
  userInferredPrefs: Collection<UserInferredPrefsDoc>;
  placeTags: Collection<PlaceTagsDoc>;

  constructor(private readonly db: Db) {
    this.allowedTags = this.db.collection(PREFIX + "allowedTags");
    this.userPreferences = this.db.collection(PREFIX + "userPreferences");
    this.userInferredPrefs = this.db.collection(PREFIX + "userInferredPrefs");
    this.placeTags = this.db.collection(PREFIX + "placeTags");

    // Initialize allowed tags if the collection is empty
    this.initializeAllowedTags();
  }

  private async initializeAllowedTags() {
    if ((await this.allowedTags.countDocuments()) === 0) {
      console.log("Initializing allowed tags...");
      await this.allowedTags.insertMany(
        INITIAL_ALLOWED_TAGS.map((t) => ({
          _id: t.tag,
          description: t.description,
        })),
      );
    }
  }

  // --- Validators ---

  /**
   * whitelistValidator (tags: set String, exclusions: set String) : (valid: Flag, invalidTags: set String)
   * ensures every tag is in AllowedTags
   */
  private async _whitelistValidator(
    tags: TagString[],
    exclusions: TagString[] = [],
  ): Promise<{ valid: boolean; invalidTags?: TagString[] }> {
    const allInputTags = new Set([...tags, ...exclusions]);
    const storedAllowedTags = new Set(ALLOWED_TAG_STRINGS); // Use in-memory list for efficiency after initialization

    const invalidTags: TagString[] = [];
    for (const tag of allInputTags) {
      if (!storedAllowedTags.has(tag)) {
        invalidTags.push(tag);
      }
    }
    return { valid: invalidTags.length === 0, invalidTags };
  }

  /**
   * tagCountValidator (tags: set String) : (valid: Flag)
   * ensures the number of tags is under 7
   */
  private _tagCountValidator(tags: TagString[]): { valid: boolean } {
    return { valid: tags.length <= TAG_MAX_COUNT };
  }

  /**
   * contradictionValidator (tags: set String) : (hasContradictions: Flag, conflicts: set Pair)
   * detects contradictory tag pairs (e.g., quiet_spaces vs lively_nightlife)
   * returns conflict information for user resolution instead of blocking
   * triggers needsConfirmation flag when contradictions found
   */
  private _contradictionValidator(
    tags: TagString[],
  ): { hasContradictions: boolean; conflicts?: ContradictionPair[] } {
    const conflicts: ContradictionPair[] = [];
    const tagsSet = new Set(tags);

    for (const [tagA, tagB] of CONTRADICTION_PAIRS) {
      if (tagsSet.has(tagA) && tagsSet.has(tagB)) {
        conflicts.push([tagA, tagB]);
      }
    }
    return { hasContradictions: conflicts.length > 0, conflicts };
  }

  /**
   * confidenceValidator (confidence: Number) : (valid: Flag, needsConfirmation: Flag)
   * ensures 0 <= confidence <= 1;
   * if confidence < 0.65, return needsConfirmation flag (True)
   */
  private _confidenceValidator(
    confidence: number,
  ): { valid: boolean; needsConfirmation?: boolean } {
    const valid = confidence >= 0 && confidence <= 1;
    const needsConfirmation = valid && confidence < CONFIDENCE_THRESHOLD;
    return { valid, needsConfirmation };
  }

  // --- Actions ---

  /**
   * setPreferences (userId: Id, tags: set String) : Empty | { error: string }
   *
   * **requires** user is authenticated, tags not empty, and all tags in AllowedTags
   * **effect** saves preferences for user with source="manual"
   */
  public async setPreferences(
    { userId, tags }: { userId: User; tags: TagString[] },
  ): Promise<Empty | { error: string }> {
    if (!userId) return { error: "User ID is required." };
    if (!tags || tags.length === 0) return { error: "Tags cannot be empty." };

    const { valid: whitelistValid, invalidTags } = await this
      ._whitelistValidator(tags);
    if (!whitelistValid) {
      return { error: `Invalid tags provided: ${invalidTags?.join(", ")}` };
    }

    const { valid: countValid } = this._tagCountValidator(tags);
    if (!countValid) {
      return { error: `Too many tags. Maximum ${TAG_MAX_COUNT} allowed.` };
    }

    // Contradictions are not a blocking error for setPreferences, but could be returned as a warning
    // For now, per spec, it's just about saving preferences.
    // const { hasContradictions, conflicts } = this._contradictionValidator(tags);
    // if (hasContradictions) { ... consider returning a warning ... }

    await this.userPreferences.updateOne(
      { _id: userId },
      { $set: { tags: tags, source: "manual" } },
      { upsert: true }, // Create if not exists
    );

    return {};
  }

  /**
   * inferPreferencesFromText (userId: Id, text: String, radius?: Number, locationHint?: String)
   *   : { tags: TagString[], exclusions: TagString[], confidence: number, rationale: string, warnings: string[] } | { error: string }
   *
   * **requires** user is authenticated and text is not empty
   * **effect** calls an AI model to interpret the text and suggest tags and optional exclusions,
   *   records confidence and rationale, stores them in UserInferredPrefs,
   *   and updates UserPreferences with source = "llm" and the inferred tags
   */
  public async inferPreferencesFromText(
    { userId, text, radius, locationHint, promptBuilder }: {
      userId: User;
      text: string;
      radius?: number;
      locationHint?: string;
      promptBuilder?: PromptBuilder;
    },
  ): Promise<
    | {
      tags: TagString[];
      exclusions: TagString[];
      confidence: number;
      rationale: string;
      warnings: string[];
      needsConfirmation?: boolean;
    }
    | { error: string }
  > {
    if (!userId) return { error: "User ID is required." };
    if (!text || text.trim() === "") return { error: "Text cannot be empty." };

    // --- Call LLM or use mock fallback ---
    const llmResult = await this._callLLM(
      text,
      radius,
      locationHint,
      promptBuilder,
    );
    let { tags, exclusions, confidence, rationale, warnings } = llmResult;
    const lastPrompt = text; // Storing the input text as the last prompt

    // Validate inferred tags and exclusions against whitelist
    const { valid: whitelistValid, invalidTags } = await this
      ._whitelistValidator(
        tags,
        exclusions,
      );
    if (!whitelistValid) {
      warnings.push(`LLM suggested invalid tags: ${invalidTags?.join(", ")}`);
      // Filter out invalid tags to proceed
      tags = tags.filter((t) => ALLOWED_TAG_STRINGS.includes(t));
      exclusions = exclusions.filter((t) => ALLOWED_TAG_STRINGS.includes(t));
    }

    // Validate tag count
    const { valid: countValid } = this._tagCountValidator(tags);
    if (!countValid) {
      warnings.push(
        `LLM suggested too many tags. Keeping first ${TAG_MAX_COUNT}.`,
      );
      tags = tags.slice(0, TAG_MAX_COUNT);
    }

    // Check for contradictions
    const { hasContradictions, conflicts } = this._contradictionValidator(tags);
    if (hasContradictions) {
      warnings.push(
        `Contradictory tags detected: ${
          conflicts?.map((p) => p.join(" vs ")).join(", ")
        }. User review recommended.`,
      );
      // For now, we don't auto-resolve, just warn. User might want "lively_nightlife" but also "quiet_spaces" for different times.
    }

    // Validate confidence
    const { valid: confidenceValid, needsConfirmation } = this
      ._confidenceValidator(confidence);
    if (!confidenceValid) {
      warnings.push(
        "LLM confidence out of valid range [0, 1]. Defaulting to 0.5.",
      );
      confidence = 0.5; // Default or clamp if invalid
    }

    // Store in UserInferredPrefs
    await this.userInferredPrefs.updateOne(
      { _id: userId },
      {
        $set: { tags, exclusions, confidence, rationale, warnings, lastPrompt },
      },
      { upsert: true },
    );

    // Update UserPreferences with LLM-inferred tags
    await this.userPreferences.updateOne(
      { _id: userId },
      { $set: { tags: tags, source: "llm" } },
      { upsert: true },
    );

    return {
      tags,
      exclusions,
      confidence,
      rationale,
      warnings,
      needsConfirmation,
    };
  }

  /**
   * tagPlace (placeId: Id, tag: String) : Empty | { error: string }
   *
   * **requires** place exists and tag in AllowedTags
   * **effect** associates the tag with the place in PlaceTags
   */
  public async tagPlace(
    { placeId, tag }: { placeId: Place; tag: TagString },
  ): Promise<Empty | { error: string }> {
    if (!placeId) return { error: "Place ID is required." };
    if (!tag) return { error: "Tag is required." };

    const { valid: whitelistValid, invalidTags } = await this
      ._whitelistValidator([tag]);
    if (!whitelistValid) {
      return { error: `Tag '${tag}' is not an allowed tag.` };
    }

    await this.placeTags.updateOne(
      { _id: placeId },
      { $addToSet: { tags: tag } }, // Add tag if not already present
      { upsert: true },
    );

    return {};
  }

  /**
   * clearPreferences (userId: Id) : Empty | { error: string }
   *
   * **requires** user is authenticated
   * **effect** removes all UserPreferences and UserInferredPrefs for the user
   */
  public async clearPreferences(
    { userId }: { userId: User },
  ): Promise<Empty | { error: string }> {
    if (!userId) return { error: "User ID is required." };

    await this.userPreferences.deleteOne({ _id: userId });
    await this.userInferredPrefs.deleteOne({ _id: userId });

    return {};
  }

  /**
   * getMatchingPlaces (userId: Id, places: set Id) : { matches: Place[] } | { error: string }
   *
   * **requires** user has either set manual or llm preferences
   * **effect** returns places whose tags overlap with user's preferred tags,
   *   ranked by relevance score, down-ranking places that match excluded tags
   *
   * Note: This is defined as an action returning data, not a query prefixed with '_'.
   */
  public async getMatchingPlaces(
    { userId, places }: { userId: User; places: Place[] },
  ): Promise<{ matches: Place[] } | { error: string }> {
    if (!userId) return { error: "User ID is required." };
    if (!places || places.length === 0) {
      return { error: "No places provided for matching." };
    }

    const userPrefs = await this.userPreferences.findOne({ _id: userId });
    if (!userPrefs || userPrefs.tags.length === 0) {
      return { error: "User has no preferences set to filter places." };
    }

    const inferredPrefs = await this.userInferredPrefs.findOne({ _id: userId });
    const userPreferredTags = new Set(userPrefs.tags);
    const userExcludedTags = new Set(inferredPrefs?.exclusions || []);

    const matchingPlaceDocs = await this.placeTags.find({
      _id: { $in: places },
      tags: { $in: Array.from(userPreferredTags) },
    }).toArray();

    // Calculate relevance score and filter based on exclusions
    const scoredMatches: { placeId: Place; score: number }[] = [];
    for (const placeDoc of matchingPlaceDocs) {
      let score = 0;
      let excluded = false;
      for (const tag of placeDoc.tags) {
        if (userPreferredTags.has(tag)) {
          score += 1; // Increase score for matching preferred tags
        }
        if (userExcludedTags.has(tag)) {
          excluded = true; // Mark as excluded if any excluded tag matches
          // Could also reduce score significantly instead of outright excluding if desired
        }
      }

      if (!excluded && score > 0) { // Only include if not excluded and has at least one matching preferred tag
        scoredMatches.push({ placeId: placeDoc._id, score });
      }
    }

    // Sort by score (descending), then by placeId (alphabetically) for stable ordering
    scoredMatches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Secondary sort by placeId for deterministic ordering when scores are equal
      return a.placeId.localeCompare(b.placeId);
    });

    return { matches: scoredMatches.map((m) => m.placeId) };
  }

  private async _callLLM(
    text: string,
    radius?: number,
    locationHint?: string,
    promptBuilder?: PromptBuilder,
  ): Promise<{
    tags: TagString[];
    exclusions: TagString[];
    confidence: number;
    rationale: string;
    warnings: string[];
  }> {
    // Check if GEMINI_API_KEY is available
    const hasApiKey = Deno.env.get("GEMINI_API_KEY");

    if (hasApiKey) {
      try {
        // Use real Gemini LLM
        const builder = promptBuilder ?? PROMPT_BASELINE;
        const prompt = builder({
          text,
          allowedTags: INITIAL_ALLOWED_TAGS,
          radius,
          locationHint,
        });

        const raw = await callGeminiJSON(prompt);

        // Parse and validate the response
        const tags: TagString[] = Array.isArray(raw.tags) ? raw.tags : [];
        const exclusions: TagString[] = Array.isArray(raw.exclusions)
          ? raw.exclusions
          : [];
        const confidence: number = typeof raw.confidence === "number"
          ? raw.confidence
          : 0.5;
        const rationale: string = typeof raw.rationale === "string"
          ? raw.rationale
          : "AI inference";
        const warnings: string[] = Array.isArray(raw.warnings)
          ? raw.warnings
          : [];

        return { tags, exclusions, confidence, rationale, warnings };
      } catch (error) {
        console.warn(
          "LLM call failed, falling back to mock:",
          error instanceof Error ? error.message : error,
        );
        // Fall through to mock implementation
      }
    }

    // Use mock implementation for testing or when API key is not available
    return this._mockLLMCall(text, radius, locationHint);
  }

  // --- Mock LLM Call for testing without API key ---
  private _mockLLMCall(
    text: string,
    _radius?: number,
    _locationHint?: string,
  ): {
    tags: TagString[];
    exclusions: TagString[];
    confidence: number;
    rationale: string;
    warnings: string[];
  } {
    const tags: TagString[] = [];
    const exclusions: TagString[] = [];
    let confidence = 0.75;
    const rationale = "Based on keyword analysis of your input.";
    const warnings: string[] = [];

    // Simple keyword mapping
    if (
      text.toLowerCase().includes("calm") ||
      text.toLowerCase().includes("peaceful") ||
      text.toLowerCase().includes("quiet") ||
      text.toLowerCase().includes("relax")
    ) {
      tags.push("quiet_spaces");
    }
    if (
      text.toLowerCase().includes("water") ||
      text.toLowerCase().includes("ocean")
    ) {
      tags.push("waterfront_views");
    }
    if (
      text.toLowerCase().includes("nature") ||
      text.toLowerCase().includes("hike")
    ) {
      tags.push("nature_walks");
    }
    if (
      text.toLowerCase().includes("party") ||
      text.toLowerCase().includes("bars")
    ) {
      tags.push("lively_nightlife");
    }
    if (
      text.toLowerCase().includes("music") ||
      text.toLowerCase().includes("bands")
    ) {
      tags.push("live_music");
    }
    if (
      text.toLowerCase().includes("coffee") ||
      text.toLowerCase().includes("cafe")
    ) {
      tags.push("coffee_nooks");
    }
    if (text.toLowerCase().includes("not crowded")) {
      tags.push("not_crowded");
    }

    // Handle exclusions based on "avoid" or "not" patterns
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("avoid") &&
      (lowerText.includes("loud") || lowerText.includes("music") ||
        lowerText.includes("nightlife") || lowerText.includes("parties"))
    ) {
      exclusions.push("lively_nightlife", "live_music");
    }
    if (
      lowerText.includes("no noisy") ||
      lowerText.includes("not noisy") ||
      (lowerText.includes("no") && lowerText.includes("parties"))
    ) {
      exclusions.push("lively_nightlife");
    }

    // Simulate lower confidence for shorter or ambiguous texts
    if (text.length < 15) {
      confidence = 0.5;
      warnings.push("Short input text, lower confidence.");
    }
    if (
      text.toLowerCase().includes("i don't know") ||
      text.toLowerCase().includes("not sure") ||
      text.toLowerCase().includes("i'm not sure")
    ) {
      confidence = 0.5;
      warnings.push("User expressed uncertainty, lower confidence.");
    }

    // Ensure tags are unique
    const uniqueTags = Array.from(new Set(tags));
    const uniqueExclusions = Array.from(new Set(exclusions));

    return {
      tags: uniqueTags,
      exclusions: uniqueExclusions,
      confidence,
      rationale,
      warnings,
    };
  }
}
