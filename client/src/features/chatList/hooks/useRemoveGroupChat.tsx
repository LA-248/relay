import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { Chat } from '../../../types/chat';
import type { RemovedGroupChat } from '../../../types/group';

export default function useRemoveGroupChat(
  socket: Socket | null,
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>,
  setActiveChatRoom: React.Dispatch<React.SetStateAction<string | null>>,
  navigate: (path: string) => void,
) {
  // Remove a group chat that a user left or was kicked out of from their chat list
  useEffect(() => {
    if (!socket) return;

    const handleGroupChatRemoval = (data: RemovedGroupChat) => {
      setChatList((prevChatList) =>
        prevChatList.filter((group) => group.room !== data.room),
      );
      setActiveChatRoom(null);
      navigate(data.redirectPath);
    };

    socket.on('remove-group-chat', handleGroupChatRemoval);

    return () => {
      socket.off('remove-group-chat', handleGroupChatRemoval);
    };
  }, [socket, setChatList, navigate, setActiveChatRoom]);
}
