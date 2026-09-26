import { z } from 'zod/v4';
import {
  ClientMessageDeleteEventPayloadSchema,
  ClientMessageEditEventPayloadSchema,
  ClientMessageEventSchema,
  NewMessage
} from '../schemas/message.schema.ts';
import { ChatType } from './chat.ts';

export type Message = {
  from: string;
  content: string;
  room: string;
  eventTime: NewMessage['event_time'];
  id: NewMessage['id'];
  senderId: number;
  isEdited?: boolean;
  chatType: ChatType;
  messageType: MessageType;
}

export type ClientMessageEventPayload = z.infer<typeof ClientMessageEventSchema>;

export type ClientMessageEditEventPayload = z.infer<typeof ClientMessageEditEventPayloadSchema>;
export type ServerMessageEditEventPayload = ClientMessageEditEventPayload;

export type ClientMessageDeleteEventPayload = z.infer<typeof ClientMessageDeleteEventPayloadSchema>;
export type ServerMessageDeleteEventPayload = ClientMessageDeleteEventPayload;

export type MessageSenderId = {
  messageSenderId: number;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

