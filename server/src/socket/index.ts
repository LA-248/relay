/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from 'socket.io';
import { registerChatEvents } from './events.ts';
import { initialiseChatRooms } from './services/room.service.ts';
import { manageSocketConnections } from './services/connection.service.ts';

export const userSockets = new Map<number, string>();

// Listen for new client connections to the server and set up client-specific socket event handlers
export const configureSockets = (io: Server) => {
  io.on('connection', (socket) => {
    // Check if user is authenticated
    const userId = (socket as any).request.session?.passport?.user;
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`User connected`);
    console.log(`User ID: ${userId}`);

    initialiseChatRooms(socket);
    manageSocketConnections(socket, userSockets);

    // Register chat related event handlers
    registerChatEvents(socket, io);
  });
};
