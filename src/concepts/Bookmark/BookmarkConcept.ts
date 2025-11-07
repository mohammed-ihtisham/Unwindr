import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "Bookmark" + ".";

// Generic types of this concept
type User = ID;
type Place = ID;
type BookmarkId = ID;

/**
 * a set of Bookmarks with
 *   an _id Id
 *   a userId Id
 *   a placeId Id
 *   a createdAt Date
 */
interface BookmarkDocument {
  _id: BookmarkId;
  userId: User;
  placeId: Place;
  createdAt: Date;
}

export default class BookmarkConcept {
  bookmarks: Collection<BookmarkDocument>;

  constructor(private readonly db: Db) {
    this.bookmarks = this.db.collection<BookmarkDocument>(PREFIX + "bookmarks");
  }

  /**
   * bookmarkPlace (userId: Id, placeId: Id) : (bookmarkId: Id | Error)
   *
   * requires user and place exist, bookmark does not already exist for this user-place pair
   * effect creates a new bookmark, returns bookmarkId on success or an Error on failure (e.g., already bookmarked)
   */
  async bookmarkPlace({ userId, placeId }: { userId: User; placeId: Place }): Promise<{ bookmarkId: BookmarkId } | { error: string }> {
    try {
      // Check if bookmark already exists
      const existingBookmark = await this.bookmarks.findOne({ userId, placeId });
      if (existingBookmark) {
        return { error: "Bookmark already exists for this user and place." };
      }

      const bookmarkId = freshID() as BookmarkId;
      const createdAt = new Date();

      const bookmark: BookmarkDocument = {
        _id: bookmarkId,
        userId,
        placeId,
        createdAt,
      };

      await this.bookmarks.insertOne(bookmark);

      return { bookmarkId };
    } catch (e) {
      console.error(e);
      return { error: "Failed to create bookmark." };
    }
  }

  /**
   * unbookmarkPlace (userId: Id, placeId: Id) : (success: Boolean)
   *
   * requires bookmark exists for this user-place pair
   * effect removes the bookmark, returns true on success, false otherwise
   */
  async unbookmarkPlace({ userId, placeId }: { userId: User; placeId: Place }): Promise<{ success: boolean }> {
    try {
      const result = await this.bookmarks.deleteOne({ userId, placeId });
      return { success: result.deletedCount === 1 };
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  }

  /**
   * getUserBookmarks (userId: Id) : (bookmarkIds: Array<Id>)
   *
   * requires user exists
   * effect returns all bookmark IDs for the user, ordered by createdAt desc
   */
  async getUserBookmarks({ userId }: { userId: User }): Promise<{ bookmarkIds: BookmarkId[] }> {
    try {
      const bookmarks = await this.bookmarks
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      const bookmarkIds = bookmarks.map((bookmark) => bookmark._id);
      return { bookmarkIds };
    } catch (e) {
      console.error(e);
      return { bookmarkIds: [] };
    }
  }

  /**
   * getBookmarkedPlaces (userId: Id) : (placeIds: Array<Id>)
   *
   * requires user exists
   * effect returns all place IDs that the user has bookmarked, ordered by createdAt desc
   */
  async getBookmarkedPlaces({ userId }: { userId: User }): Promise<{ placeIds: Place[] }> {
    try {
      const bookmarks = await this.bookmarks
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      const placeIds = bookmarks.map((bookmark) => bookmark.placeId);
      return { placeIds };
    } catch (e) {
      console.error(e);
      return { placeIds: [] };
    }
  }

  /**
   * isBookmarked (userId: Id, placeId: Id) : (isBookmarked: Boolean)
   *
   * requires user and place exist
   * effect returns true if the place is bookmarked by the user, false otherwise
   */
  async isBookmarked({ userId, placeId }: { userId: User; placeId: Place }): Promise<{ isBookmarked: boolean }> {
    try {
      const bookmark = await this.bookmarks.findOne({ userId, placeId });
      return { isBookmarked: !!bookmark }; // Convert to boolean
    } catch (e) {
      console.error(e);
      return { isBookmarked: false };
    }
  }
}
