import { z } from 'zod/v4';

export const CreateGroupChatSchema = z.object({
  ownerUserId: z.number().int().positive(),
  name: z.string().min(1).max(50),
  membersToBeAdded: z.array(
    z.object({
      username: z.string(),
      userId: z.number(),
      role: z.string(),
    }),
  ),
});

export const NewGroupChatSchema = z.object({
  group_id: z.number(),
  room: z.uuid(),
  name: z.string(),
});
export type NewGroupChat = z.infer<typeof NewGroupChatSchema>;

export const GroupInfoSchema = z.object({
  group_id: z.number(),
  name: z.string(),
  group_picture: z.string().nullable(),
});
export type GroupInfo = z.infer<typeof GroupInfoSchema>;

export const GroupRoomSchema = z.object({
  room: z.uuid(),
});
export type GroupRoom = z.infer<typeof GroupRoomSchema>;

export const GroupIdAndRoomParamsSchema = z.object({
  groupId: z.string(),
  room: z.uuid(),
});
export type GroupIdAndRoom = z.infer<typeof GroupIdAndRoomParamsSchema>;

export const GroupRoomsSchema = z.array(z.object({ room: z.uuid() }));
export type GroupRooms = z.infer<typeof GroupRoomsSchema>;

export const GroupPictureSchema = z.object({
  group_picture: z.string().nullable().or(z.null()),
});
export type GroupPicture = z.infer<typeof GroupPictureSchema>;

export const GroupDeletionStatusSchema = z.object({
  deleted_at: z.coerce.date(),
});
export type GroupDeletionStatus = z.infer<typeof GroupDeletionStatusSchema>;

export const GroupUpdatedAtSchema = z.object({ updated_at: z.coerce.date() });
export type GroupUpdatedAt = z.infer<typeof GroupUpdatedAtSchema>;

export const NewGroupMemberSchema = z.object({
  group_id: z.number(),
  id: z.number(),
  role: z.enum(['owner', 'admin', 'member']),
  joined_at: z.date(),
});
export type NewGroupMember = z.infer<typeof NewGroupMemberSchema>;

export const GroupMemberInfoSchema = z.object({
  group_id: z.coerce.number(),
  id: z.coerce.number(),
  username: z.string(),
  profile_picture: z.string().nullable(),
  role: z.enum(['owner', 'admin', 'member']),
  last_read_at: z.coerce.date().nullable(),
  deleted_at: z.coerce.date().nullable(),
});

export const AddGroupMembersSchema = z.object({
  addedMembers: z.array(
    z.object({
      userId: z.number(),
      username: z.string(),
      role: z.enum(['owner', 'admin', 'member']),
    }),
  ),
});

// TODO: Need to create a schema that checks that either groupId or room exists
export const GroupChatAuthParamsSchema = z
  .object({
    room: z.string().min(1).optional(),
    groupId: z.coerce.number().int().positive().optional(),
  })
  .refine((value) => value.room || value.groupId, {
    message: 'Either room or groupId is required',
  });

export const GroupIdSchema = z.object({
  groupId: z.string().trim().min(1),
});
export type GroupIdParamsDto = z.infer<typeof GroupIdSchema>;

export const RemoveKickedGroupMemberParamsSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
});
export type RemoveKickedGroupMemberParamsDto = z.infer<
  typeof RemoveKickedGroupMemberParamsSchema
>;

export const UpdateMemberRoleBodySchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});
export const UpdateMemberRoleParamsSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
});
export type UpdateMemberRoleBodyDto = z.infer<
  typeof UpdateMemberRoleBodySchema
>;
export type UpdateMemberRoleParamsDto = z.infer<
  typeof UpdateMemberRoleParamsSchema
>;

export const PermanentlyDeleteGroupParamsSchema = z.object({
  groupId: z.string(),
});
export type PermanentlyDeleteGroupParamsDto = z.infer<
  typeof PermanentlyDeleteGroupParamsSchema
>;

export const UpdateGroupPictureParamsSchema = z.object({
  groupId: z.string(),
});
export type UpdateGroupPictureParamsDto = z.infer<
  typeof UpdateGroupPictureParamsSchema
>;

export const UpdateLastReadStatusParamsSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
});
export type UpdateLastReadStatusParamsDto = z.infer<
  typeof UpdateLastReadStatusParamsSchema
>;

export const UpdateLastMessageIdBodySchema = z.object({
  messageId: z.number().nullable(),
});
export const UpdateLastMessageIdParamsSchema = z.object({
  room: z.string(),
});
