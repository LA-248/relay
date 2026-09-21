import { z } from 'zod/v4';
import {
  GroupMemberInfoSchema,
  NewGroupMember,
} from '../schemas/group.schema.ts';

export type GroupInfo = {
  group_id: number;
  name: string;
  group_picture: string | null;
}

export type GroupMember = {
  id: number;
  username: string;
  role: string;
  profile_picture?: string | null;
}

export type GroupMemberToBeAdded = {
  username: string;
  userId: number;
  role: string;
  profilePicture?: string | null;
}

export type AddedUserInfo = {
  id: number;
  username: string;
  profile_picture: string | null;
}

export type GroupInfoWithMembers = {
  info: {
    chatId: number;
    name: string;
    groupPicture: string | null;
  };
  members: GroupMember[];
}

export type GroupMemberInsertionResult = {
  status: 'fulfilled' | 'rejected';
  value?: NewGroupMember;
  reason?: Error | string;
}

export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export type GroupMemberInfo = z.infer<typeof GroupMemberInfoSchema>;
