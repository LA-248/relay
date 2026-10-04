import { createContext, type ReactNode, useState } from 'react';
import type { Chat, ChatContextType } from '../types/chat';
import type { GroupMember } from '../types/group';

const defaultChatContext: ChatContextType = {
  chatList: [],
  setChatList: () => {},
  activeChatRoom: null,
  setActiveChatRoom: () => {},
  chatSearchInputText: '',
  setChatSearchInputText: () => {},
  chatId: 0,
  setChatId: () => {},
  chatName: '',
  setChatName: () => {},
  recipientProfilePicture: '',
  setRecipientProfilePicture: () => {},
  groupPicture: '',
  setGroupPicture: () => {},
  membersList: [],
  setMembersList: () => {},
};

const ChatContext = createContext<ChatContextType>(defaultChatContext);

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState<number>(0);
  const [chatName, setChatName] = useState<string>('');
  const [activeChatRoom, setActiveChatRoom] = useState<string | null>(null);
  const [chatSearchInputText, setChatSearchInputText] = useState<string>('');
  const [recipientProfilePicture, setRecipientProfilePicture] = useState<
    string | null
  >('');
  const [groupPicture, setGroupPicture] = useState<string | null>('');
  const [membersList, setMembersList] = useState<GroupMember[]>([]);

  return (
    <ChatContext.Provider
      value={{
        chatList,
        setChatList,
        activeChatRoom,
        setActiveChatRoom,
        chatSearchInputText,
        setChatSearchInputText,
        chatId,
        setChatId,
        chatName,
        setChatName,
        recipientProfilePicture,
        setRecipientProfilePicture,
        groupPicture,
        setGroupPicture,
        membersList,
        setMembersList,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext, ChatProvider };
