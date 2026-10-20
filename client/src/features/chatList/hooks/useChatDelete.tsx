import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteGroupChat } from '../../../api/group-chat-api';
import { deletePrivateChat } from '../../../api/private-chat-api';
import type { Chat } from '../../../types/chat';

export function useChatDelete(
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>,
  setChatSearchInputText: React.Dispatch<React.SetStateAction<string>>,
  activeChatRoom: string | null,
  setActiveChatRoom: React.Dispatch<React.SetStateAction<string | null>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
) {
  const navigate = useNavigate();

  const handleChatDelete = useCallback(
    async (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      deletedChat: Chat,
    ): Promise<void> => {
      event.stopPropagation();

      try {
        if (deletedChat.id.includes('p')) {
          await deletePrivateChat(deletedChat.room);
        } else {
          const groupId = Number(deletedChat.id.replace('g_', ''));
          await deleteGroupChat(groupId, deletedChat.room);
        }

        // Set deleted_at in local chat state
        setChatList((chatList) =>
          chatList.map((chat) =>
            chat.room === deletedChat.room
              ? { ...chat, deleted_at: new Date() }
              : chat,
          ),
        );

        setChatSearchInputText('');
        if (activeChatRoom === deletedChat.room) {
          setActiveChatRoom(null);
          navigate('/');
        }
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      }
    },
    [
      activeChatRoom,
      navigate,
      setActiveChatRoom,
      setChatList,
      setChatSearchInputText,
      setErrorMessage,
    ],
  );

  return handleChatDelete;
}
