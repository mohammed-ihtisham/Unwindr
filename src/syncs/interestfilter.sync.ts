/**
 * Synchronizations for InterestFilter concept actions
 * These syncs handle requests for InterestFilter actions that require authentication
 */

import { InterestFilter, Requesting, UserAuth } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Sync for InterestFilter.inferPreferencesFromText
 * This action requires authentication, so we validate the session token first
 */

// Step 1: When a request comes in for inferPreferencesFromText with sessionToken, validate the session
// Note: radius and locationHint are optional, so we only require path, sessionToken, and text
export const InferPreferencesRequest: Sync = ({
  request,
  sessionToken,
  text,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/InterestFilter/inferPreferencesFromText",
      sessionToken,
      text,
    },
    { request },
  ]),
  then: actions([UserAuth.getAuthenticatedUser, { sessionToken }]),
});

// Step 1b: Handle requests without sessionToken - return error immediately
// This matches requests that have userId but no sessionToken
// Note: radius and locationHint are optional, so we don't require them in the pattern
export const InferPreferencesNoToken: Sync = ({
  request,
  text,
  userId,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/InterestFilter/inferPreferencesFromText",
      text,
      userId,
    },
    { request },
  ]),
  then: actions([
    Requesting.respond,
    {
      request,
      error: "sessionToken is required for authentication",
    },
  ]),
});

// Step 2a: When authentication succeeds (userProfile has userId), call inferPreferencesFromText
// We need to capture text, radius, locationHint from the original request
// Note: radius and locationHint are optional, so we only require path, sessionToken, and text in the pattern
// We use a where clause to extract userId from the nested userProfile object
// The userId parameter is already a symbol from $vars, so we use it directly in the where clause
export const InferPreferencesAuthenticated: Sync = ({
  request,
  userProfile,
  text,
  sessionToken,
  userId,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/InterestFilter/inferPreferencesFromText",
        sessionToken,
        text,
      },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile }],
  ),
  where: (frames) => {
    // Extract userId from userProfile object and add it to the frame
    // userId and userProfile are symbols from the function parameters
    // Frames use symbols as keys, so we access values with bracket notation
    return frames.map((frame) => {
      const profile = frame[userProfile] as
        | { userId: string; username: string }
        | null;
      if (profile && profile.userId) {
        return { ...frame, [userId]: profile.userId };
      }
      return frame;
    });
  },
  then: actions([
    InterestFilter.inferPreferencesFromText,
    {
      userId,
      text,
      // radius and locationHint will be undefined if not in request, which is fine
    },
  ]),
});

// Step 2b: When authentication fails (userProfile is null), respond with error
export const InferPreferencesAuthFailed: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/InterestFilter/inferPreferencesFromText" },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile: null }],
  ),
  then: actions([
    Requesting.respond,
    { request, error: "Authentication required" },
  ]),
});

// Step 3a: When inferPreferencesFromText succeeds, respond with the result
export const InferPreferencesResponse: Sync = ({
  request,
  tags,
  exclusions,
  confidence,
  rationale,
  warnings,
  needsConfirmation,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/InterestFilter/inferPreferencesFromText" },
      { request },
    ],
    [
      InterestFilter.inferPreferencesFromText,
      {},
      {
        tags,
        exclusions,
        confidence,
        rationale,
        warnings,
        needsConfirmation,
      },
    ],
  ),
  then: actions([
    Requesting.respond,
    {
      request,
      tags,
      exclusions,
      confidence,
      rationale,
      warnings,
      needsConfirmation,
    },
  ]),
});

// Step 3b: When inferPreferencesFromText fails, respond with the error
export const InferPreferencesErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/InterestFilter/inferPreferencesFromText" },
      { request },
    ],
    [InterestFilter.inferPreferencesFromText, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
