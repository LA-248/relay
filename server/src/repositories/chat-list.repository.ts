import { ChatDto } from '../types/chat.ts';
import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class ChatList {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  findAllChatsByUser = async (userId: number): Promise<ChatDto[]> => {
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
        'chats' AS chat_type,
        pc.created_at,
        pc.updated_at,
        CASE
          WHEN pc.user1_id = $1 THEN pc.user1_deleted_at
          WHEN pc.user2_id = $1 THEN pc.user2_deleted_at
        END AS deleted_at,
        CASE
          WHEN pc.user1_id = $1 THEN pc.user1_last_read_at
          WHEN pc.user2_id = $1 THEN pc.user2_last_read_at
        END AS last_read_at
      FROM private_chats pc
      JOIN users u ON u.id = CASE
        WHEN pc.user1_id = $1 THEN pc.user2_id
        ELSE pc.user1_id
      END
      LEFT JOIN messages m ON pc.last_message_id = m.id
      WHERE (pc.user1_id = $1 OR pc.user2_id = $1)

      UNION ALL

      SELECT
        CONCAT('g_', g.group_id) AS chat_id,
        NULL as recipient_user_id,
        g.name AS name,
        g.group_picture AS chat_picture,
        g.last_message_id,
        m.content AS last_message_content,
        m.event_time AS last_message_time,
        m.type AS last_message_type,
        g.room,
        'group' AS chat_type,
        g.created_at,
        g.updated_at,
        gm.deleted_at,
        gm.last_read_at
      FROM groups g
      JOIN group_members gm ON g.group_id = gm.group_id
      LEFT JOIN messages m ON g.last_message_id = m.id
      WHERE gm.user_id = $1

      ORDER BY updated_at DESC
      `,
      [userId],
    );

    return result.rows;
  };
}
