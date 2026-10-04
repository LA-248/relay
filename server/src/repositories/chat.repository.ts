import { InsertedGroupChat, InsertedPrivateChat } from '../types/chat.ts';
import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class Chats {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  createChatsTable = async (): Promise<void> => {
    await this.db.query(
      `
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL CONSTRAINT chats_type_check CHECK (type IN ('group', 'private')),
        room UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_message_at TIMESTAMPTZ NOT NULL,
        last_message_id INTEGER REFERENCES messages(message_id),
        name TEXT,
        picture TEXT
      )
      `,
      [],
    );
  };

  insertPrivateChat = async (room: string): Promise<InsertedPrivateChat> => {
    const result = await this.db.query<InsertedPrivateChat>(
      `
        INSERT INTO chats (type, room)
        VALUES ('private', $1)
        RETURNING id, type, room, created_at, updated_at, last_message_at, last_message_id
      `,
      [room],
    );

    return result.rows[0];
  };

  insertGroupChat = async (
    room: string,
    name: string,
    picture: string | null,
  ): Promise<InsertedGroupChat> => {
    const result = await this.db.query<InsertedGroupChat>(
      `
        INSERT INTO chats (type, room, name, picture)
        VALUES ('group', $2, $3, $4)
        RETURNING *
      `,
      [room, name, picture],
    );

    return result.rows[0];
  };
}
