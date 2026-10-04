import { Server, Socket } from 'socket.io';
import { authoriseChatMessage } from './middlewares/auth.middleware.ts';
import {
  createChatMessageHandler,
  deleteMessageHandler,
  displayChatMessagesHandler,
  editMessageHandler,
  updateRecentMessageHandler,
} from './handlers/chat.handler.ts';

export const registerChatEvents = (socket: Socket, io: Server) => {
  socket.on(
    'chat-message',
    authoriseChatMessage(createChatMessageHandler(socket, io), socket),
  );

  socket.on('last-message-updated', updateRecentMessageHandler(socket, io));

  socket.on('message-edited', editMessageHandler(socket, io));

  socket.on('message-deleted', deleteMessageHandler(socket, io));

  // Recipient data could also potentially be fetched here instead of doing it in a separate HTTP request
  socket.on('open-chat', (room: string) => {
    displayChatMessagesHandler(socket, room);
  });
};
