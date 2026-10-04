import { NextFunction, Request, Response } from 'express';
import { createS3Uploader } from '../services/s3.service.ts';
import handleMulterError from './multer.middleware.ts';
import { MulterUploadField } from '../types/chat.ts';

export const mediaUploadMiddleware =
  (fieldName: MulterUploadField, storagePathPrefix: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id ?? req.params.groupId; // Either a userId, groupId, or chatId
    let chatType;
    if (req.params.type) {
      chatType = req.params.type;
    }

    const resolvedStoragePath = chatType
      ? `${storagePathPrefix}/${chatType}`
      : storagePathPrefix;

    const upload = createS3Uploader({
      id,
      storagePathPrefix: resolvedStoragePath,
    });
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  };
