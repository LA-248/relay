import { RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ApiErrorResponse } from '../dtos/error.dto.ts';
import {
  AddMembersInputDto,
  AddMembersResponseDto,
  CreateGroupChatInputDto,
  CreateGroupChatPartialSuccessResponseDto,
  CreateGroupChatResponseDto,
  LeaveGroupResponseDto,
  PermanentlyDeleteGroupResponseDto,
  RemoveKickedGroupMemberResponseDto,
  RetrieveGroupInfoResponseDto,
  RetrieveGroupMemberUsernamesResponseDto,
  UpdateGroupMemberRoleResponseDto,
  UpdateGroupPictureDto,
  UpdateLastMessageIdInputDto,
  UpdateLastMessageIdResponseDto,
} from '../dtos/group.dto.ts';
import { ApiSuccessResponse } from '../dtos/success.dto.ts';
import {
  GroupIdParamsDto,
  GroupRoom,
  NewGroupChat,
  PermanentlyDeleteGroupParamsDto,
  RemoveKickedGroupMemberParamsDto,
  UpdateGroupPictureParamsDto,
  UpdateLastReadStatusParamsDto,
  UpdateMemberRoleBodyDto,
  UpdateMemberRoleParamsDto,
} from '../schemas/group.schema.ts';
import {
  addUsersToGroup,
  createNewGroup,
  deleteGroupForMember,
  findMemberUsernames,
  kickMember,
  permanentlyDeleteGroupChat,
  removeMemberWhoLeft,
  findGroupInfoWithMembers,
  updateGroupMemberLastReadAt,
  updateLastGroupMessage,
  updateMemberRole,
  uploadGroupPicture,
} from '../services/group.service.ts';
import { GroupMemberInsertionResult } from '../types/group.ts';
import { userSockets } from '../socket/index.ts';

// Handle creating a group chat
export const createGroupChat: RequestHandler<
  ParamsDictionary,
  | CreateGroupChatResponseDto
  | CreateGroupChatPartialSuccessResponseDto
  | ApiErrorResponse,
  CreateGroupChatInputDto
> = async (req, res) => {
  try {
    const io: Server = req.app.get('io');
    const room = uuidv4();
    const ownerUserId = req.body.ownerUserId;
    const name = req.body.name;
    const membersToBeAdded = req.body.membersToBeAdded;

    const {
      newGroupChat,
      failedInsertions,
    }: {
      newGroupChat: NewGroupChat;
      failedInsertions: GroupMemberInsertionResult[];
    } = await createNewGroup(io, ownerUserId, name, room, membersToBeAdded);

    // Handle partial success or full success
    // This ensures that the group is still created even if certain members could not be added
    if (failedInsertions.length > 0) {
      res.status(207).json({
        message:
          'Group created successfully but some members could not be added',
        failedMembers: failedInsertions,
      });
      return;
    }

    res.status(200).json(newGroupChat);
  } catch (error) {
    console.error('Error creating group chat:', error);
    res
      .status(500)
      .json({ error: 'Error creating group chat. Please try again.' });
  }
};

export const getGroupInfo: RequestHandler<
  GroupRoom,
  RetrieveGroupInfoResponseDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const groupData = await findGroupInfoWithMembers(req.params.room);
    res.status(200).json(groupData);
  } catch (error) {
    console.error('Error retrieving group info:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const getMemberUsernames: RequestHandler<
  GroupIdParamsDto,
  RetrieveGroupMemberUsernamesResponseDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const usernames = await findMemberUsernames(Number(groupId));
    res.status(200).json({ memberUsernames: usernames });
  } catch (error) {
    console.error('Error retrieving group member usernames:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const deleteGroupChat: RequestHandler<
  {
    groupId: string;
  },
  ApiSuccessResponse | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.user?.id);
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await deleteGroupForMember(groupId, userId);
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Error deleting chat. Please try again.' });
  }
};

// TODO: Use database transactions here to only insert new members in the database if all operations succeed
export const addMembers: RequestHandler<
  GroupRoom,
  AddMembersResponseDto | ApiErrorResponse,
  AddMembersInputDto
> = async (req, res) => {
  try {
    const io = req.app.get('io');
    const room = req.params.room;

    const addedUsersInfo = await addUsersToGroup(
      io,
      room,
      req.body.addedMembers,
    );

    // Emit info of added users to update the members list in real-time
    io.to(room).emit('add-members', {
      addedUsersInfo,
    });

    res.status(200).json({
      message:
        req.body.addedMembers.length > 1 ? 'Members added' : 'Member added',
      addedMembers: addedUsersInfo,
    });
  } catch (error) {
    console.error('Error adding members to group chat:', error);
    res.status(500).json({ error: 'Error adding members. Please try again.' });
  }
};

// Handle a user voluntarily leaving a group chat
export const leaveGroup: RequestHandler<
  { groupId: string },
  LeaveGroupResponseDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const io = req.app.get('io');

    const userId = Number(req.user?.id);
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const groupId = Number(req.params.groupId);

    const socketId = userSockets.get(userId);
    const {
      room,
      removedUser,
      newGroupOwner: updatedMember,
    } = await removeMemberWhoLeft(io, groupId, userId);
    const removedUserId = removedUser.id;

    // Send the user id of the removed member to the frontend
    // This allows for the members list to be updated in real-time for all group chat participants
    io.to(room).emit('remove-member', {
      removedUserId,
    });

    // After a member leaves, send the room to the frontend so the group can be filtered out of their chat list
    io.to(socketId).emit('remove-group-chat', {
      room: room,
      redirectPath: '/',
    });

    // If the member who left was the owner, emit the info of the newly assigned group owner
    io.to(room).emit('update-group-owner', {
      updatedMember,
    });

    res.status(200).json({
      message: 'You successfully left the group chat',
    });
  } catch (error) {
    console.error('Error leaving group chat:', error);
    res
      .status(500)
      .json({ error: 'Error leaving group chat. Please try again.' });
  }
};

// Used when the group owner or an admin kicks a member
export const removeKickedGroupMember: RequestHandler<
  RemoveKickedGroupMemberParamsDto,
  RemoveKickedGroupMemberResponseDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const io = req.app.get('io');
    const loggedInUserId = Number(req.user?.id); // Get the ID of the user performing the member removal
    if (!loggedInUserId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { room, removedUser } = await kickMember(
      io,
      Number(req.params.groupId),
      Number(req.params.userId),
      loggedInUserId,
    );
    const removedUserId = removedUser.id;
    const socketId = userSockets.get(Number(req.params.userId));

    // Send the user id of the removed member to the frontend
    // This allows for the members list to be updated in real-time for all group chat participants
    io.to(room).emit('remove-member', {
      removedUserId,
    });

    if (socketId) {
      // After a member is kicked, send the room to the frontend so the group can be filtered out of their chat list
      io.to(socketId).emit('remove-group-chat', {
        room: room,
        redirectPath: '/',
      });
    }

    res.status(200).json({
      kickedMemberUserId: removedUser.id,
      message: 'Member removed',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'You may not kick this member') {
        res.status(403).json({
          error: error.message,
        });
        return;
      }
    }
    console.error('Error removing member from group chat:', error);
    res.status(500).json({
      error: 'Error removing member from group chat. Please try again.',
    });
  }
};

export const updateGroupMemberRole: RequestHandler<
  UpdateMemberRoleParamsDto,
  UpdateGroupMemberRoleResponseDto | ApiErrorResponse,
  UpdateMemberRoleBodyDto
> = async (req, res): Promise<void> => {
  try {
    const io = req.app.get('io');

    const { room, updatedMember } = await updateMemberRole(
      req.body.role,
      Number(req.params.groupId),
      Number(req.params.userId),
    );

    io.to(room).emit('update-member-role', {
      updatedMember,
    });

    res.status(200).json({
      message: 'Member role updated',
      id: updatedMember.id,
      role: updatedMember.role,
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({
      error: 'Error updating member role. Please try again.',
    });
  }
};

export const permanentlyDeleteGroup: RequestHandler<
  PermanentlyDeleteGroupParamsDto,
  PermanentlyDeleteGroupResponseDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const io = req.app.get('io');

    const { room, memberSocketIds } = await permanentlyDeleteGroupChat(
      Number(req.params.groupId),
    );

    // After a group is permanently deleted, send the room to the frontend so it can be filtered out of each member's chat list
    for (let i = 0; i < memberSocketIds.length; i++) {
      const socketId = memberSocketIds[i];
      io.to(socketId).emit('remove-group-chat', {
        room: room,
        redirectPath: '/',
      });
    }

    res.status(200).json({ message: 'Group successfully deleted' });
  } catch (error) {
    console.error('Error deleting group chat:', error);
    res.status(500).json({
      message: 'Error deleting group chat. Please try again.',
    });
  }
};

export const updateGroupPicture: RequestHandler<
  UpdateGroupPictureParamsDto,
  UpdateGroupPictureDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const io = req.app.get('io');

    const file = req.file as Express.MulterS3.File;
    const { fileUrl, groupId, name } = await uploadGroupPicture(
      Number(req.params.groupId),
      file,
      io,
    );

    res.status(200).json({
      fileUrl,
      groupId,
      name,
    });
  } catch (error) {
    console.error('Error uploading group picture:', error);
    res
      .status(500)
      .json({ error: 'Error uploading picture. Please try again.' });
  }
};

export const updateLastReadStatus: RequestHandler<
  UpdateLastReadStatusParamsDto,
  ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const groupId = Number(req.params.groupId);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await updateGroupMemberLastReadAt(groupId, userId);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error adding group member to read list:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const updateLastMessageId: RequestHandler<
  GroupRoom,
  UpdateLastMessageIdResponseDto | ApiErrorResponse,
  UpdateLastMessageIdInputDto
> = async (req, res) => {
  try {
    await updateLastGroupMessage(req.body.messageId, req.params.room);

    res.status(200).json({ success: 'Last message successfully updated' });
  } catch (error) {
    console.error('Error updating last message id:', error);
    res.status(500).json({
      error:
        'There was an error updating your chat list. Please refresh the page.',
    });
  }
};
