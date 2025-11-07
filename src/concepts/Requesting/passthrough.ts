/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // LikertSurvey - public queries and actions
  "/api/LikertSurvey/_getSurveyQuestions":
    "public query to retrieve survey questions",
  "/api/LikertSurvey/_getSurveyResponses":
    "public query to retrieve survey responses",
  "/api/LikertSurvey/_getRespondentAnswers":
    "public query to retrieve respondent answers",
  "/api/LikertSurvey/submitResponse":
    "public action allowing anyone to submit a response",
  "/api/LikertSurvey/updateResponse":
    "public action allowing anyone to update their response",

  // InterestFilter - public actions
  "/api/InterestFilter/tagPlace": "public action allowing anyone to tag places",
  "/api/InterestFilter/getMatchingPlaces":
    "public query to get matching places based on user preferences",
  "/api/InterestFilter/setPreferences":
    "public action allowing anyone to set manual preferences (no login required)",
  "/api/InterestFilter/clearPreferences":
    "public action allowing anyone to clear their preferences (no login required)",

  // MediaLibrary - public queries
  "/api/MediaLibrary/_getMediaByPlace":
    "public query to retrieve media IDs for a place",
  "/api/MediaLibrary/getMediaItemsByPlace":
    "public query to retrieve full media items for a place",
  "/api/MediaLibrary/getPreviewImagesForPlaces":
    "public query to get preview images for multiple places",

  // PlaceCatalog - public queries
  "/api/PlaceCatalog/_getPlaceDetails":
    "public query to retrieve place details",
  "/api/PlaceCatalog/getPlacesInViewport":
    "public query to get places within a viewport for map display",

  // UserAuth - public registration and login
  "/api/UserAuth/registerUser":
    "public action allowing anyone to register a new user",
  "/api/UserAuth/login": "public action allowing anyone to login",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // LikertSurvey - admin/authenticated actions
  "/api/LikertSurvey/createSurvey",
  "/api/LikertSurvey/addQuestion",

  // InterestFilter - private methods and authenticated actions
  "/api/InterestFilter/initializeAllowedTags", // private initialization method
  "/api/InterestFilter/_whitelistValidator", // private validator
  "/api/InterestFilter/_tagCountValidator", // private validator
  "/api/InterestFilter/_contradictionValidator", // private validator
  "/api/InterestFilter/_confidenceValidator", // private validator
  "/api/InterestFilter/_callLLM", // private LLM call method
  "/api/InterestFilter/_mockLLMCall", // private mock method
  "/api/InterestFilter/inferPreferencesFromText", // requires authentication (LLM generation)

  // MediaLibrary - backend/admin actions
  "/api/MediaLibrary/seedMedia", // backend-only seeding action

  // PlaceCatalog - authenticated actions
  "/api/PlaceCatalog/addPlace", // requires authentication

  // UserAuth - authenticated actions
  "/api/UserAuth/logout", // requires valid session token
  "/api/UserAuth/getAuthenticatedUser", // requires valid session token

  // Bookmark - all actions require authentication (user-specific)
  "/api/Bookmark/bookmarkPlace", // requires valid session token
  "/api/Bookmark/unbookmarkPlace", // requires valid session token
  "/api/Bookmark/getUserBookmarks", // requires valid session token
  "/api/Bookmark/getBookmarkedPlaces", // requires valid session token
  "/api/Bookmark/isBookmarked", // requires valid session token
];
