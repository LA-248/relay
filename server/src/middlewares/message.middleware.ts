import { NextFunction, Request, Response } from 'express';
import { Message } from '../repositories/message.repository.ts';
import { User } from '../repositories/user.repository.ts';
import { MessageType } from '../types/message.ts';

export const authoriseMessageDeletion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestingUserId = Number(req.user?.id);
  const messageId = Number(req.params.messageId);

  try {
    const messageRepository = new Message();
    const { messageSenderId } = await messageRepository.findMessageSenderId(
      messageId
    );

    if (messageSenderId !== requestingUserId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own messages',
      });
      return;
    }
    return next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      redirectPath: '/',
    });
  }
};

export const enforceMessageEditRules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const messageId = Number(req.params.messageId);

  try {
    const messageRepository = new Message();
    const messageType = await messageRepository.findMessageType(messageId);

    if (messageType === MessageType.IMAGE) {
      res.status(409).json({
        error: 'Action not supported',
        message: 'Editing images is not supported',
      });
      return;
    }
    return next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      redirectPath: '/',
    });
  }
};

export const isSenderBlocked = async (
  recipientId: number,
  senderId: number
): Promise<void> => {
  const userRepository = new User();
  const result = await userRepository.findBlockListById(recipientId);
  const recipientBlockList = result.blocked_users;

  if (recipientBlockList) {
    if (recipientBlockList.includes(senderId)) {
      throw new Error('Sender is blocked by the recipient');
    }
  }
};
