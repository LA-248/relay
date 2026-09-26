import { Socket } from "socket.io";
import { ClientMessageEventPayload } from "../../types/message.ts";
import { ClientMessageEventSchema } from "../../schemas/message.schema.ts";
import { ChatType } from "../../types/chat.ts";
import { findPrivateChatMembersByRoom } from "../../services/private-chat.service.ts";
import { findGroupMembersByRoom } from "../../services/group.service.ts";

// Prevent users from sending messages to chat rooms they are not a part of
// This check is needed because messages do not go through the existing auth middleware since they are handled via sockets and not HTTP routes
export const authoriseChatMessage = (
  handler: (data: ClientMessageEventPayload, clientOffset: string, callback: any) => Promise<void>,
  socket: Socket
) => {
  return async (rawData: unknown, clientOffset: string, callback: any) => {
    // Validate socket event payload emitted from the frontend
    const result = ClientMessageEventSchema.safeParse(rawData);
    if (!result.success) {
      callback({
        success: false,
        error: 'Invalid message payload',
      });
      console.error('Invalid message payload:', result.error);
      return;
    }

    const data = result.data;
    const senderId = (socket as any).request.session.passport.user;

    await authenticateChatMember(senderId, data.chatType, data.room);
    return handler(data, clientOffset, callback);
  }
};

const authenticateChatMember = async (
  senderId: number,
  chatType: ChatType,
  room: string
) => {
  const isPrivateChat = chatType === ChatType.PRIVATE;
  let memberIds: number[];

  if (isPrivateChat) {
    memberIds = await findPrivateChatMembersByRoom(room);
  } else {
    memberIds = await findGroupMembersByRoom(room);
  }

  if (!memberIds.includes(senderId)) {
    throw new Error('User is not authorised to send messages in this chat');
  }
}
