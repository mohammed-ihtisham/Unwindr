/**
 * Synchronizations for UserAuth concept actions
 * These syncs handle requests for UserAuth actions that are excluded from passthrough
 */

import { Requesting, UserAuth } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Sync for UserAuth.logout
 * When a logout request comes in, call logout and respond with the result
 */
export const LogoutRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuth/logout", sessionToken },
    { request },
  ]),
  then: actions([UserAuth.logout, { sessionToken }]),
});

export const LogoutResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuth/logout" }, { request }],
    [UserAuth.logout, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

/**
 * Sync for UserAuth.getAuthenticatedUser
 * When a getAuthenticatedUser request comes in, call it and respond with the result
 */
export const GetAuthenticatedUserRequest: Sync = (
  { request, sessionToken },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuth/getAuthenticatedUser", sessionToken },
    { request },
  ]),
  then: actions([UserAuth.getAuthenticatedUser, { sessionToken }]),
});

export const GetAuthenticatedUserResponse: Sync = (
  { request, userProfile },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuth/getAuthenticatedUser" }, {
      request,
    }],
    [UserAuth.getAuthenticatedUser, {}, { userProfile }],
  ),
  then: actions([Requesting.respond, { request, userProfile }]),
});
