import express from 'express';
import {
  addChat,
  deleteChat,
  getChatList,
  updateReadStatus,
  updateLastMessageId,
} from '../controllers/private-chat.controller.ts';
import { getRecipientProfile } from '../controllers/user.controller.ts';
import {
  privateChatRoomAuth,
  requireAuth,
} from '../middlewares/auth.middleware.ts';
import { validate } from '../middlewares/validation.middleware.ts';
import {
  CreatePrivateChatBodySchema,
  DeleteChatParamsSchema,
  UpdateLastMessageIdBodySchema,
  UpdateLastMessageIdParamsSchema,
  UpdateReadStatusParamsSchema,
} from '../schemas/private-chat.schema.ts';
import {
  RetrieveRecipientProfileParamsSchema,
  UserDataAuthSchema,
} from '../schemas/user.schema.ts';

const privateChatsRouter = express.Router();
privateChatsRouter.use(requireAuth);

privateChatsRouter.post(
  '/',
  validate({
    user: UserDataAuthSchema,
    body: CreatePrivateChatBodySchema
  }),
  addChat,
);
privateChatsRouter.get('/', getChatList);
privateChatsRouter.get(
  '/:room',
  privateChatRoomAuth,
  validate({
    user: UserDataAuthSchema,
    params: RetrieveRecipientProfileParamsSchema,
  }),
  getRecipientProfile,
);
privateChatsRouter.put(
  '/:room/last_message',
  privateChatRoomAuth,
  validate({
    body: UpdateLastMessageIdBodySchema,
    params: UpdateLastMessageIdParamsSchema,
  }),
  updateLastMessageId,
);
privateChatsRouter.put(
  '/:room/read_status',
  privateChatRoomAuth,
  validate({
    user: UserDataAuthSchema,
    params: UpdateReadStatusParamsSchema,
  }),
  updateReadStatus,
);
privateChatsRouter.delete(
  '/:room',
  validate({
    user: UserDataAuthSchema,
    params: DeleteChatParamsSchema
  }),
  deleteChat,
);

export default privateChatsRouter;
