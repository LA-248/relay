export type GroupMember = {
  id: number;
  username: string;
  role: GroupMemberRole;
  profile_picture?: string | null;
}

export type GroupMemberToBeAdded = {
  username: string;
  userId: number;
  role: GroupMemberRole;
  profilePicture?: string | null;
}

export type GroupInfoWithMembers = {
  info: {
    chatId: number;
    name: string;
    groupPicture: string | null;
  };
  members: GroupMember[];
}

export type RemovedGroupChat = {
  room: string;
  redirectPath: string;
}

export type GroupMemberToRemove = {
  username: string;
  userId: number;
  role: GroupMemberRole;
}

export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}
