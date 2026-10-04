import { z } from 'zod/v4';
import {
  CreatePrivateChatBodySchema,
  UpdateLastMessageIdBodySchema,
} from '../schemas/private-chat.schema.ts';

export type CreatePrivateChatInputDto = z.infer<
  typeof CreatePrivateChatBodySchema
>;

export type UpdateLastMessageIdInputDto = z.infer<
  typeof UpdateLastMessageIdBodySchema
>;

export type UpdateReadStatusResponseDto = {
  ok: boolean;
  success: string;
};

export type DeleteChatResponseDto = {
  message: string;
};
