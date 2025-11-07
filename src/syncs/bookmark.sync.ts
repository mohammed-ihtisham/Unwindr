/**
 * Synchronizations for Bookmark concept actions
 * These syncs handle requests for Bookmark actions that require authentication
 */

import { Bookmark, Requesting, UserAuth } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Sync for Bookmark.bookmarkPlace
 * Requires authentication to identify the user
 */

// Step 1: When a request comes in for bookmarkPlace with sessionToken, validate the session
export const BookmarkPlaceRequest: Sync = ({
  request,
  sessionToken,
  placeId,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Bookmark/bookmarkPlace",
      sessionToken,
      placeId,
    },
    { request },
  ]),
  then: actions([UserAuth.getAuthenticatedUser, { sessionToken }]),
});

// Step 2a: When authentication succeeds, call bookmarkPlace with userId from session
export const BookmarkPlaceAuthenticated: Sync = ({
  request,
  userProfile,
  placeId,
  sessionToken,
  userId,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/Bookmark/bookmarkPlace",
        sessionToken,
        placeId,
      },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile }],
  ),
  where: (frames) => {
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
    Bookmark.bookmarkPlace,
    {
      userId,
      placeId,
    },
  ]),
});

// Step 2b: When authentication fails, respond with error
export const BookmarkPlaceAuthFailed: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/bookmarkPlace" },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile: null }],
  ),
  then: actions([
    Requesting.respond,
    { request, error: "Authentication required" },
  ]),
});

// Step 3a: When bookmarkPlace succeeds, respond with the result
export const BookmarkPlaceResponse: Sync = ({
  request,
  bookmarkId,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/bookmarkPlace" },
      { request },
    ],
    [Bookmark.bookmarkPlace, {}, { bookmarkId }],
  ),
  then: actions([Requesting.respond, { request, bookmarkId }]),
});

// Step 3b: When bookmarkPlace fails, respond with the error
export const BookmarkPlaceErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/bookmarkPlace" },
      { request },
    ],
    [Bookmark.bookmarkPlace, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Sync for Bookmark.unbookmarkPlace
 * Requires authentication to identify the user
 */

export const UnbookmarkPlaceRequest: Sync = ({
  request,
  sessionToken,
  placeId,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Bookmark/unbookmarkPlace",
      sessionToken,
      placeId,
    },
    { request },
  ]),
  then: actions([UserAuth.getAuthenticatedUser, { sessionToken }]),
});

export const UnbookmarkPlaceAuthenticated: Sync = ({
  request,
  userProfile,
  placeId,
  sessionToken,
  userId,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/Bookmark/unbookmarkPlace",
        sessionToken,
        placeId,
      },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile }],
  ),
  where: (frames) => {
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
    Bookmark.unbookmarkPlace,
    {
      userId,
      placeId,
    },
  ]),
});

export const UnbookmarkPlaceAuthFailed: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/unbookmarkPlace" },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile: null }],
  ),
  then: actions([
    Requesting.respond,
    { request, error: "Authentication required" },
  ]),
});

export const UnbookmarkPlaceResponse: Sync = ({
  request,
  success,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/unbookmarkPlace" },
      { request },
    ],
    [Bookmark.unbookmarkPlace, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

/**
 * Sync for Bookmark.getUserBookmarks
 * Requires authentication to identify the user
 */

export const GetUserBookmarksRequest: Sync = ({
  request,
  sessionToken,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Bookmark/getUserBookmarks",
      sessionToken,
    },
    { request },
  ]),
  then: actions([UserAuth.getAuthenticatedUser, { sessionToken }]),
});

export const GetUserBookmarksAuthenticated: Sync = ({
  request,
  userProfile,
  sessionToken,
  userId,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/Bookmark/getUserBookmarks",
        sessionToken,
      },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile }],
  ),
  where: (frames) => {
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
    Bookmark.getUserBookmarks,
    {
      userId,
    },
  ]),
});

export const GetUserBookmarksAuthFailed: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/getUserBookmarks" },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile: null }],
  ),
  then: actions([
    Requesting.respond,
    { request, error: "Authentication required" },
  ]),
});

export const GetUserBookmarksResponse: Sync = ({
  request,
  bookmarkIds,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/getUserBookmarks" },
      { request },
    ],
    [Bookmark.getUserBookmarks, {}, { bookmarkIds }],
  ),
  then: actions([Requesting.respond, { request, bookmarkIds }]),
});

/**
 * Sync for Bookmark.getBookmarkedPlaces
 * Requires authentication to identify the user
 */

export const GetBookmarkedPlacesRequest: Sync = ({
  request,
  sessionToken,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Bookmark/getBookmarkedPlaces",
      sessionToken,
    },
    { request },
  ]),
  then: actions([UserAuth.getAuthenticatedUser, { sessionToken }]),
});

export const GetBookmarkedPlacesAuthenticated: Sync = ({
  request,
  userProfile,
  sessionToken,
  userId,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/Bookmark/getBookmarkedPlaces",
        sessionToken,
      },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile }],
  ),
  where: (frames) => {
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
    Bookmark.getBookmarkedPlaces,
    {
      userId,
    },
  ]),
});

export const GetBookmarkedPlacesAuthFailed: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/getBookmarkedPlaces" },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile: null }],
  ),
  then: actions([
    Requesting.respond,
    { request, error: "Authentication required" },
  ]),
});

export const GetBookmarkedPlacesResponse: Sync = ({
  request,
  placeIds,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/getBookmarkedPlaces" },
      { request },
    ],
    [Bookmark.getBookmarkedPlaces, {}, { placeIds }],
  ),
  then: actions([Requesting.respond, { request, placeIds }]),
});

/**
 * Sync for Bookmark.isBookmarked
 * Requires authentication to identify the user
 */

export const IsBookmarkedRequest: Sync = ({
  request,
  sessionToken,
  placeId,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Bookmark/isBookmarked",
      sessionToken,
      placeId,
    },
    { request },
  ]),
  then: actions([UserAuth.getAuthenticatedUser, { sessionToken }]),
});

export const IsBookmarkedAuthenticated: Sync = ({
  request,
  userProfile,
  placeId,
  sessionToken,
  userId,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/Bookmark/isBookmarked",
        sessionToken,
        placeId,
      },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile }],
  ),
  where: (frames) => {
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
    Bookmark.isBookmarked,
    {
      userId,
      placeId,
    },
  ]),
});

export const IsBookmarkedAuthFailed: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/isBookmarked" },
      { request },
    ],
    [UserAuth.getAuthenticatedUser, {}, { userProfile: null }],
  ),
  then: actions([
    Requesting.respond,
    { request, error: "Authentication required" },
  ]),
});

export const IsBookmarkedResponse: Sync = ({
  request,
  isBookmarked,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Bookmark/isBookmarked" },
      { request },
    ],
    [Bookmark.isBookmarked, {}, { isBookmarked }],
  ),
  then: actions([Requesting.respond, { request, isBookmarked }]),
});
