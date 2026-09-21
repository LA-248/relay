import {
  LastMessageInfo,
  Message as MessageType,
  NewMessage,
} from '../schemas/message.schema.ts';
import { MessageSenderId } from '../types/message.ts';
import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class Message {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  createMessagesTable = async (): Promise<void> => {
    await this.db.query(
      `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(group_id) ON DELETE CASCADE,
        client_offset TEXT UNIQUE,
        room UUID NOT NULL,
        content TEXT DEFAULT NULL,
        event_time TIMESTAMPTZ DEFAULT NOW(),
        is_edited BOOLEAN DEFAULT FALSE,
        type TEXT NOT NULL,
        CHECK ((group_id IS NULL) <> (recipient_id IS NULL))
      )
      `,
      [],
    );
  };

  insertNewMessage = async (
    content: string,
    senderId: number,
    recipientId: number | null,
    groupId: number | null,
    room: string,
    type: string,
    clientOffset: string,
  ): Promise<NewMessage> => {
    const result = await this.db.query<NewMessage>(
      `
      INSERT INTO messages (
        content,
        sender_id,
        recipient_id,
        group_id,
        room,
        type,
        client_offset
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, event_time, type
      `,
      [content, senderId, recipientId, groupId, room, type, clientOffset],
    );

    return result.rows[0];
  };

  findMessageContent = async (senderId: number, messageId: number) => {
    const result = await this.db.query(
      `
      SELECT
        content
      FROM messages
      WHERE sender_id = $1 AND id = $2
      `,
      [senderId, messageId],
    );

    return result.rows[0];
  };

  findMessageSenderId = async (messageId: number) => {
    const result = await this.db.query<MessageSenderId>(
      `
      SELECT
        sender_id AS "messageSenderId"
      FROM messages
      WHERE id = $1
      `,
      [messageId],
    );

    return result.rows[0];
  };

  findMessageType = async (messageId: number): Promise<string> => {
    const result = await this.db.query(
      'SELECT type FROM messages WHERE id = $1',
      [messageId],
    );

    return result.rows[0].type;
  };

  findMessageList = async (
    serverOffset: string,
    room: string,
  ): Promise<MessageType[]> => {
    const result = await this.db.query<MessageType>(
      `
      SELECT
        m.id,
        m.sender_id,
        m.recipient_id,
        m.group_id,
        m.content,
        m.event_time,
        m.is_edited,
        m.type,
        u.username as sender_username
      FROM messages m
      JOIN users u
      ON m.sender_id = u.id
      WHERE m.id > $1
        AND m.room = $2
      ORDER BY m.event_time ASC;
      `,
      [serverOffset, room],
    );

    return result.rows;
  };

  findLastMessageInfo = async (
    room: string,
  ): Promise<LastMessageInfo | null> => {
    const result = await this.db.query<LastMessageInfo>(
      `
      SELECT
        content,
        event_time,
        type
      FROM messages
      WHERE room = $1
      ORDER BY id DESC LIMIT 1 
      `,
      [room],
    );

    return result.rows[0];
  };

  updateMessageContent = async (
    newMessage: string,
    senderId: number,
    messageId: number,
  ): Promise<void> => {
    await this.db.query(
      `
      UPDATE messages
      SET
        content = $1,
        is_edited = true
      WHERE sender_id = $2 AND id = $3
      `,
      [newMessage, senderId, messageId],
    );
  };

  deleteMessage = async (
    senderId: number,
    messageId: number,
  ): Promise<void> => {
    await this.db.query(
      'DELETE FROM messages WHERE sender_id = $1 AND id = $2',
      [senderId, messageId],
    );
  };
}
