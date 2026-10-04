import { Socket } from 'socket.io';

// TODO: This should be stored in Redis
// Store user-to-socket mappings in a hash map
// This allows for socket connections to be associated with the correct user
export function manageSocketConnections(
  socket: Socket,
  userSockets: Map<number, string>,
) {
  const userId = (socket as any).request.session?.passport?.user;
  if (!userId) {
    socket.disconnect();
    return;
  }

  userSockets.set(userId, socket.id);

  socket.on('disconnect', () => {
    if (userSockets.get(userId) === socket.id) {
      userSockets.delete(userId);
    }
  });

  console.log(userSockets);
}
