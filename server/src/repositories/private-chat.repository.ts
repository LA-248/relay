import {
  ChatDeletionStatus,
  ChatLastMessage,
  ChatMembers,
  ChatUpdatedAt,
  NewChat,
} from '../schemas/private-chat.schema.ts';
import { ChatDto, ChatRoom } from '../types/chat.ts';
import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class PrivateChat {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  createPrivateChatsTable = async (): Promise<void> => {
    await this.db.query(
      `
        CREATE TABLE IF NOT EXISTS private_chats (
          chat_id SERIAL PRIMARY KEY,
          user1_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          user2_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          last_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
          room UUID UNIQUE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          user1_deleted_at TIMESTAMPTZ,
          user2_deleted_at TIMESTAMPTZ,
          user1_last_read_at TIMESTAMPTZ,
          user2_last_read_at TIMESTAMPTZ,
          UNIQUE (user1_id, user2_id)
        )
      `,
      [],
    );
  };

  insertNewChat = async (
    user1Id: number,
    user2Id: number,
    room: string,
  ): Promise<NewChat> => {
    const result = await this.db.query<NewChat>(
      `
        INSERT INTO private_chats (user1_id, user2_id, room)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [user1Id, user2Id, room],
    );

    return result.rows[0];
  };

  findChat = async (userId: number, room: string): Promise<ChatDto> => {
    const result = await this.db.query<ChatDto>(
      `
      SELECT
        CONCAT('p_', pc.chat_id) AS chat_id,
        CASE
          WHEN pc.user1_id = $1 THEN pc.user2_id
          ELSE pc.user1_id
        END AS recipient_user_id,
        u.username AS name,
        u.profile_picture AS chat_picture,
        pc.last_message_id,
        m.content AS last_message_content,
        m.event_time AS last_message_time,
        m.type AS last_message_type,
        pc.room,
        CASE
          WHEN pc.user1_id = $1 THEN pc.user1_last_read_at
          WHEN pc.user2_id = $1 THEN pc.user2_last_read_at
        END AS last_read_at,
        'chats' AS chat_type,
        pc.created_at,
        pc.updated_at,
        CASE
          WHEN pc.user1_id = $1 THEN pc.user1_deleted_at
          WHEN pc.user2_id = $1 THEN pc.user2_deleted_at
        END AS deleted_at
      FROM private_chats pc
      JOIN users u ON u.id = CASE
        WHEN pc.user1_id = $1 THEN pc.user2_id
        ELSE pc.user1_id
      END
      LEFT JOIN messages m ON pc.last_message_id = m.id
      WHERE (pc.user1_id = $1 OR pc.user2_id = $1) AND pc.room = $2
      `,
      [userId, room],
    );

    return result.rows[0];
  };

  findMembersByRoom = async (room: string): Promise<ChatMembers> => {
    const result = await this.db.query<ChatMembers>(
      'SELECT user1_id, user2_id FROM private_chats WHERE room = $1',
      [room],
    );

    return result.rows[0];
  };

  findRoomByMembers = async (
    user1Id: number,
    user2Id: number,
  ): Promise<ChatRoom> => {
    const result = await this.db.query<ChatRoom>(
      `
      SELECT room FROM private_chats 
      WHERE (user1_id = $1 AND user2_id = $2)
      OR (user1_id = $2 AND user2_id = $1)
      `,
      [user1Id, user2Id],
    );

    return { room: result.rows[0]?.room ?? null };
  };

  // Finds all rooms a user belongs to
  findAllRoomsByUser = async (userId: number): Promise<ChatRoom[]> => {
    const result = await this.db.query<ChatRoom>(
      `
      SELECT room FROM private_chats 
      WHERE (user1_id = $1 OR user2_id = $1)
      `,
      [userId],
    );

    return result.rows;
  };

  findChatDeletionStatus = async (
    userId: number,
    room: string,
  ): Promise<ChatDeletionStatus | null> => {
    const result = await this.db.query<ChatDeletionStatus>(
      `
      SELECT
        CASE
          WHEN user1_id = $1 THEN user1_deleted_at
          ELSE user2_deleted_at
        END AS deleted_at
      FROM private_chats
      WHERE room = $2
      `,
      [userId, room],
    );

    return result.rows[0] ?? null;
  };

  findUpdatedAtDate = async (room: string): Promise<ChatUpdatedAt> => {
    const result = await this.db.query<ChatUpdatedAt>(
      'SELECT updated_at FROM private_chats WHERE room = $1',
      [room],
    );

    return result.rows[0];
  };

  findLastMessageId = async (room: string): Promise<ChatLastMessage> => {
    const result = await this.db.query<ChatLastMessage>(
      'SELECT last_message_id FROM private_chats WHERE room = $1',
      [room],
    );

    return result.rows[0];
  };

  setLastMessage = async (
    messageId: number,
    room: string,
  ): Promise<ChatUpdatedAt> => {
    const result = await this.db.query<ChatUpdatedAt>(
      `
      UPDATE private_chats
      SET
        last_message_id = $1,
        updated_at = NOW()
      WHERE room = $2
      RETURNING updated_at
      `,
      [messageId, room],
    );

    return result.rows[0];
  };

  // Handle updating last message after most recent message is deleted
  updateLastMessage = async (
    messageId: number | null,
    room: string,
  ): Promise<void> => {
    // When the last remaining message in a chat is deleted, the last_message_id is set to null,
    // otherwise set it to the message id of the new last message
    if (messageId === null) {
      await this.db.query(
        `
        UPDATE private_chats
        SET 
          last_message_id = NULL,
          updated_at = NOW()
        WHERE room = $1
        `,
        [room],
      );
    } else {
      await this.db.query(
        `
        UPDATE private_chats
        SET
          last_message_id = $1,
          updated_at = m.event_time
        FROM messages m
        WHERE private_chats.room = $2
          AND m.id = $1
          AND m.room = $2
        `,
        [messageId, room],
      );
    }
  };

  updateDeletedAt = async (
    userId: number,
    room: string,
  ): Promise<ChatDeletionStatus> => {
    const result = await this.db.query<ChatDeletionStatus>(
      `
      UPDATE private_chats
      SET
        user1_deleted_at = CASE WHEN user1_id = $1 THEN NOW() ELSE user1_deleted_at END,
        user2_deleted_at = CASE WHEN user2_id = $1 THEN NOW() ELSE user2_deleted_at END
      WHERE room = $2
      RETURNING
        CASE
          WHEN user1_id = $1 THEN user1_deleted_at
          WHEN user2_id = $1 THEN user2_deleted_at
        END AS deleted_at
      `,
      [userId, room],
    );

    return result.rows[0];
  };

  updateLastReadAt = async (
    userId: number,
    room: string,
  ): Promise<Date> => {
    const result = await this.db.query(
      `
      UPDATE private_chats
      SET
        user1_last_read_at = CASE WHEN user1_id = $1 THEN NOW() ELSE user1_last_read_at END,
        user2_last_read_at = CASE WHEN user2_id = $1 THEN NOW() ELSE user2_last_read_at END
      WHERE room = $2
      RETURNING
        CASE
        WHEN user1_id = $1 THEN user1_last_read_at
          WHEN user2_id = $1 THEN user2_last_read_at
        END AS last_read_at
      `,
      [userId, room],
    );

    return result.rows[0].last_read_at;
  };

  restoreChat = async (userId: number, room: string): Promise<Date> => {
    const result = await this.db.query(
      `
    UPDATE private_chats
    SET
      user1_deleted_at = CASE WHEN user1_id = $1 THEN NULL ELSE user1_deleted_at END,
      user2_deleted_at = CASE WHEN user2_id = $1 THEN NULL ELSE user2_deleted_at END
    WHERE room = $2 AND ($1 = user1_id OR $1 = user2_id)
    RETURNING
      CASE
        WHEN user1_id = $1 THEN user1_deleted_at
        WHEN user2_id = $1 THEN user2_deleted_at
      END AS deleted_at
    `,
      [userId, room],
    );

    return result.rows[0].deleted_at;
  };
}
