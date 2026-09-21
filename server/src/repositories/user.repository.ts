import {
  RecipientUserProfile,
  UserBlockList,
  UserEntity,
  UserId,
  UserProfile,
  UserProfilePicture,
} from '../schemas/user.schema.ts';
import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class User {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  createUsersTable = async (): Promise<void> => {
    await this.db.query(
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(30) NOT NULL UNIQUE,
        hashed_password TEXT NOT NULL,
        profile_picture TEXT DEFAULT NULL,
        blocked_users INTEGER[] DEFAULT '{}'
      )`,
      [],
    );
  };

  insertUser = async (
    username: string,
    hashedPassword: string,
  ): Promise<UserProfile> => {
    const result = await this.db.query<UserProfile>(
      `
        INSERT INTO users (username, hashed_password)
        VALUES ($1, $2)
        RETURNING id, username, profile_picture
      `,
      [username, hashedPassword],
    );

    return result.rows[0];
  };

  findUserById = async (userId: number): Promise<UserProfile> => {
    const result = await this.db.query<UserProfile>(
      'SELECT id, username, profile_picture FROM users WHERE id = $1',
      [userId],
    );

    return result.rows[0];
  };

  findUserByUsername = async (username: string): Promise<UserEntity> => {
    const result = await this.db.query<UserEntity>(
      'SELECT * FROM users WHERE username = $1',
      [username],
    );

    return result.rows[0];
  };

  findRecipientUserProfileById = async (
    userId: number,
    room: string,
  ): Promise<RecipientUserProfile> => {
    const result = await query<RecipientUserProfile>(
      `
        SELECT
          u.id,
          u.username,
          u.profile_picture,
          u.blocked_users
        FROM users u
        JOIN private_chats pc ON u.id = CASE
          WHEN pc.user1_id = $1 THEN pc.user2_id
          ELSE pc.user1_id
        END
        WHERE pc.room = $2
        `,
      [userId, room],
    );

    return result.rows[0];
  };

  findUserIdByUsername = async (username: string): Promise<UserId> => {
    const result = await query<UserId>(
      'SELECT id FROM users WHERE username = $1',
      [username],
    );

    return result.rows[0];
  };

  findUserProfilePictureById = async (
    userId: number,
  ): Promise<UserProfilePicture> => {
    const result = await query<UserProfilePicture>(
      'SELECT profile_picture FROM users WHERE id = $1',
      [userId],
    );

    return result.rows[0];
  };

  findBlockListById = async (userId: number): Promise<UserBlockList> => {
    const result = await query<UserBlockList>(
      'SELECT blocked_users FROM users WHERE id = $1',
      [userId],
    );

    return result.rows[0];
  };

  updateUsernameById = async (
    username: string,
    userId: number,
  ): Promise<void> => {
    await this.db.query<UserBlockList>(
      'UPDATE users SET username = $1 WHERE id = $2',
      [username, userId],
    );
  };

  updateProfilePictureById = async (
    fileName: string,
    userId: number,
  ): Promise<void> => {
    await this.db.query<UserBlockList>(
      'UPDATE users SET profile_picture = $1 WHERE id = $2',
      [fileName, userId],
    );
  };

  updateBlockedUsersById = async (
    blockedUsers: number[],
    userId: number,
  ): Promise<void> => {
    await this.db.query<UserBlockList>(
      'UPDATE users SET blocked_users = $1 WHERE id = $2',
      [blockedUsers, userId],
    );
  };
}
