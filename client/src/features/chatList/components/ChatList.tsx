import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../../../hooks/useSocket';
import { ChatContext } from '../../../contexts/ChatContext';
import { ChatType, type Chat } from '../../../types/chat';
import {
  getChatList,
  updateLastReadStatus,
} from '../../../api/private-chat-api';
import ChatItem from './ChatItem';
import useClearErrorMessage from '../../../hooks/useClearErrorMessage';
import useChatListUpdate from '../hooks/useChatListUpdate';
import useChatUpdates from '../../chats/hooks/useChatUpdates';
import useAddGroup from '../hooks/useAddGroup';
import useAddNewPrivateChat from '../../chats/hooks/useAddPrivateChat';
import { useChatDelete } from '../hooks/useChatDelete';
import { useSocketErrorHandling } from '../../../hooks/useSocketErrorHandling';
import { updateLastReadStatus as updateLastGroupReadStatus } from '../../../api/group-chat-api';
import useRemoveGroupChat from '../hooks/useRemoveGroupChat';
import { UserContext } from '../../../contexts/UserContext';

export default function ChatList({
  setChatName,
}: {
  setChatName: React.Dispatch<React.SetStateAction<string>>;
}) {
  const socket = useSocket();
  const navigate = useNavigate();
  const { room } = useParams();

  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [hoverChatId, setHoverChatId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { loggedInUserId } = useContext(UserContext);
  const {
    chatSearchInputText,
    setChatSearchInputText,
    chatList,
    setChatList,
    activeChatRoom,
    setActiveChatRoom,
  } = useContext(ChatContext);

  const handleChatClick = async (chat: Chat): Promise<void> => {
    const readAt = new Date();
    setActiveChatRoom(chat.room);
    setChatName(chat.name);

    if (chat.chat_type === ChatType.PRIVATE) {
      navigate(`/chats/${chat.room}`);
      await updateLastReadStatus(chat.room);

      setChatList((prevChatList): Chat[] => {
        return prevChatList.map((currentChat) => {
          return currentChat.room === chat.room
            ? { ...currentChat, last_read_at: readAt }
            : currentChat;
        });
      });
    } else {
      navigate(`/groups/${chat.room}`);
      const groupId: number = Number(chat.chat_id.split('_').pop()); // There must be a cleaner way to do this
      await updateLastGroupReadStatus(groupId, loggedInUserId);
    }
  };

  // Retrieve the user's chat list for display
  useEffect(() => {
    const displayChatList = async (): Promise<void> => {
      try {
        const chatList = await getChatList();
        setChatList(chatList);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      }
    };

    displayChatList();
  }, [setChatList]);

  // Filter chat list based on search input
  useEffect(() => {
    if (chatSearchInputText) {
      const filtered = chatList.filter((chat) =>
        chat.name.toLowerCase().includes(chatSearchInputText.toLowerCase()),
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chatList);
    }
  }, [chatSearchInputText, chatList]);

  const handleChatDelete = useChatDelete(
    setChatList,
    setChatSearchInputText,
    activeChatRoom,
    setActiveChatRoom,
    setErrorMessage,
  );

  useChatListUpdate(socket, setChatList, activeChatRoom);
  useAddGroup(socket, setChatList); // When a user is added to a group chat, notify them and add it to their chat list
  useRemoveGroupChat(socket, setChatList, setActiveChatRoom, navigate);
  useAddNewPrivateChat(socket, setChatList);
  useChatUpdates(socket, setChatList, room!); // the route pattern chats/:room guarantees room exists at runtime

  useSocketErrorHandling(socket, setErrorMessage);
  useClearErrorMessage(errorMessage, setErrorMessage);

  return (
    <div className='chat-list'>
      {errorMessage ? (
        <div className='error-message' style={{ margin: '10px 0px 10px 0px' }}>
          {errorMessage}
        </div>
      ) : null}
      {chatSearchInputText && filteredChats.length === 0 ? (
        <div id='no-chats-state'>No chats found</div>
      ) : (
        filteredChats
          .filter((chat) => !chat.deleted_at)
          .map((chat) => (
            <ChatItem
              key={chat.chat_id}
              chat={chat}
              isActive={chat.room === activeChatRoom}
              isHovered={hoverChatId === chat.chat_id}
              onMouseEnter={() => setHoverChatId(chat.chat_id)}
              onMouseLeave={() => setHoverChatId('')}
              onClick={() => handleChatClick(chat)}
              onDeleteClick={(event) => handleChatDelete(event, chat)}
            />
          ))
      )}
    </div>
  );
}
