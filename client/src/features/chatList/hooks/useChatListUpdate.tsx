import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { Chat, ChatMetadata } from '../../../types/chat';

// Update chat in the list when the last remaining message in a chat is deleted or edited,
// or when a new message is received
export default function useChatListUpdate(
  socket: Socket | null,
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>,
  activeChatRoom: string | null,
) {
  useEffect(() => {
    if (socket) {
      const handleChatListUpdate = (chatData: ChatMetadata): void => {
        setChatList((prevChatList) =>
          prevChatList
            .map((chat) =>
              chat.room === chatData.room
                ? {
                  ...chat,
                  last_message_content: chatData.lastMessageContent,
                  last_message_time: chatData.lastMessageTime,
                  updated_at: chatData.updatedAt,
                }
                : chat,
            )
            .sort((a, b) => {
              const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
              const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
              return timeB - timeA;
            }),
        );
      };

      socket.on('update-chat-list', handleChatListUpdate);
      socket.on('last-message-updated', handleChatListUpdate);

      return () => {
        socket.off('update-chat-list', handleChatListUpdate);
        socket.off('last-message-updated', handleChatListUpdate);
      };
    }
  }, [setChatList, socket, activeChatRoom]);
}
