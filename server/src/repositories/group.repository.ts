import {
  GroupInfo,
  GroupPicture,
  GroupRoom,
  GroupRooms,
  GroupUpdatedAt,
  NewGroupChat,
} from '../schemas/group.schema.ts';
import { GroupMemberInfo } from '../types/group.ts';
import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class Group {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  createGroupsTable = async () => {
    await this.db.query(
      `
        CREATE TABLE IF NOT EXISTS groups (
          group_id SERIAL PRIMARY KEY,
          owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          last_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
          name TEXT,
          group_picture TEXT,
          room UUID UNIQUE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `,
      [],
    );
  };

  insertNewGroupChat = async (
    ownerUserId: number,
    name: string,
    room: string,
  ): Promise<NewGroupChat> => {
    const result = await this.db.query<NewGroupChat>(
      `
        INSERT INTO groups (owner_user_id, name, room)
        VALUES ($1, $2, $3)
        RETURNING group_id, room, name
      `,
      [ownerUserId, name, room],
    );

    return result.rows[0];
  };

  findMembersInfoById = async (groupId: number): Promise<GroupMemberInfo[]> => {
    const result = await this.db.query<GroupMemberInfo>(
      `
      SELECT
        u.id,
        u.username,
        u.profile_picture,
        gm.role
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = $1
      `,
      [groupId],
    );

    return result.rows;
  };

  findGroupInfoByRoom = async (room: string): Promise<GroupInfo> => {
    const result = await this.db.query<GroupInfo>(
      'SELECT group_id, name, group_picture FROM groups WHERE room = $1',
      [room],
    );

    return result.rows[0];
  };

  findRoomById = async (groupId: number): Promise<GroupRoom> => {
    const result = await this.db.query<GroupRoom>(
      'SELECT room FROM groups WHERE group_id = $1',
      [groupId],
    );

    return result.rows[0];
  };

  findPictureById = async (groupId: number): Promise<GroupPicture> => {
    const result = await this.db.query(
      'SELECT group_picture FROM groups WHERE group_id = $1',
      [groupId],
    );

    return { group_picture: result.rows[0]?.group_picture ?? null };
  };

  findUpdatedAtDate = async (room: string): Promise<GroupUpdatedAt> => {
    const result = await this.db.query<GroupUpdatedAt>(
      'SELECT updated_at FROM groups WHERE room = $1',
      [room],
    );

    return result.rows[0];
  };

  findAllGroupsByUser = async (userId: number): Promise<GroupRooms> => {
    const result = await this.db.query<GroupRoom>(
      `
      SELECT g.room
      FROM groups g
      JOIN group_members gm ON g.group_id = gm.group_id
      WHERE gm.user_id = $1
      `,
      [userId],
    );

    return result.rows;
  };

  updatePicture = async (fileName: string, groupId: number) => {
    const result = await this.db.query(
      `
      UPDATE groups
      SET group_picture = $1
      WHERE group_id = $2
      RETURNING group_id AS "groupId", name
      `,
      [fileName, groupId],
    );

    return result.rows[0] ?? null;
  };

  setLastMessage = async (
    messageId: number,
    room: string,
  ): Promise<GroupUpdatedAt> => {
    const result = await this.db.query<GroupUpdatedAt>(
      `
      UPDATE groups
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

  updateLastMessageEventTime = async (
    messageId: number | null,
    room: string,
  ): Promise<void> => {
    await this.db.query(
      `
      UPDATE groups
      SET
        last_message_id = $1,
        updated_at = m.event_time
      FROM messages m
      WHERE groups.room = $2
        AND m.id = $1
        AND m.room = $2
      `,
      [messageId, room],
    );
  };

  updateOwner = async (
    userId: number,
    groupId: number,
    room: string,
  ): Promise<void> => {
    await this.db.query(
      `
      UPDATE groups
      SET owner_user_id = $1
      WHERE group_id = $2 AND room = $3
      `,
      [userId, groupId, room],
    );
  };

  deleteById = async (groupId: number): Promise<void> => {
    await this.db.query('DELETE FROM groups WHERE group_id = $1', [groupId]);
  };
}
