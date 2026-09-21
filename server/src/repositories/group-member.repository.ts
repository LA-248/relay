import {
  GroupDeletionStatus,
  NewGroupMember,
} from '../schemas/group.schema.ts';
import { GroupMemberInfo } from '../types/group.ts';
import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class GroupMember {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  createGroupMemberTable = async (): Promise<void> => {
    await this.db.query(
      `
        CREATE TABLE IF NOT EXISTS group_members (
          group_id INTEGER REFERENCES groups(group_id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(50),
          joined_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          last_read_at TIMESTAMPTZ,
          PRIMARY KEY (group_id, user_id)
        )
      `,
      [],
    );
  };

  insertGroupMember = async (
    groupId: number,
    userId: number,
    role: string,
  ): Promise<NewGroupMember> => {
    const result = await this.db.query<NewGroupMember>(
      `
      INSERT INTO group_members (group_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING group_id, user_id AS "id", role, joined_at
      `,
      [groupId, userId, role],
    );

    return result.rows[0];
  };

  findMembersByRoom = async (
    room: string,
  ): Promise<Pick<GroupMemberInfo, 'id' | 'role'>[]> => {
    const result = await this.db.query<
      Pick<GroupMemberInfo, 'id' | 'role'>
    >(
      `
      SELECT
        gm.user_id AS "id",
        gm.role
      FROM group_members gm
      JOIN groups g ON g.group_id = gm.group_id
      WHERE g.room = $1
      `,
      [room],
    );

    return result.rows;
  };

  findMemberByUserId = async (
    room: string,
    groupId: number,
    userId: number,
  ): Promise<Pick<GroupMemberInfo, 'id' | 'role'>> => {
    const result = await this.db.query<
      Pick<GroupMemberInfo, 'id' | 'role'>
    >(
      `
      SELECT gm.user_id AS "id", gm.role
      FROM group_members gm
      JOIN groups g ON g.group_id = gm.group_id
      WHERE g.room = $1 AND gm.group_id = $2 AND gm.user_id = $3
      `,
      [room, groupId, userId],
    );

    return result.rows[0];
  };

  findRandomMember = async (
    room: string,
    groupId: number,
  ): Promise<Pick<GroupMemberInfo, 'id' | 'role'>> => {
    const result = await this.db.query<
      Pick<GroupMemberInfo, 'id' | 'role'>
    >(
      `
      SELECT gm.user_id AS "id", gm.role
      FROM group_members gm
      JOIN groups g ON g.group_id = gm.group_id
      WHERE g.room = $1 AND g.group_id = $2
      LIMIT 1
      `,
      [room, groupId],
    );

    return result.rows[0];
  };

  findDeletionStatus = async (
    recipientId: number,
  ): Promise<GroupDeletionStatus> => {
    const result = await this.db.query<GroupDeletionStatus>(
      `
      SELECT deleted_at
      FROM group_members
      WHERE user_id = $1  
      RETURNING deleted_at
      `,
      [recipientId],
    );

    return result.rows[0];
  };

  updateRole = async (
    role: string,
    groupId: number,
    userId: number,
  ): Promise<Pick<GroupMemberInfo, 'id' | 'role'>> => {
    const result = await this.db.query<
      Pick<GroupMemberInfo, 'id' | 'role'>
    >(
      `
      UPDATE group_members 
      SET role = $1
      WHERE group_id = $2 AND user_id = $3
      RETURNING user_id AS "id", role
      `,
      [role, groupId, userId],
    );

    return result.rows[0];
  };

  updateLastReadAt = async (
    groupId: number,
    userId: number,
  ): Promise<GroupMemberInfo> => {
    const result = await this.db.query<GroupMemberInfo>(
      `
      UPDATE group_members
      SET last_read_at = NOW()
      WHERE group_id = $1 AND user_id = $2
      RETURNING group_id, user_id AS "id", last_read_at
      `,
      [groupId, userId],
    );

    return result.rows[0];
  };

  deleteGroupForMember = async (
    groupId: number,
    userId: number,
  ): Promise<GroupMemberInfo> => {
    const result = await this.db.query<GroupMemberInfo>(
      `
      UPDATE group_members
      SET deleted_at = NOW()
      WHERE group_id = $1 AND user_id = $2
      RETURNING group_id, user_id AS "id"
      `,
      [groupId, userId],
    );

    return result.rows[0];
  };

  deleteGroupMember = async (
    groupId: number,
    userId: number,
  ): Promise<Pick<GroupMemberInfo, 'id' | 'role'>> => {
    const result = await this.db.query<
      Pick<GroupMemberInfo, 'id' | 'role'>
    >(
      `
      DELETE FROM group_members 
      WHERE group_id = $1 AND user_id = $2
      RETURNING user_id AS "id", role
      `,
      [groupId, userId],
    );

    return result.rows[0];
  };

  restore = async (groupId: number): Promise<void> => {
    await this.db.query(
      `
      UPDATE group_members
      SET deleted_at = NULL
      WHERE group_id = $1 AND deleted_at IS NOT NULL;
      `,
      [groupId],
    );
  };
}
