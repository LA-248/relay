import { z } from 'zod/v4';

export const UsernameSchema = z
  .string()
  .min(2, { message: 'Username must be between 2 and 30 characters' })
  .max(30, { message: 'Username must be between 2 and 30 characters' })
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  });

export const UserCredentialsSchema = z.object({
  username: UsernameSchema,
  password: z
    .string()
    .min(4, { message: 'Password must be between 4 and 100 characters' })
    .max(100, { message: 'Password must be between 4 and 100 characters' }),
});

export const InsertUserSchema = z.object({
  username: UsernameSchema,
  hashedPassword: z.string(),
});
export type InsertUser = z.infer<typeof InsertUserSchema>;

export const UserProfileSchema = z.object({
  id: z.coerce.number().positive(),
  username: z.string(),
  profile_picture: z.string().nullable(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UserEntitySchema = z.object({
  id: z.coerce.number().positive(),
  username: z.string(),
  hashed_password: z.string(),
  profile_picture: z.string().nullable(),
  blocked_users: z.array(z.number()),
});
export type UserEntity = z.infer<typeof UserEntitySchema>;

export const RecipientUserProfileSchema = z.object({
  id: z.coerce.number().positive(),
  username: z.string(),
  profile_picture: z.string().nullable(),
  blocked_users: z.array(z.number()),
});
export type RecipientUserProfile = z.infer<typeof RecipientUserProfileSchema>;

export const UserIdSchema = z.object({
  id: z.number(),
});
export type UserId = z.infer<typeof UserIdSchema>;

export const UserProfilePictureSchema = z.object({
  profile_picture: z.string().nullable(),
});
export type UserProfilePicture = z.infer<typeof UserProfilePictureSchema>;

export const UserBlockListSchema = z.object({
  blocked_users: z.array(z.number()),
});
export type UserBlockList = z.infer<typeof UserBlockListSchema>;

export const UserDataAuthSchema = z.object({
  id: z.coerce.number().positive(),
  username: z.string(),
  profile_picture: z.string().nullable(),
});

export const RetrieveRecipientProfileParamsSchema = z.object({
  room: z.uuid(),
});
export type RetrieveRecipientProfileParamsDto = z.infer<
  typeof RetrieveRecipientProfileParamsSchema
>;

export const RetrieveIdByUsernameParamsSchema = z.object({
  username: z.string(),
});
export type RetrieveIdByUsernameParamsDto = z.infer<
  typeof RetrieveIdByUsernameParamsSchema
>;

export const RetrieveUserProfilePictureParamsSchema = z.object({
  id: z.string(),
});

export const UploadProfilePictureParamsSchema = z.object({
  id: z.string(),
});

export const UpdateUsernameParamsSchema = z.object({
  username: z.string(),
});

export const UpdateBlockedUsersBodySchema = z.object({
  blockedUserIds: z.array(z.number()),
});
