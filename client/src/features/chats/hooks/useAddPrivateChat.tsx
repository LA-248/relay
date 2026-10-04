import { useEffect } from 'react';
import type { Chat } from '../../../types/chat';
import { Socket } from 'socket.io-client';

// Add private chat to the recipient's chat list in real-time on first time message
export default function useAddNewPrivateChat(
  socket: Socket | null,
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>,
) {
  useEffect(() => {
    if (socket) {
      const handleFirstTimeChatAddition = (newChat: Chat): void => {
        setChatList((prevChatList): Chat[] => {
          // Only add chat if it does not already exist
          if (!prevChatList.some((chat) => chat.chat_id === newChat.chat_id)) {
            return [newChat, ...prevChatList];
          } else {
            return prevChatList;
          }
        });
      };

      socket.on('add-private-chat-to-chat-list', handleFirstTimeChatAddition);

      return () => {
        socket.off(
          'add-private-chat-to-chat-list',
          handleFirstTimeChatAddition,
        );
      };
    }
  }, [socket, setChatList]);
}
