import { Request, RequestHandler, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ApiErrorResponse } from '../dtos/error.dto.ts';
import {
  RetrieveIdByUsernameResponseDto,
  RetrieveLoggedInUserDataResponseDto,
  RetrieveRecipientProfileNotFoundResponseDto,
  RetrieveRecipientProfileResponseDto,
} from '../dtos/user.dto.ts';
import {
  RetrieveIdByUsernameParamsDto,
  RetrieveRecipientProfileParamsDto,
} from '../schemas/user.schema.ts';
import {
  createProfilePictureUrl,
  handleUsernameUpdate,
  findBlockList,
  findProfilePicture,
  findRecipientData,
  findUserIdByUsername,
  updateProfilePicture,
  updateUserBlockList,
} from '../services/user.service.ts';

export const getLoggedInUserData: RequestHandler<
  ParamsDictionary,
  RetrieveLoggedInUserDataResponseDto | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const profilePicture = req.user?.profile_picture;
    const userId = Number(req.user?.id);
    const username = String(req.user?.username);

    const profilePictureUrl = profilePicture
      ? await createProfilePictureUrl(
        userId,
        profilePicture,
      )
      : null;

    res.status(200).json({
      userId,
      username,
      profilePicture: profilePictureUrl,
    });
  } catch (error) {
    console.error('Error retrieving data of logged in user:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const getRecipientProfile: RequestHandler<
  RetrieveRecipientProfileParamsDto,
  | RetrieveRecipientProfileResponseDto
  | RetrieveRecipientProfileNotFoundResponseDto
  | ApiErrorResponse,
  void
> = async (req, res) => {
  try {
    const result = await findRecipientData(
      Number(req.user?.id),
      req.params.room,
    );

    if (!result || !result.recipient) {
      console.error('User not found');
      res.status(404).json({ redirectPath: '/' });
      return;
    }

    const { recipient, profilePictureUrl } = result;

    res.status(200).json({
      userId: recipient.id,
      username: recipient.username,
      profilePicture: profilePictureUrl,
    });
  } catch (error) {
    console.error('Error retrieving recipient user data', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

export const getUserIdByUsername: RequestHandler<
  RetrieveIdByUsernameParamsDto,
  RetrieveIdByUsernameResponseDto | ApiErrorResponse
> = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await findUserIdByUsername(username);
    if (!user) {
      throw new Error(
        'User does not exist. Make sure that the username is correct.',
      );
    }
    res.status(200).json({ userId: user.id });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        'User does not exist. Make sure that the username is correct.'
      ) {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    console.error('Error retrieving user ID:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const getUserProfilePicture = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = Number(req.params.id);
    const profilePictureUrl = await findProfilePicture(userId);

    res.status(200).json({ profilePicture: profilePictureUrl });
  } catch (error) {
    console.error('Error retrieving user profile picture:', error);
    res.status(500).json({ error: 'Error retrieving user profile picture' });
  }
};

export const getBlockListById = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const result = await findBlockList(userId);
    res.status(200).json({ blockList: result.blocked_users });
  } catch (error) {
    console.error('Error retrieving block list:', error);
    res.status(500).json({ error: 'Error retrieving blocked status' });
  }
};

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const file = req.file as Express.MulterS3.File;
    const io = req.app.get('io');

    const profilePictureUrl = await updateProfilePicture(userId, file, io);
    res.status(200).json({ fileUrl: profilePictureUrl });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res
      .status(500)
      .json({ error: 'Error uploading profile picture. Please try again.' });
  }
};

export const updateUsername = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const io = req.app.get('io');
    const username = req.body.username;

    await handleUsernameUpdate(username, userId, io);
    res.status(200).json({ success: 'Username updated successfully' });
  } catch (error) {
    console.error('Error updating username:', error);
    res
      .status(500)
      .json({ error: 'Error updating username. Please try again.' });
  }
};

// Update a user's list of blocked users
export const updateBlockedUsers = async (req: Request, res: Response) => {
  try {
    const blockedUserIds = req.body.blockedUserIds;
    const userId = Number(req.user?.id);

    await updateUserBlockList(blockedUserIds, userId);
    res.status(200).json({ success: 'Block list successfully updated' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Error blocking user. Please try again.' });
  }
};
