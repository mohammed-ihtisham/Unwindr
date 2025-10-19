---
timestamp: 'Sat Oct 18 2025 17:42:14 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_174214.b939b1f6.md]]'
content_id: 9523eafb04e592a5f3f64238fd20582070d2092167f581a6b0feb62a85f16819
---

# file: src/concepts/UserAuth/UserAuthConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { compare, hash } from "npm:bcryptjs"; // Using bcryptjs for password hashing
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "UserAuth" + ".";

// Generic types of this concept
type User = ID; // The concept defines 'User' as an external ID type
type SessionToken = ID; // Session tokens are also IDs

/**
 * A set of Users with:
 *   _id: ID
 *   username: String
 *   passwordHash: String
 *   canModerate: Flag
 */
interface UserDoc {
  _id: User;
  username: string;
  passwordHash: string;
  canModerate: boolean;
}

/**
 * A set of activeSessions with:
 *   _id: SessionToken (the session token itself)
 *   userId: ID
 *   createdAt: Date // To manage session expiry later if needed
 */
interface SessionDoc {
  _id: SessionToken;
  userId: User;
  createdAt: Date;
}

/**
 * concept UserAuth [User]
 * purpose authenticate users and manage moderator privileges
 * principle users must register and log in before contributing; moderators can verify content
 */
export default class UserAuthConcept {
  users: Collection<UserDoc>;
  activeSessions: Collection<SessionDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    // Ensure username is unique for efficient lookups and integrity
    this.users.createIndex({ username: 1 }, { unique: true });

    this.activeSessions = this.db.collection(PREFIX + "activeSessions");
    // Index for finding sessions by user (e.g., to invalidate all sessions for a user)
    this.activeSessions.createIndex({ userId: 1 });
    // Ensure session token is unique
    this.activeSessions.createIndex({ _id: 1 }, { unique: true });
  }

  /**
   * registerUser (username: String, password: String) : (userId: ID | Error)
   *
   * **requires** username unique and password non-empty
   *
   * **effects** creates a new user with default permissions (cannot moderate); returns userId on success or an Error on failure (e.g., username taken).
   */
  async registerUser(
    { username, password }: { username: string; password: string },
  ): Promise<{ userId: User } | { error: string }> {
    // Check password non-empty
    if (!password || password.length === 0) {
      return { error: "Password cannot be empty" };
    }

    // Check username uniqueness implicitly handled by unique index on insertion,
    // but an explicit check provides a clearer error message.
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already taken" };
    }

    // Hash the password
    const passwordHash = await hash(password, 10); // 10 is the salt rounds

    // Generate a fresh ID for the new user
    const newUserId = freshID();

    // Create the new user document
    const newUser: UserDoc = {
      _id: newUserId,
      username,
      passwordHash,
      canModerate: false, // Default permissions: cannot moderate
    };

    // Insert into the database
    await this.users.insertOne(newUser);

    // Return the new user's ID
    return { userId: newUserId };
  }

  /**
   * login (username: String, password: String) : (sessionToken: String | Error)
   *
   * **requires** username exists and password matches
   *
   * **effect** creates a new active session, returns a new unique sessionToken on success. Returns an Error (e.g., "Invalid credentials") on failure.
   */
  async login(
    { username, password }: { username: string; password: string },
  ): Promise<{ sessionToken: string } | { error: string }> {
    // Find the user by username
    const user = await this.users.findOne({ username });

    // Check if user exists
    if (!user) {
      return { error: "Invalid username or password" };
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await compare(password, user.passwordHash);

    // If password does not match
    if (!isPasswordValid) {
      return { error: "Invalid username or password" };
    }

    // Generate a fresh ID for the new session token
    const sessionToken: SessionToken = freshID();
    const newSession: SessionDoc = {
      _id: sessionToken,
      userId: user._id,
      createdAt: new Date(),
    };

    // Insert the new active session
    await this.activeSessions.insertOne(newSession);

    // Return the new session token
    return { sessionToken };
  }

  /**
   * logout (sessionToken: String) : (success: Boolean)
   *
   * **requires** sessionToken exists in activeSessions
   *
   * **effect** removes the sessionToken from activeSessions, returns true on success, false otherwise.
   */
  async logout(
    { sessionToken }: { sessionToken: string },
  ): Promise<{ success: boolean }> {
    const result = await this.activeSessions.deleteOne({
      _id: sessionToken as SessionToken,
    });
    return { success: result.deletedCount === 1 };
  }

  /**
   * getAuthenticatedUser (sessionToken: String) : (userProfile: {userId: ID, username: String, canModerate: Flag} | null)
   *
   * **requires** sessionToken is valid and exists in activeSessions
   *
   * **effect** returns a subset of user information for the authenticated user, or null if sessionToken is invalid.
   */
  async getAuthenticatedUser(
    { sessionToken }: { sessionToken: string },
  ): Promise<
    {
      userProfile:
        | { userId: User; username: string; canModerate: boolean }
        | null;
    }
  > {
    const session = await this.activeSessions.findOne({
      _id: sessionToken as SessionToken,
    });

    if (!session) {
      return { userProfile: null };
    }

    const user = await this.users.findOne(
      { _id: session.userId },
      { projection: { username: 1, canModerate: 1 } },
    );

    if (!user) {
      // This case means a session exists for a non-existent user, indicating
      // a data inconsistency. Clean up the session.
      await this.activeSessions.deleteOne({
        _id: sessionToken as SessionToken,
      });
      return { userProfile: null };
    }

    return {
      userProfile: {
        userId: user._id,
        username: user.username,
        canModerate: user.canModerate,
      },
    };
  }

  /**
   * changePassword (sessionToken: String, oldPassword: String, newPassword: String) : (success: Boolean | Error)
   *
   * **requires** sessionToken is valid and linked to a user, oldPassword matches the user's current passwordHash, and newPassword is non-empty.
   *
   * **effect** updates the passwordHash for the authenticated user, invalidates existing sessionTokens, returns true on success, or an Error on failure.
   */
  async changePassword(
    { sessionToken, oldPassword, newPassword }: {
      sessionToken: string;
      oldPassword: string;
      newPassword: string;
    },
  ): Promise<{ success: boolean } | { error: string }> {
    if (!newPassword || newPassword.length === 0) {
      return { error: "New password cannot be empty" };
    }

    const session = await this.activeSessions.findOne({
      _id: sessionToken as SessionToken,
    });
    if (!session) {
      return { error: "Invalid session" };
    }

    const user = await this.users.findOne({ _id: session.userId });
    if (!user) {
      // Data inconsistency: session points to non-existent user. Clean up session.
      await this.activeSessions.deleteOne({
        _id: sessionToken as SessionToken,
      });
      return { error: "User not found for session" };
    }

    const isOldPasswordValid = await compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      return { error: "Old password does not match" };
    }

    const newPasswordHash = await hash(newPassword, 10);

    // Update password
    await this.users.updateOne(
      { _id: user._id },
      { $set: { passwordHash: newPasswordHash } },
    );

    // Invalidate all sessions for this user (security best practice after password change)
    await this.activeSessions.deleteMany({ userId: user._id });

    return { success: true };
  }

  /**
   * grantModerator (targetUserId: ID, adminSessionToken: String) : (success: Boolean | Error)
   *
   * **requires** adminSessionToken is valid and linked to a user whose canModerate is true, and targetUserId exists.
   *
   * **effect** sets canModerate to true for targetUser, returns true on success, or an Error on failure.
   */
  async grantModerator(
    { targetUserId, adminSessionToken }: {
      targetUserId: User;
      adminSessionToken: string;
    },
  ): Promise<{ success: boolean } | { error: string }> {
    const adminSession = await this.activeSessions.findOne({
      _id: adminSessionToken as SessionToken,
    });
    if (!adminSession) {
      return { error: "Invalid admin session" };
    }

    const adminUser = await this.users.findOne({ _id: adminSession.userId });
    if (!adminUser) {
      // Data inconsistency. Clean up session.
      await this.activeSessions.deleteOne({
        _id: adminSessionToken as SessionToken,
      });
      return { error: "Admin user not found for session" };
    }

    if (!adminUser.canModerate) {
      return { error: "Admin user does not have moderator privileges" };
    }

    const targetUser = await this.users.findOne({ _id: targetUserId });
    if (!targetUser) {
      return { error: "Target user not found" };
    }

    // Check if target user is already a moderator for idempotency
    if (targetUser.canModerate) {
      return { success: true };
    }

    await this.users.updateOne(
      { _id: targetUserId },
      { $set: { canModerate: true } },
    );

    return { success: true };
  }

  /**
   * revokeModerator (targetUserId: ID, adminSessionToken: String) : (success: Boolean | Error)
   *
   * **requires** adminSessionToken is valid and linked to a user whose canModerate is true, and targetUserId exists.
   *
   * **effect** sets canModerate to false for targetUser, returns true on success, or an Error on failure.
   */
  async revokeModerator(
    { targetUserId, adminSessionToken }: {
      targetUserId: User;
      adminSessionToken: string;
    },
  ): Promise<{ success: boolean } | { error: string }> {
    const adminSession = await this.activeSessions.findOne({
      _id: adminSessionToken as SessionToken,
    });
    if (!adminSession) {
      return { error: "Invalid admin session" };
    }

    const adminUser = await this.users.findOne({ _id: adminSession.userId });
    if (!adminUser) {
      // Data inconsistency. Clean up session.
      await this.activeSessions.deleteOne({
        _id: adminSessionToken as SessionToken,
      });
      return { error: "Admin user not found for session" };
    }

    if (!adminUser.canModerate) {
      return { error: "Admin user does not have moderator privileges" };
    }

    const targetUser = await this.users.findOne({ _id: targetUserId });
    if (!targetUser) {
      return { error: "Target user not found" };
    }

    // Check if target user is not a moderator already for idempotency
    if (!targetUser.canModerate) {
      return { success: true };
    }

    await this.users.updateOne(
      { _id: targetUserId },
      { $set: { canModerate: false } },
    );

    return { success: true };
  }

  /**
   * _getUserDetails (userId: ID): (user: {username: String, canModerate: Boolean})
   *
   * **requires** userId exists
   *
   * **effects** returns user's username and moderation status
   * Note: This is a query, so it returns an array of results.
   */
  async _getUserDetails(
    { userId }: { userId: User },
  ): Promise<
    Array<{ user: { username: string; canModerate: boolean } }> | {
      error: string;
    }
  > {
    const user = await this.users.findOne(
      { _id: userId },
      { projection: { username: 1, canModerate: 1 } },
    );

    if (!user) {
      return { error: "User not found" };
    }

    return [{
      user: { username: user.username, canModerate: user.canModerate },
    }];
  }

  /**
   * _isModerator (userId: ID): (isModerator: Boolean)
   *
   * **requires** userId exists
   *
   * **effects** returns true if user can moderate, false otherwise
   * Note: This is a query, so it returns an array of results.
   */
  async _isModerator(
    { userId }: { userId: User },
  ): Promise<Array<{ isModerator: boolean }> | { error: string }> {
    const user = await this.users.findOne(
      { _id: userId },
      { projection: { canModerate: 1 } },
    );

    if (!user) {
      return { error: "User not found" };
    }

    return [{ isModerator: user.canModerate }];
  }
}

```

[Test File](../../../src/concepts/UserAuth/UserAuthConcept.test.ts)

[Current Test Errors](../../brainstorming/debugging.md)
