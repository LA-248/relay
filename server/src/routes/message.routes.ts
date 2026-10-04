import express from 'express';
import {
  deleteMessage,
  editMessage,
  uploadMedia,
} from '../controllers/message.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import {
  authoriseMessageDeletion,
  enforceMessageEditRules,
} from '../middlewares/message.middleware.ts';
import { validate } from '../middlewares/validation.middleware.ts';
import {
  EditMessageBodySchema,
  EditMessageParamsSchema,
} from '../schemas/message.schema.ts';
import { mediaUploadMiddleware } from '../middlewares/media-upload.middleware.ts';
import { MulterUploadField, S3AttachmentsStoragePath } from '../types/chat.ts';

const messagesRouter = express.Router();
messagesRouter.use(requireAuth);

messagesRouter.put(
  '/:type/:chatId/messages/:messageId',
  validate({ body: EditMessageBodySchema, params: EditMessageParamsSchema }),
  enforceMessageEditRules,
  editMessage,
);
messagesRouter.delete(
  '/:type/:chatId/messages/:messageId',
  authoriseMessageDeletion,
  deleteMessage,
);
messagesRouter.post(
  '/:type/:id/media',
  mediaUploadMiddleware(
    MulterUploadField.MEDIA_UPLOAD,
    S3AttachmentsStoragePath.CHAT_ATTACHMENTS,
  ),
  uploadMedia,
);

export default messagesRouter;
