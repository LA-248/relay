import express from 'express';
import {
  getBlockList,
  getUserIdByUsername,
  getLoggedInUserData,
  getUserProfilePicture,
  updateBlockList,
  updateUsername,
  uploadProfilePicture,
} from '../controllers/user.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { validate } from '../middlewares/validation.middleware.ts';
import {
  RetrieveIdByUsernameParamsSchema,
  RetrieveUserProfilePictureParamsSchema,
  UpdateBlockedUsersBodySchema,
  UpdateUsernameParamsSchema,
  UploadProfilePictureParamsSchema,
  UserDataAuthSchema,
} from '../schemas/user.schema.ts';
import { mediaUploadMiddleware } from '../middlewares/media-upload.middleware.ts';
import { MulterUploadField, S3AvatarStoragePath } from '../types/chat.ts';

const usersRouter = express.Router();
usersRouter.use(requireAuth);

usersRouter.get(
  '/',
  validate({ user: UserDataAuthSchema }),
  getLoggedInUserData,
);
usersRouter.get(
  '/blocked',
  validate({ user: UserDataAuthSchema }),
  getBlockList,
);
usersRouter.get(
  '/:username',
  validate({ params: RetrieveIdByUsernameParamsSchema }),
  getUserIdByUsername,
);
usersRouter.get(
  '/:id/pictures',
  validate({ params: RetrieveUserProfilePictureParamsSchema }),
  getUserProfilePicture,
);

usersRouter.put(
  '/',
  validate({ user: UserDataAuthSchema, body: UpdateUsernameParamsSchema }),
  updateUsername,
);
usersRouter.put(
  '/blocked',
  validate({ body: UpdateBlockedUsersBodySchema, user: UserDataAuthSchema }),
  updateBlockList,
);

usersRouter.post(
  '/:id/pictures',
  validate({ params: UploadProfilePictureParamsSchema }),
  mediaUploadMiddleware(MulterUploadField.USER_AVATAR, S3AvatarStoragePath.USER_AVATARS),
  uploadProfilePicture,
);

export default usersRouter;
