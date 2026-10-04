import { InsertedChatParticipant } from '../types/chat-participant.ts';
import { GroupMemberRole } from '../types/group.ts';
import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class ChatParticipants {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  createChatParticipantsTable = async (): Promise<void> => {
    await this.db.query(
      `
        CREATE TABLE IF NOT EXISTS chat_participants (
          chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT CONSTRAINT group_member_role CHECK (role IN ('owner', 'admin', 'member' )),
          last_read_at TIMESTAMPTZ,
          deleted_at TIMESTAMPTZ,
          joined_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (chat_id, user_id),
        )
      `,
      [],
    );
  };

  insertChatParticipant = async (
    chatId: number,
    userId: number,
    role: GroupMemberRole | null,
  ): Promise<InsertedChatParticipant> => {
    const result = await this.db.query<InsertedChatParticipant>(
      `
        INSERT INTO chat_participants (chat_id, user_id, role) 
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [chatId, userId, role],
    );

    return result.rows[0];
  };
}
