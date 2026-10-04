import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '../.env.test' : '../.env',
});

import pg from 'pg';

import { GroupMember as GroupMemberRepository } from '../repositories/group-member.repository.ts';
import { Group } from '../repositories/group.repository.ts';
import { Message } from '../repositories/message.repository.ts';
import { PrivateChat } from '../repositories/private-chat.repository.ts';
import { Session } from '../repositories/session.repository.ts';
import { User } from '../repositories/user.repository.ts';
const { Pool } = pg;

// Initialise a connection pool
export const pool = new Pool({
  user: process.env.USERNAME,
  host: process.env.HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
});

export async function createTables(): Promise<void> {
  try {
    const userRepository = new User();
    await userRepository.createUsersTable();

    const privateChatRepository = new PrivateChat();
    await privateChatRepository.createPrivateChatsTable();

    const groupRepository = new Group();
    await groupRepository.createGroupsTable();

    const groupMemberRepository = new GroupMemberRepository();
    await groupMemberRepository.createGroupMemberTable();

    const messageRepository = new Message();
    await messageRepository.createMessagesTable();

    const sessionRepository = new Session();
    await sessionRepository.createSessionsTable();
  } catch (error) {
    console.error('Error creating table:', error);
  }
}
