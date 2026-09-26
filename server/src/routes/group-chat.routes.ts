import express from 'express';
import {
  addMembers,
  createGroupChat,
  deleteGroupChat,
  leaveGroup,
  permanentlyDeleteGroup,
  removeKickedGroupMember,
  getGroupInfo,
  getMemberUsernames,
  updateGroupPicture,
  updateLastMessageId,
  updateLastRead,
  updateRole,
} from '../controllers/group.controller.ts';
import {
  authoriseGroupOwnerAction,
  authoriseGroupOwnerOrAdminAction,
  groupChatRoomAuth,
  requireAuth,
} from '../middlewares/auth.middleware.ts';
import { validate } from '../middlewares/validation.middleware.ts';
import {
  AddGroupMembersSchema,
  CreateGroupChatSchema,
  GroupIdAndRoomParamsSchema,
  GroupIdSchema,
  GroupRoomSchema,
  PermanentlyDeleteGroupParamsSchema,
  RemoveKickedGroupMemberParamsSchema,
  UpdateGroupPictureParamsSchema,
  UpdateLastMessageIdBodySchema,
  UpdateLastMessageIdParamsSchema,
  UpdateLastReadStatusParamsSchema,
  UpdateMemberRoleBodySchema,
  UpdateMemberRoleParamsSchema,
} from '../schemas/group.schema.ts';
import { mediaUploadMiddleware } from '../middlewares/media-upload.middleware.ts';
import { MulterUploadField, S3AvatarStoragePath } from '../types/chat.ts';

const groupChatsRouter = express.Router();
groupChatsRouter.use(requireAuth);

groupChatsRouter.post(
  '/',
  validate({ body: CreateGroupChatSchema }),
  createGroupChat,
);
groupChatsRouter.post(
  '/:room/members',
  groupChatRoomAuth,
  validate({ body: AddGroupMembersSchema }),
  addMembers,
);
groupChatsRouter.post(
  '/:groupId/pictures',
  groupChatRoomAuth,
  validate({ params: UpdateGroupPictureParamsSchema }),
  mediaUploadMiddleware(MulterUploadField.GROUP_PICTURE, S3AvatarStoragePath.GROUP_AVATARS),
  updateGroupPicture,
);

groupChatsRouter.get(
  '/:room',
  groupChatRoomAuth,
  validate({ params: GroupRoomSchema }),
  getGroupInfo,
);
groupChatsRouter.get(
  '/:groupId/members',
  groupChatRoomAuth,
  validate({ params: GroupIdSchema }),
  getMemberUsernames,
);

groupChatsRouter.delete(
  '/:groupId/members/me',
  groupChatRoomAuth,
  validate({ params: GroupIdSchema }),
  leaveGroup,
);
groupChatsRouter.delete(
  '/:groupId/members/:userId',
  groupChatRoomAuth,
  authoriseGroupOwnerOrAdminAction,
  validate({ params: RemoveKickedGroupMemberParamsSchema }),
  removeKickedGroupMember,
);
groupChatsRouter.delete(
  '/:groupId',
  groupChatRoomAuth,
  authoriseGroupOwnerAction,
  validate({ params: PermanentlyDeleteGroupParamsSchema }),
  permanentlyDeleteGroup,
);
groupChatsRouter.delete(
  '/:groupId/rooms/:room',
  groupChatRoomAuth,
  validate({ params: GroupIdAndRoomParamsSchema }),
  deleteGroupChat,
);

groupChatsRouter.put(
  '/:room/last_message',
  groupChatRoomAuth,
  validate({
    body: UpdateLastMessageIdBodySchema,
    params: UpdateLastMessageIdParamsSchema,
  }),
  updateLastMessageId,
);
groupChatsRouter.put(
  '/:groupId/members/:userId',
  groupChatRoomAuth,
  authoriseGroupOwnerAction,
  validate({
    body: UpdateMemberRoleBodySchema,
    params: UpdateMemberRoleParamsSchema,
  }),
  updateRole,
);
groupChatsRouter.put(
  '/:groupId/members/:userId/last_read',
  groupChatRoomAuth,
  validate({
    params: UpdateLastReadStatusParamsSchema,
  }),
  updateLastRead,
);

export default groupChatsRouter;
