import type { GroupMember } from './group';

export type Chat = {
  chat_id: string;
  chat_picture: string | null;
  chat_type: ChatType;
  recipient_user_id: number | null;
  name: string;
  room: string;
  last_message_content: string | null;
  last_message_id: number | null;
  last_message_time: Date | null;
  last_message_type: string;
  last_read_at: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type ChatMetadata = {
  room: string;
  lastMessageContent: string;
  lastMessageTime: Date;
  lastMessageType: string;
  updatedAt: Date;
};

export enum ChatType {
  PRIVATE = 'chats',
  GROUP = 'groups',
}

export type ChatContextType = {
  chatList: Chat[];
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
  activeChatRoom: string | null;
  setActiveChatRoom: React.Dispatch<React.SetStateAction<string | null>>;
  chatSearchInputText: string;
  setChatSearchInputText: React.Dispatch<React.SetStateAction<string>>;
  chatId: number;
  setChatId: React.Dispatch<React.SetStateAction<number>>;
  chatName: string;
  setChatName: React.Dispatch<React.SetStateAction<string>>;
  recipientProfilePicture: string | null;
  setRecipientProfilePicture: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  groupPicture: string | null;
  setGroupPicture: React.Dispatch<React.SetStateAction<string | null>>;
  membersList: GroupMember[];
  setMembersList: React.Dispatch<React.SetStateAction<GroupMember[]>>;
};
