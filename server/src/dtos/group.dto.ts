import { z } from 'zod/v4';
import { UpdateGroupMemberRoleSchema } from '../schemas/group-member.schema.ts';
import {
  AddGroupMembersSchema,
  CreateGroupChatSchema,
} from '../schemas/group.schema.ts';
import {
  AddedUserInfo,
  GroupMember,
  GroupMemberInsertionResult,
} from '../types/group.ts';

export type CreateGroupChatInputDto = z.infer<typeof CreateGroupChatSchema>;
export type CreateGroupChatResponseDto = {
  group_id: number;
  room: string;
  name: string;
};

export type CreateGroupChatPartialSuccessResponseDto = {
  message: string;
  failedMembers: GroupMemberInsertionResult[];
};

export type CreateGroupChatBadRequestResponseDto = {
  error: string;
};

export type RetrieveGroupInfoResponseDto = {
  info: {
    chatId: number;
    name: string;
    groupPicture: string | null;
  };
  members: GroupMember[];
};

export type RetrieveGroupMemberUsernamesResponseDto = {
  memberUsernames: string[];
};

export type AddMembersInputDto = z.infer<typeof AddGroupMembersSchema>;
export type AddMembersResponseDto = {
  message: string;
  addedMembers: AddedUserInfo[];
};

export type UpdateGroupMemberInputDto = z.infer<
  typeof UpdateGroupMemberRoleSchema
>;

export type LeaveGroupResponseDto = {
  message: string;
};

export type RemoveKickedGroupMemberResponseDto = {
  kickedMemberUserId: number;
  message: string;
};

export type UpdateGroupMemberRoleResponseDto = {
  message: string;
  id: number;
  role: string;
};

export type PermanentlyDeleteGroupResponseDto = {
  message: string;
};

export type UpdateGroupPictureDto = {
  fileUrl: string;
  groupId: number;
  name: string;
};

export type UpdateLastMessageIdInputDto = {
  messageId: number | null;
};
export type UpdateLastMessageIdResponseDto = {
  success: string;
};
