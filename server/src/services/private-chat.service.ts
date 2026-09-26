import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ChatList } from '../repositories/chat-list.repository.ts';
import { PrivateChat } from '../repositories/private-chat.repository.ts';
import { ChatDeletionStatus } from '../schemas/private-chat.schema.ts';
import { ChatDto, ChatType, S3AvatarStoragePath } from '../types/chat.ts';
import {
  createPresignedUrl,
  generateChatListPresignedUrls,
} from './s3.service.ts';
import { userSockets } from '../socket/index.ts';
import { restoreGroupChat } from './group.service.ts';

export const addNewPrivateChat = async (
  socket: Socket,
  senderId: number,
  recipientId: number,
): Promise<ChatDto> => {
  const privateChatRepository = new PrivateChat();
  const { room } = await privateChatRepository.findRoomByMembers(
    senderId,
    recipientId,
  );

  // This check is needed to know whether to insert a new chat in the database or restore a pre-existing one
  if (room === null) {
    const newRoom = uuidv4();

    await privateChatRepository.insertNewChat(senderId, recipientId, newRoom);
    socket.join(newRoom);

    return await findPrivateChat(senderId, newRoom);
  } else {
    await privateChatRepository.restoreChat(senderId, room);
    return await findPrivateChat(senderId, room);
  }
};

// When a user receives a message from someone for the first time, add the chat to their chat list in real-time
export const addNewPrivateChatOnFirstMessage = async (
  io: Server,
  socket: Socket,
  recipientId: number,
  room: string,
): Promise<void> => {
  try {
    const privateChatRepository = new PrivateChat();

    const lastMessageId = await privateChatRepository.findLastMessageId(room);
    const socketId = userSockets.get(recipientId);

    if (!socketId || lastMessageId !== null) return;

    // If lastMessageId is null, it means it's the first message being sent in the chat, which should -
    // trigger the chat to be added to the recipient's chat list
    if (socketId && lastMessageId === null) {
      const newChat = await findPrivateChat(recipientId, room);
      const recipientSocket = io.sockets.sockets.get(socketId);

      // Only add chat if it does not already exist in the user's chat list
      if (!newChat.deleted_at) {
        recipientSocket?.join(room);
        socket.to(socketId).emit('add-private-chat-to-chat-list', newChat);
      }
    }
  } catch (error) {
    // Here the error is swallowed, this is because we don't want to block the sender's message from being delivered if adding -
    // the new chat for the recipient fails
    console.error('Error adding new private chat:', error);
  }
};

export const findPrivateChat = async (
  senderId: number,
  room: string,
): Promise<ChatDto> => {
  const privateChatRepository = new PrivateChat();

  const chat = await privateChatRepository.findChat(senderId, room);
  const profilePictureName = chat.chat_picture;
  const recipientId = chat.recipient_user_id;

  const profilePictureUrl = profilePictureName
    ? await createPresignedUrl(
      process.env.BUCKET_NAME!,
      `${S3AvatarStoragePath.USER_AVATARS}/${recipientId}/${profilePictureName}`,
    )
    : null;

  return { ...chat, chat_picture: profilePictureUrl };
};

export const findPrivateChatMembersByRoom = async (room: string): Promise<number[]> => {
  try {
    const privateChatRepository = new PrivateChat();
    const members = await privateChatRepository.findMembersByRoom(room);
    return members ? Object.values(members) : [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Unable to retrieve private chat members: ${error.message}`,
      );
    }
    throw new Error('An unexpected error occurred');
  }
}

export const findPrivateChatUpdatedAtDate = async (room: string) => {
  const privateChatRepository = new PrivateChat();
  return await privateChatRepository.findUpdatedAtDate(room);
}

// TODO: Move to more general location since this handles both private and group chats
// Mark a chat as not deleted in the database on incoming message if it was previously marked as deleted
export const restoreChat = async (
  recipientId: number, // For group chats, this is the groupId
  room: string,
  chatType: string,
): Promise<void> => {
  try {
    const privateChatRepository = new PrivateChat();

    const isPrivateChat = chatType === ChatType.PRIVATE;
    const isGroupChat = chatType === ChatType.GROUP;

    if (isPrivateChat) {
      const result = await privateChatRepository.findChatDeletionStatus(
        recipientId,
        room,
      );
      if (!result?.deleted_at) return; // If result or deleted_at is null, there's nothing to restore, return early
      await privateChatRepository.restoreChat(recipientId, room);
    } else if (isGroupChat) {
      const groupId = recipientId;
      await restoreGroupChat(groupId);
    }
  } catch (error) {
    // Here the error is swallowed, this is because we don't want to block the sender's message from being delivered if restoring -
    // the chat for the recipient fails
    console.error('Error restoring chat:', error);
  }
};

// Update the last message for a chat, used when most recent message is deleted
export const updateLastMessage = async (
  newLastMessageId: number | null,
  room: string,
): Promise<void> => {
  const privateChatRepository = new PrivateChat();
  return await privateChatRepository.updateLastMessage(newLastMessageId, room);
};

export const updateLastReadAt = async (
  userId: number,
  room: string,
): Promise<Date> => {
  const privateChatRepository = new PrivateChat();
  const result = await privateChatRepository.updateLastReadAt(userId, room);
  return result;
};

export const updateDeletedAt = async (
  userId: number,
  room: string,
): Promise<ChatDeletionStatus> => {
  const privateChatRepository = new PrivateChat();
  return await privateChatRepository.updateDeletedAt(userId, room);
};

export const setLastMessage = async (
  newMessageId: number,
  room: string
): Promise<Date> => {
  const privateChatRepository = new PrivateChat();
  const result = await privateChatRepository.setLastMessage(newMessageId, room);
  return result.updated_at;
};


// TODO: Move this function to a more general location - this handles retrieving all chats to construct a user's chat list
export const findChatListByUser = async (userId: number): Promise<ChatDto[]> => {
  const ChatListRepository = new ChatList();
  const chatList = await ChatListRepository.findAllChatsByUser(userId);
  return generateChatListPresignedUrls(chatList);
};
