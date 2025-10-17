import { Collection, Db } from "npm:mongodb";
import { compare, hash } from "npm:bcryptjs"; // Using bcryptjs for password hashing
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "UserAuth" + ".";

// Generic types of this concept
type User = ID; // The concept defines 'User' as an external ID type

/**
 * A set of Users with:
 *   a username String
 *   a passwordHash String
 *   a canModerate Flag
 */
interface UserDoc {
  _id: User;
  username: string;
  passwordHash: string;
  canModerate: boolean;
}

/**
 * concept UserAuth [User]
 * purpose authenticate users and manage moderator privileges
 * principle users must register and log in before contributing; moderators can verify content
 */
export default class UserAuthConcept {
  users: Collection<UserDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    // Ensure username is unique for efficient lookups and integrity
    this.users.createIndex({ username: 1 }, { unique: true });
  }

  /**
   * registerUser (username: String, password: String) : (userId: ID)
   *
   * **requires** username unique and password non-empty
   *
   * **effects** creates a new user with default permissions (cannot moderate); returns userId
   */
  async registerUser(
    { username, password }: { username: string; password: string },
  ): Promise<{ userId: User } | { error: string }> {
    // Check password non-empty
    if (!password || password.length === 0) {
      return { error: "Password cannot be empty" };
    }

    // Check username uniqueness is handled by the unique index, but we can do a quick check too
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
   * login (username: String, password: String) : (userId: ID)
   *
   * **requires** username exists and password matches
   *
   * **effects** returns authenticated userId
   */
  async login(
    { username, password }: { username: string; password: string },
  ): Promise<{ userId: User } | { error: string }> {
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

    // Return the authenticated user's ID
    return { userId: user._id };
  }

  /**
   * grantModerator (targetUserId: ID, adminUserId: ID): Empty
   *
   * **requires** adminUserId exists and canModerate is true
   *
   * **effects** sets canModerate to true for targetUserId
   */
  async grantModerator(
    { targetUserId, adminUserId }: { targetUserId: User; adminUserId: User },
  ): Promise<Empty | { error: string }> {
    // Find the admin user
    const adminUser = await this.users.findOne({ _id: adminUserId });

    // Check if admin user exists
    if (!adminUser) {
      return { error: "Admin user not found" };
    }

    // Check if admin user has moderator privileges
    if (!adminUser.canModerate) {
      return { error: "Admin user does not have moderator privileges" };
    }

    // Find the target user
    const targetUser = await this.users.findOne({ _id: targetUserId });

    // Check if target user exists
    if (!targetUser) {
      return { error: "Target user not found" };
    }

    // Update target user's canModerate flag
    await this.users.updateOne(
      { _id: targetUserId },
      { $set: { canModerate: true } },
    );

    return {}; // Success, return empty object
  }

  /**
   * _getUserDetails (userId: ID): (user: {username: String, canModerate: Boolean})
   *
   * **requires** userId exists
   *
   * **effects** returns user's username and moderation status
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
