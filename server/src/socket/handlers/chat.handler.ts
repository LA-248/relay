import { Server, Socket } from 'socket.io';
import {
  isSenderBlocked,
} from '../../middlewares/message.middleware.ts';
import { Group } from '../../repositories/group.repository.ts';
import { Message as MessageRepository } from '../../repositories/message.repository.ts';
import { PrivateChat } from '../../repositories/private-chat.repository.ts';
import {
  NewMessage,
} from '../../schemas/message.schema.ts';
import { addNewPrivateChatOnFirstMessage, restoreChat } from '../../services/private-chat.service.ts';
import { createPresignedUrl } from '../../services/s3.service.ts';
import {
  ChatType,
} from '../../types/chat.ts';
import { Message, ClientMessageEventPayload, MessageType, ClientMessageEditEventPayload, ServerMessageEditEventPayload, ClientMessageDeleteEventPayload, ServerMessageDeleteEventPayload } from '../../types/message.ts';
import { formatMessage, saveMessageToDatabase } from '../../services/message.service.ts';

export const createChatMessageHandler = (socket: Socket, io: Server) =>
  async (data: ClientMessageEventPayload, clientOffset: string, callback: any) => {
    // In the context of private chats, chatId equals the ID of the recipient
    // fileKey is used for media uploads.
    const {
      username,
      chatId,
      content,
      room,
      chatType,
      messageType,
      fileKey,
    } = data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const senderId = (socket as any).request.session.passport.user;
    const isImage = messageType === MessageType.IMAGE;

    try {
      if (chatType === ChatType.PRIVATE) {
        await Promise.all([
          isSenderBlocked(chatId, senderId),
          addNewPrivateChatOnFirstMessage(io, socket, chatId, room),
        ]);
      }

      const [{ newMessage, updatedAt }] = await Promise.all([
        saveMessageToDatabase(
          content,
          senderId,
          chatId,
          room,
          chatType,
          messageType,
          clientOffset,
        ),
        restoreChat(chatId, room, chatType),
      ]);
      const messageContent = isImage ? await createPresignedUrl(process.env.BUCKET_NAME!, fileKey as string) : content;

      broadcastMessage(
        io,
        room,
        username,
        messageContent,
        senderId,
        newMessage,
        chatType,
        messageType,
      );
      broadcastChatListUpdate(io, room, content, newMessage, updatedAt);

      if (isImage) {
        callback({ success: true, message: 'Media uploaded' });
      }

      return;
    } catch (error: unknown) {
      console.error('Error handling chat message:', error);
      if (error instanceof Error) {
        if (error.message === 'Sender is blocked by the recipient') {
          callback({
            success: false,
            error: 'You cannot send messages to this user because they have you blocked',
          });
        }
      }
      callback({
        success: false,
        error: 'Error sending message',
      });
    }
  }

// Load all messages of a chat when opened
export const displayChatMessagesHandler = async (
  socket: Socket,
  room: string,
): Promise<void> => {
  if (!socket.recovered) {
    try {
      const messageRepository = new MessageRepository();

      // Get messages from database for display, filtered by room
      const messages = await messageRepository.findMessageList(
        socket.handshake.auth.serverOffset,
        room,
      );

      const settled = await Promise.allSettled(messages.map(formatMessage));
      const initialMessages = settled
        .filter((result) => result.status === 'fulfilled')
        .map((result) => {
          return result.value;
        });

      socket.emit('initial-messages', initialMessages);
    } catch (error) {
      console.error('Unable to retrieve chat messages:', error);
      socket.emit('custom-error', {
        error: 'Unable to retrieve chat messages',
      });
      return;
    }
  }
};

// Send updated message info for the chat list after the last remaining message in a chat is deleted or edited
export const updateRecentMessageHandler = (socket: Socket, io: Server) =>
  async (data: { room: string, chatType: ChatType }) => {
    const { room, chatType } = data;

    try {
      const messageRepository = new MessageRepository();
      const privateChatRepository = new PrivateChat();
      const groupRepository = new Group();

      const lastMessageInfo = await messageRepository.findLastMessageInfo(room);
      const isImage = lastMessageInfo?.type === MessageType.IMAGE;
      const isPrivateChat = chatType === ChatType.PRIVATE;

      const lastMessageContent = lastMessageInfo
        ? isImage
          ? 'Image'
          : lastMessageInfo.content
        : null;

      const lastMessageTime = lastMessageInfo
        ? lastMessageInfo.event_time
        : null;

      const { updated_at } = isPrivateChat
        ? await privateChatRepository.findUpdatedAtDate(room)
        : await groupRepository.findUpdatedAtDate(room);
      const updatedAt = updated_at;

      io.to(room).emit('last-message-updated', {
        room: room,
        lastMessageContent,
        lastMessageTime,
        updatedAt: updatedAt,
      });
    } catch (error) {
      console.error('Error updating chat list:', error);
      socket.emit('custom-error', {
        error: `There was an error updating your chat list. Please refresh the page.`,
      });
      return;
    }
  };

export const editMessageHandler = (socket: Socket, io: Server) =>
  async (data: ClientMessageEditEventPayload) => {
    try {
      const { messageId, content, room } = data;
      const messageEditPayload: ServerMessageEditEventPayload =
        { messageId, content, room };

      io.to(room).emit('message-edited', messageEditPayload);
    } catch (error) {
      console.error('Unexpected error:', error);
      socket.emit('custom-error', {
        error: `Error editing message. Please try again.`,
      });
      return;
    }
  };

export const deleteMessageHandler = (socket: Socket, io: Server) =>
  async (data: ClientMessageDeleteEventPayload) => {
    try {
      const { messageId, room } = data;
      const messageDeletePayload: ServerMessageDeleteEventPayload =
        { messageId, room };

      io.to(room).emit('message-deleted', messageDeletePayload);
    } catch (error) {
      console.error('Unexpected error:', error);
      socket.emit('custom-error', {
        error: `Error deleting message. Please try again.`,
      });
      return;
    }
  };

// Emit a chat message to everyone in the relevant room (used for both private and group chats)
const broadcastMessage = (
  io: Server,
  room: string,
  username: string,
  content: string,
  senderId: number,
  newMessage: NewMessage,
  chatType: ChatType,
  messageType: MessageType,
): void => {
  const payload: Message = {
    from: username,
    content,
    room,
    eventTime: newMessage.event_time,
    id: newMessage.id,
    senderId,
    chatType,
    messageType,
  }

  io.to(room).emit('chat-message', payload);
};

// Update the chat's preview info in the chat list for everyone in the room
const broadcastChatListUpdate = (
  io: Server,
  room: string,
  message: string,
  newMessage: NewMessage,
  updatedAt: Date,
): void => {
  const isImage = newMessage.type === MessageType.IMAGE;

  io.to(room).emit('update-chat-list', {
    room: room,
    lastMessageContent: isImage ? 'Image' : message,
    lastMessageTime: newMessage.event_time,
    updatedAt: updatedAt,
  });
};
