import { Server } from 'socket.io';
import { Group } from '../repositories/group.repository.ts';
import { PrivateChat } from '../repositories/private-chat.repository.ts';
import { User } from '../repositories/user.repository.ts';
import {
  RecipientUserProfile,
  UserBlockList,
  UserId,
  UserProfile,
} from '../schemas/user.schema.ts';
import { S3AvatarStoragePath } from '../types/chat.ts';
import { createPresignedUrl, deleteS3Object } from './s3.service.ts';

export const createProfilePictureUrl = async (
  userId: number,
  profilePicture: string,
): Promise<string> => {
  return await createPresignedUrl(
    process.env.BUCKET_NAME!,
    `${S3AvatarStoragePath.USER_AVATARS}/${userId}/${profilePicture}`,
  )
};

export const retrieveRecipientData = async (
  userId: number,
  room: string,
): Promise<{
  recipient: RecipientUserProfile;
  profilePictureUrl: string | null;
} | null> => {
  const userRepository = new User();
  const recipient = await userRepository.findRecipientUserProfileById(
    userId,
    room,
  );
  if (!recipient) return null;

  const profilePictureUrl = recipient.profile_picture
    ? await createPresignedUrl(
      process.env.BUCKET_NAME!,
      `${S3AvatarStoragePath.USER_AVATARS}/${recipient.id}/${recipient.profile_picture}`,
    )
    : null;

  return { recipient, profilePictureUrl };
};

export const retrieveUserById = async (id: number): Promise<UserProfile> => {
  try {
    const userRepository = new User();
    const user = await userRepository.findUserById(id);
    if (!user) {
      console.log(
        'User does not exist. Make sure that the username is correct.',
      );
      throw new Error(
        'User does not exist. Make sure that the username is correct.',
      );
    }

    const userId = user.id;
    const username = user.username;

    const profilePictureUrl = user.profile_picture
      ? await createPresignedUrl(
        process.env.BUCKET_NAME!,
        `${S3AvatarStoragePath.USER_AVATARS}/${userId}/${user.profile_picture}`,
      )
      : null;

    return { id: userId, username, profile_picture: profilePictureUrl };
  } catch (error) {
    console.error('Error retrieving user data:', error);
    throw error;
  }
};

export const retrieveUserIdByUsername = async (
  username: string,
): Promise<UserId> => {
  const userRepository = new User();
  const userId = await userRepository.findUserIdByUsername(username);

  if (!userId) {
    console.log('User does not exist. Make sure that the username is correct.');
    throw new Error(
      'User does not exist. Make sure that the username is correct.',
    );
  }

  return userId;
};

export const retrieveProfilePicture = async (userId: number) => {
  const userRepository = new User();
  const result = await userRepository.findUserProfilePictureById(userId);
  const profilePicture = result.profile_picture;

  return profilePicture
    ? await createProfilePictureUrl(userId, profilePicture)
    : null;
};

export const retrieveBlockList = async (
  userId: number,
): Promise<UserBlockList> => {
  const userRepository = new User();
  return await userRepository.findBlockListById(userId);
};

export const updateProfilePicture = async (
  userId: number,
  file: Express.MulterS3.File,
  io: Server,
): Promise<string> => {
  const userRepository = new User();

  // Delete previous profile picture from S3 storage
  const { profile_picture } =
    await userRepository.findUserProfilePictureById(userId);
  const currentProfilePicture = profile_picture;

  if (currentProfilePicture !== null) {
    // Only run if a current profile picture exists
    await deleteS3Object(
      process.env.BUCKET_NAME!,
      `${S3AvatarStoragePath.USER_AVATARS}/${userId}/${currentProfilePicture}`,
    );
  }

  const [profilePictureUrl] = await Promise.all([
    createPresignedUrl(process.env.BUCKET_NAME!, file.key),
    userRepository.updateProfilePictureById(file.originalname, userId),
  ]);

  await Promise.all([
    updateUserInfoForAllContacts(
      userId,
      io,
      profilePictureUrl,
      'update-profile-picture-for-contacts',
    ),
    updateUserInfoInAllGroups(
      userId,
      io,
      profilePictureUrl,
      'update-profile-picture-in-groups',
    ),
  ]);

  return profilePictureUrl;
};

export const handleUsernameUpdate = async (
  username: string,
  userId: number,
  io: Server,
): Promise<void> => {
  const userRepository = new User();

  await Promise.all([
    userRepository.updateUsernameById(username, userId),
    updateUserInfoForAllContacts(
      userId,
      io,
      username,
      'update-username-for-contacts',
    ),
    updateUserInfoInAllGroups(
      userId,
      io,
      username,
      'update-username-in-groups',
    ),
  ]);

  return;
};

export const updateUserBlockList = async (
  blockedUserIds: number[],
  userId: number,
): Promise<void> => {
  const userRepository = new User();
  return await userRepository.updateBlockedUsersById(blockedUserIds, userId);
};

// Update profile picture or username for all the user's private chats in real-time
const updateUserInfoForAllContacts = async (
  userId: number,
  io: Server,
  newInfo: string,
  socketEvent: string,
): Promise<void> => {
  const privateChatRepository = new PrivateChat();
  const rooms = await privateChatRepository.findAllRoomsByUser(userId);

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i].room;
    if (room) {
      io.to(room).emit(socketEvent, {
        userId,
        newInfo,
        room,
      });
    }
  }
};

// Update profile picture or username in all groups the user is a member of in real-time
const updateUserInfoInAllGroups = async (
  userId: number,
  io: Server,
  newInfo: string,
  socketEvent: string,
): Promise<void> => {
  const groupRepository = new Group();
  const rooms = await groupRepository.findAllGroupsByUser(userId);

  for (let i = 0; i < rooms.length; i++) {
    const { room } = rooms[i];
    if (room) {
      io.to(room).emit(socketEvent, {
        userId,
        newInfo,
        room,
      });
    }
  }
};
