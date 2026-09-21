import { Server } from 'socket.io';
import { UpdateGroupPictureDto } from '../dtos/group.dto.ts';
import { GroupMember as GroupMemberRepository } from '../repositories/group-member.repository.ts';
import { Group } from '../repositories/group.repository.ts';
import {
  GroupInfo,
  NewGroupChat,
  NewGroupMember,
} from '../schemas/group.schema.ts';
import {
  S3AttachmentsStoragePath,
  S3AvatarStoragePath,
} from '../types/chat.ts';
import {
  AddedUserInfo,
  GroupInfoWithMembers,
  GroupMember,
  GroupMemberInfo,
  GroupMemberInsertionResult,
  GroupMemberRole,
  GroupMemberToBeAdded,
} from '../types/group.ts';
import createGroupPictureUrl from '../utils/create-group-picture-url.ts';
import {
  createPresignedUrl,
  deleteS3Directory,
  deleteS3Object,
} from './s3.service.ts';
import { retrieveUserById } from './user.service.ts';
import { userSockets } from '../socket/index.ts';

// TODO: Rename this function, it's confusing
export const retrieveGroupInfoWithMembers = async (
  room: string,
): Promise<GroupInfoWithMembers> => {
  const groupRepository = new Group();
  const groupInfo = await groupRepository.findGroupInfoByRoom(room);
  const groupMembersInfo = await retrieveGroupMembersInfo(groupInfo.group_id);

  const groupPictureUrl = groupInfo.group_picture
    ? await createGroupPictureUrl(groupInfo.group_id, groupInfo.group_picture)
    : null;

  return {
    info: {
      chatId: groupInfo.group_id,
      name: groupInfo.name,
      groupPicture: groupPictureUrl?.group_picture ?? null,
    },
    members: groupMembersInfo,
  };
};

export const retrieveGroupMembersInfo = async (
  groupId: number,
): Promise<GroupMember[]> => {
  const groupRepository = new Group();
  const groupMembersInfo = await groupRepository.findMembersInfoById(groupId);

  // Create a presigned S3 url for each group member's profile picture
  for (let i = 0; i < groupMembersInfo.length; i++) {
    const groupMember = groupMembersInfo[i];
    if (groupMember.profile_picture) {
      groupMember.profile_picture = await createPresignedUrl(
        process.env.BUCKET_NAME!,
        `${S3AvatarStoragePath.USER_AVATARS}/${groupMember.id}/${groupMember.profile_picture}`,
      );
    }
  }

  return groupMembersInfo;
};

export const getMemberUsernames = async (
  groupId: number,
): Promise<string[]> => {
  const groupRepository = new Group();

  const groupMembersInfo = await groupRepository.findMembersInfoById(groupId);
  return groupMembersInfo.map((member: GroupMember) => member.username);
};

export const findGroupMembersByRoom = async (room: string): Promise<number[]> => {
  try {
    const groupMemberRepository = new GroupMemberRepository();
    const members = await groupMemberRepository.findMembersByRoom(room);
    return members ? members.map((member) => member.id) : [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Unable to retrieve group chat members: ${error.message}`,
      );
    }
    throw new Error('An unexpected error occurred');
  }
}

export const createNewGroup = async (
  io: Server,
  ownerUserId: number,
  groupName: string,
  room: string,
  addedMembers: GroupMemberToBeAdded[],
): Promise<{
  newGroupChat: NewGroupChat;
  failedInsertions: GroupMemberInsertionResult[];
}> => {
  const groupRepository = new Group();
  const groupMemberRepository = new GroupMemberRepository();

  const newGroupChat: NewGroupChat = await groupRepository.insertNewGroupChat(
    ownerUserId,
    groupName,
    room,
  );

  // Add members to the group chat concurrently
  const insertGroupMembers = addedMembers.map((user) =>
    groupMemberRepository.insertGroupMember(
      newGroupChat.group_id,
      user.userId,
      user.role,
    ),
  );
  const insertedGroupMembers: GroupMemberInsertionResult[] =
    await Promise.allSettled(insertGroupMembers);

  // Log failed insertions
  const failedInsertions: GroupMemberInsertionResult[] = [];
  for (let i = 0; i < insertedGroupMembers.length; i++) {
    if (insertedGroupMembers[i].status === 'rejected') {
      console.error(`Failed to add user ${insertedGroupMembers[i].reason}`);
      failedInsertions.push(insertedGroupMembers[i]);
    }
  }

  broadcastGroupCreation(io, insertedGroupMembers, newGroupChat);

  return { newGroupChat, failedInsertions };
};

export const addUsersToGroup = async (
  io: Server,
  room: string,
  addedMembers: GroupMemberToBeAdded[],
): Promise<AddedUserInfo[]> => {
  const groupRepository = new Group();
  const groupMemberRepository = new GroupMemberRepository();

  const groupInfo = await groupRepository.findGroupInfoByRoom(room);

  // Add members to the group chat
  const insertGroupMembers = addedMembers.map((user) =>
    groupMemberRepository.insertGroupMember(
      groupInfo.group_id,
      user.userId,
      user.role,
    ),
  );
  const insertedGroupMembers = await Promise.all(insertGroupMembers);

  return await notifyAddedUsers(io, insertedGroupMembers, groupInfo, room);
};

// Handles removing a member that voluntarily left a group
export const removeMemberWhoLeft = async (
  io: Server,
  groupId: number,
  userId: number,
): Promise<{
  room: string;
  removedUser: Pick<GroupMemberInfo, 'id' | 'role'>;
  newGroupOwner: Pick<GroupMemberInfo, 'id' | 'role'>;
}> => {
  const groupRepository = new Group();
  const groupMemberRepository = new GroupMemberRepository();

  const socketId = userSockets.get(userId);
  let newGroupOwner: Pick<GroupMemberInfo, 'id' | 'role'> = {
    id: 0,
    role: 'member',
  };

  const [{ room }, removedUser] = await Promise.all([
    groupRepository.findRoomById(groupId),
    groupMemberRepository.deleteGroupMember(groupId, userId),
  ]);

  // If the user who left the group was the owner, randomly assign another member as the new owner
  if (removedUser.role === GroupMemberRole.OWNER) {
    const groupMemberInfo = await groupMemberRepository.findRandomMember(
      room,
      groupId,
    );
    const groupMemberUserId = groupMemberInfo.id;

    newGroupOwner = await groupMemberRepository.updateRole(
      GroupMemberRole.OWNER,
      groupId,
      groupMemberUserId,
    );
    await groupRepository.updateOwner(newGroupOwner.id, groupId, room);
  }

  if (socketId) {
    // Remove socket of removed member from the room
    const memberSocket = io.sockets.sockets.get(socketId);
    memberSocket?.leave(room);
  }

  return { room, removedUser, newGroupOwner };
};

export const kickMember = async (
  io: Server,
  groupId: number,
  targetUserId: number,
  loggedInUserId: number,
): Promise<{
  room: string;
  removedUser: Pick<GroupMemberInfo, 'id' | 'role'>;
}> => {
  const groupRepository = new Group();
  const groupMemberRepository = new GroupMemberRepository();
  const socketId = userSockets.get(targetUserId);

  const { room } = await groupRepository.findRoomById(groupId);

  const [kicker, memberToRemove] = await Promise.all([
    groupMemberRepository.findMemberByUserId(room, groupId, loggedInUserId),
    groupMemberRepository.findMemberByUserId(room, groupId, targetUserId),
  ]);

  // Make sure the member performing the kick can only do so to those with a lower role than theirs
  if (
    memberToRemove.role === kicker.role ||
    memberToRemove.role === GroupMemberRole.OWNER
  ) {
    throw new Error('You may not kick this member');
  }

  const removedUser = await groupMemberRepository.deleteGroupMember(
    groupId,
    targetUserId,
  );

  // Remove socket of removed member from the room
  if (socketId) {
    const memberSocket = io.sockets.sockets.get(socketId);
    memberSocket?.leave(room);
  }

  return { room, removedUser };
};

export const updateMemberRole = async (
  newRole: string,
  groupId: number,
  userId: number,
): Promise<{
  room: string;
  updatedMember: Pick<GroupMemberInfo, 'id' | 'role'>;
}> => {
  const groupRepository = new Group();
  const groupMemberRepository = new GroupMemberRepository();

  const [{ room }, updatedMember] = await Promise.all([
    groupRepository.findRoomById(groupId),
    groupMemberRepository.updateRole(newRole, groupId, userId),
  ]);

  return { room, updatedMember };
};

export const permanentlyDeleteGroupChat = async (
  groupId: number,
): Promise<{ room: string; memberSocketIds: string[] }> => {
  const groupRepository = new Group();

  const [membersInfo, { room }, groupAvatar] = await Promise.all([
    groupRepository.findMembersInfoById(groupId),
    groupRepository.findRoomById(groupId),
    groupRepository.findPictureById(groupId),
  ]);

  const memberUserIds = membersInfo.map((member) => member.id);
  const memberSocketIds = [];

  const avatarObjectKey = `${S3AvatarStoragePath.GROUP_AVATARS}/${groupId}/${groupAvatar}`;
  const directoryPrefix = `${S3AttachmentsStoragePath.CHAT_ATTACHMENTS}/group/${groupId}`;

  // Get the socket IDs of each group member
  for (let i = 0; i < memberUserIds.length; i++) {
    const memberUserId = memberUserIds[i];
    const socketId = userSockets.get(memberUserId);
    if (socketId) {
      memberSocketIds.push(socketId);
    }
  }

  if (groupAvatar) {
    await deleteS3Object(process.env.BUCKET_NAME!, avatarObjectKey);
  }
  await deleteS3Directory(process.env.BUCKET_NAME!, directoryPrefix);
  await groupRepository.deleteById(groupId);

  return { room, memberSocketIds };
};

// TODO: Use database transactions
export const uploadGroupPicture = async (
  id: number, // groupId sent as part of the request
  file: Express.MulterS3.File,
  io: Server,
): Promise<UpdateGroupPictureDto> => {
  const groupRepository = new Group();

  const [fileName, { room }] = await Promise.all([
    groupRepository.findPictureById(id),
    groupRepository.findRoomById(id),
  ]);

  // Delete previous picture from S3 storage
  if (!(fileName === null)) {
    // Only run if a picture exists
    await deleteS3Object(
      process.env.BUCKET_NAME!,
      `${S3AvatarStoragePath.GROUP_AVATARS}/${id}/${fileName}`,
    );
  }

  const [fileUrl, updatedGroup] = await Promise.all([
    createPresignedUrl(process.env.BUCKET_NAME!, file.key),
    groupRepository.updatePicture(file.originalname, id),
  ]);

  if (!updatedGroup) {
    throw new Error(`Group ${id} not found`);
  }

  const { groupId, name } = updatedGroup;

  await emitGroupPictureUpdate(io, room, fileUrl);

  return { fileUrl, groupId, name };
};

export const updateGroupMemberLastReadAt = async (
  groupId: number,
  userId: number,
): Promise<Pick<GroupMemberInfo, 'group_id' | 'id' | 'last_read_at'>> => {
  const groupMemberRepository = new GroupMemberRepository();
  return await groupMemberRepository.updateLastReadAt(groupId, userId);
};

// Update the last message in a group chat, used when the most recent message is deleted
export const updateLastGroupMessage = async (
  newLastMessageId: number | null,
  room: string,
): Promise<void | null> => {
  const groupRepository = new Group();
  return await groupRepository.updateLastMessageEventTime(
    newLastMessageId,
    room,
  );
};

export const setLastGroupMessage = async (
  newMessageId: number,
  room: string,
): Promise<Date> => {
  const groupRepository = new Group();
  const result = await groupRepository.setLastMessage(newMessageId, room);
  return result.updated_at;
}

export const deleteGroupForMember = async (
  groupId: number,
  userId: number,
): Promise<GroupMemberInfo> => {
  const groupMemberRepository = new GroupMemberRepository();
  return await groupMemberRepository.deleteGroupForMember(groupId, userId);
};

// Restore group chat for all members
export const restore = async (
  groupId: number,
): Promise<void> => {
  const groupMemberRepository = new GroupMemberRepository();
  return await groupMemberRepository.restore(groupId);
}

// Update the picture of a group for all its members in real-time
const emitGroupPictureUpdate = async (
  io: Server,
  room: string,
  groupPicture: string,
) => {
  io.to(room).emit('update-group-picture', {
    groupPicture,
    room,
  });
};

// Retrieve the info of each added user and notify them that they were added
const notifyAddedUsers = async (
  io: Server,
  insertedGroupMembers: NewGroupMember[],
  groupData: GroupInfo | NewGroupChat,
  room: string,
): Promise<AddedUserInfo[]> => {
  const groupPictureUrl =
    'group_picture' in groupData && groupData.group_picture
      ? await createGroupPictureUrl(groupData.group_id, groupData.group_picture)
      : null;
  const addedUsersInfo: AddedUserInfo[] = [];

  for (const member of insertedGroupMembers) {
    const addedUser = await retrieveUserById(member.id);
    addedUsersInfo.push(addedUser);

    if (userSockets.has(addedUser.id)) {
      // Get the socket ID of each member added to the group
      const addedUserSocketId = userSockets.get(addedUser.id);
      if (addedUserSocketId) {
        io.to(addedUserSocketId).emit('add-group-to-chat-list', {
          chat_id: `g_${groupData.group_id}`,
          chat_picture: groupPictureUrl,
          chat_type: 'group',
          deleted: false,
          last_message_content: 'You were added',
          last_message_id: null,
          last_message_time: null,
          name: groupData.name,
          read: false,
          recipient_user_id: null,
          room,
          updated_at: new Date(),
        });
        const memberSocket = io.sockets.sockets.get(addedUserSocketId);
        memberSocket?.join(room);
      }
    }
  }

  return addedUsersInfo;
};

// When a new group chat is created, add it to the chat lists of the creator and all users who were added during creation
const broadcastGroupCreation = (
  io: Server,
  insertedGroupMembers: GroupMemberInsertionResult[],
  newGroupChat: NewGroupChat,
): void => {
  for (const member of insertedGroupMembers) {
    if (member.value) {
      if (userSockets.has(member.value.id)) {
        // Get the socket ID of each member added to the group
        const socketId = userSockets.get(member.value.id);
        if (socketId) {
          // This structure is used as it mirrors the one returned when fetching a user's chats from the database to build their chat list
          // Ensures uniform handling of chat items in the frontend chat list
          io.to(socketId).emit('add-group-to-chat-list', {
            chat_id: `g_${newGroupChat.group_id}`,
            chat_picture: null,
            chat_type: 'group',
            deleted: false,
            last_message_content:
              member.value.role === GroupMemberRole.OWNER
                ? `You created ${newGroupChat.name}`
                : 'You were added',
            last_message_id: null,
            last_message_time: null,
            name: newGroupChat.name,
            read: false,
            recipient_user_id: null,
            room: newGroupChat.room,
            updated_at: new Date(),
          });
          const memberSocket = io.sockets.sockets.get(socketId);
          memberSocket?.join(newGroupChat.room);
        }
      }
    }
  }
};
