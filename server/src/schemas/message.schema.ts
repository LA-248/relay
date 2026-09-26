import { z } from 'zod/v4';
import { ChatType } from '../types/chat.ts';
import { MessageType } from '../types/message.ts';

export const ClientMessageEventSchema = z.strictObject({
  username: z.string(),
  chatId: z.coerce.number().int().positive(),
  content: z.string(),
  room: z.uuid(),
  chatType: z.enum(ChatType),
  messageType: z.enum(MessageType),
  fileKey: z.string().optional(),
});

export const ClientMessageEditEventPayloadSchema = z.strictObject({
  messageId: z.coerce.number().int().positive(),
  content: z.string(),
  room: z.uuid(),
});

export const ClientMessageDeleteEventPayloadSchema = z.strictObject({
  messageId: z.coerce.number().int().positive(),
  room: z.uuid(),
});

export const InsertMessageSchema = z.object({
  content: z.string(),
  senderId: z.number().int().positive(),
  recipientId: z.number().int().positive().nullable(),
  room: z.uuid(),
  type: z.string(),
  clientOffset: z.string(),
});
export type InsertMessage = z.infer<typeof InsertMessageSchema>;

export const NewMessageSchema = z.object({
  id: z.number(),
  event_time: z.coerce.date(),
  type: z.string(),
});
export type NewMessage = z.infer<typeof NewMessageSchema>;

export const MessageSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  recipient_id: z.number().int().positive().nullable(),
  group_id: z.number().int().positive().nullable(),
  content: z.string(),
  event_time: z.coerce.date(),
  is_edited: z.boolean(),
  type: z.string(),
  sender_username: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const FormattedMessageSchema = z.object({
  from: z.string(),
  content: z.string(),
  eventTime: z.coerce.date(),
  id: z.number(),
  senderId: z.number().int().positive(),
  isEdited: z.boolean(),
  messageType: z.string(),
});
export type FormattedMessage = z.infer<typeof FormattedMessageSchema>;

export const LastMessageInfoSchema = z.object({
  content: z.string(),
  event_time: z.coerce.date(),
  type: z.string(),
});
export type LastMessageInfo = z.infer<typeof LastMessageInfoSchema>;

export const EditMessageBodySchema = z.strictObject({
  newMessage: z.string(),
});
export type EditMessageInputDto = z.infer<typeof EditMessageBodySchema>;
export type EditMessageResponseDto = EditMessageInputDto;

export const EditMessageParamsSchema = z.strictObject({
  type: z.string(),
  chatId: z.string(),
  messageId: z.string(),
});
export type EditMessageParamsDto = z.input<typeof EditMessageParamsSchema>;

export const DeleteMessageParamsSchema = z.strictObject({
  type: z.string(),
  chatId: z.string(),
  messageId: z.string(),
});
export type DeleteMessageParamsDto = z.infer<typeof DeleteMessageParamsSchema>;
