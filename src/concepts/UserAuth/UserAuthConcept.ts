import { Collection, Db } from "npm:mongodb";
import bcrypt from "npm:bcryptjs@2.4.3"; // Using bcryptjs for password hashing
import { ID } from "@utils/types.ts";
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
 */
interface UserDoc {
  _id: User;
  username: string;
  passwordHash: string;
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
 * purpose authenticate users
 * principle users must register and log in before contributing
 */
export default class UserAuthConcept {
  users: Collection<UserDoc>;
  activeSessions: Collection<SessionDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    // Ensure username is unique for efficient lookups and integrity
    this.users.createIndex({ username: 1 }, { unique: true });

    this.activeSessions = this.db.collection(PREFIX + "activeSessions");
  }

  /**
   * registerUser (username: String, password: String) : (userId: ID | Error)
   *
   * **requires** username unique and password non-empty
   *
   * **effects** creates a new user; returns userId on success or an Error on failure (e.g., username taken).
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
    const passwordHash = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Generate a fresh ID for the new user
    const newUserId = freshID();

    // Create the new user document
    const newUser: UserDoc = {
      _id: newUserId,
      username,
      passwordHash,
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
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

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
   * getAuthenticatedUser (sessionToken: String) : (userProfile: {userId: ID, username: String} | null)
   *
   * **requires** sessionToken is valid and exists in activeSessions
   *
   * **effect** returns a subset of user information for the authenticated user, or null if sessionToken is invalid.
   */
  async getAuthenticatedUser(
    { sessionToken }: { sessionToken: string },
  ): Promise<
    {
      userProfile: { userId: User; username: string } | null;
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
      { projection: { username: 1 } },
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
      },
    };
  }
}
