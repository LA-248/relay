import { RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ApiErrorResponse } from '../dtos/error.dto.ts';
import {
  CreatePrivateChatInputDto,
  DeleteChatResponseDto,
  UpdateLastMessageIdInputDto,
  UpdateReadStatusResponseDto,
} from '../dtos/private-chat.dto.ts';
import {
  findChatListByUser,
  addNewPrivateChat,
  updateDeletedAt,
  updateLastMessage,
  updateLastReadAt,
} from '../services/private-chat.service.ts';
import { findUserIdByUsername } from '../services/user.service.ts';
import { ChatDto } from '../types/chat.ts';
import { userSockets } from '../socket/index.ts';

// Handle adding a chat (new or previously added but deleted) to a user's chat list
export const addChat: RequestHandler<
  ParamsDictionary,
  ChatDto | ApiErrorResponse,
  CreatePrivateChatInputDto
> = async (req, res) => {
  try {
    const senderId = Number(req.user?.id);
    const recipientName = req.body.recipientName;

    const { id: recipientId } = await findUserIdByUsername(
      recipientName,
    );

    const io = req.app.get('io');
    const socket = io.sockets.sockets.get(userSockets.get(senderId)); // Retrieve specific socket instance by socket ID
    if (!socket) return;

    const addedChat = await addNewPrivateChat(socket, senderId, recipientId);
    res.status(200).json(addedChat);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message ===
        'User does not exist. Make sure that the username is correct.'
      ) {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    console.error('Error adding chat:', error);
    res.status(500).json({ error: 'Error adding chat. Please try again.' });
  }
};

// Fetch the chat list of a specific user
// TODO: Move this function to a different file - this handles all chats, not just private ones
export const getChatList: RequestHandler<
  ParamsDictionary,
  ChatDto[] | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const chatList = await findChatListByUser(userId);

    res.status(200).json(chatList);
  } catch (error) {
    console.error('Error retrieving chat list:', error);
    res.status(500).json({ error: 'Unable to retrieve chat list' });
  }
};

export const updateLastMessageId: RequestHandler<
  { room: string },
  void | ApiErrorResponse,
  UpdateLastMessageIdInputDto
> = async (req, res) => {
  try {
    const room = req.params.room;
    const messageId = req.body.messageId;
    await updateLastMessage(messageId, room);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error updating last message id:', error);
    res.status(500).json({
      error:
        'There was an error updating your chat list. Please refresh the page.',
    });
  }
};

export const updateLastReadStatus: RequestHandler<
  { room: string },
  UpdateReadStatusResponseDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const room = req.params.room;

    await updateLastReadAt(userId, room);
    res
      .status(200)
      .json({ ok: true, success: 'Read status updated successfully.' });
  } catch (error) {
    console.error('Error updating read status:', error);
    res.status(500).json({
      error:
        'There was an error updating the read status of your chat. Please refresh the page.',
    });
  }
};

// Delete a chat from a user's chat list
export const deletePrivateChat: RequestHandler<
  { room: string },
  DeleteChatResponseDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const room = req.params.room;
    await updateDeletedAt(userId, room);
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Error deleting chat. Please try again.' });
  }
};
