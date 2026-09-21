import type { ChatType } from './chat';

export type Message = {
  id: number;
  from: string;
  content: string;
  room: string;
  eventTime: Date;
  senderId: number;
  isEdited?: boolean;
  chatType: ChatType;
  messageType: MessageType;
}

export type ClientMessageEventPayload = {
  username: string;
  chatId: number;
  content: string;
  room: string;
  chatType: ChatType;
  messageType: MessageType;
  fileKey?: string;
}

export type ClientMessageEditEventPayload = {
  messageId: number;
  content: string;
  room: string;
}
export type ServerMessageEditEventPayload = ClientMessageEditEventPayload;

export type ClientMessageDeleteEventPayload = {
  messageId: number;
  room: string;
}
export type ServerMessageDeleteEventPayload = ClientMessageDeleteEventPayload;

export type MessageContextType = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentMessage: string;
  setCurrentMessage: React.Dispatch<React.SetStateAction<string>>;
  filteredMessages: Message[];
  setFilteredMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  messageSearchValueText: string;
  setMessageSearchValueText: React.Dispatch<React.SetStateAction<string>>;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

