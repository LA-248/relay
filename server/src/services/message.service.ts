import { Message as MessageRepository } from '../repositories/message.repository.ts';
import { FormattedMessage, Message, NewMessage } from '../schemas/message.schema.ts';
import { ChatType, S3AttachmentsStoragePath } from '../types/chat.ts';
import { MessageType } from '../types/message.ts';
import { setLastGroupMessage, updateGroupMemberLastReadAt } from './group.service.ts';
import { setLastMessage, updateLastReadAt } from './private-chat.service.ts';
import { createPresignedUrl, deleteS3Object } from './s3.service.ts';

export const editChatMessage = async (
  newMessage: string,
  senderId: number,
  messageId: number,
): Promise<void> => {
  const messageRepository = new MessageRepository();
  return await messageRepository.updateMessageContent(
    newMessage,
    senderId,
    messageId,
  );
};

export const deleteChatMessage = async (
  senderId: number,
  messageId: number,
  chatType: string,
  chatId: string,
): Promise<void> => {
  const messageRepository = new MessageRepository();
  const messageType = await messageRepository.findMessageType(messageId);
  const isImage = messageType === MessageType.IMAGE;

  // If the message being deleted is an image, delete the image in S3
  if (isImage) {
    const messageRepository = new MessageRepository();
    const fileName = await messageRepository.findMessageContent(
      senderId,
      messageId,
    );
    const objectKey = `${S3AttachmentsStoragePath.CHAT_ATTACHMENTS}/${chatType}/${chatId}/${fileName}`;
    await deleteS3Object(process.env.BUCKET_NAME!, objectKey);
  }

  return await messageRepository.deleteMessage(senderId, messageId);
};

export const upload = async (file: Express.MulterS3.File) => {
  return { fileKey: file.key, fileName: file.originalname };
};

export const saveMessageToDatabase = async (
  messageContent: string,
  senderId: number,
  chatId: number,
  room: string,
  chatType: ChatType,
  messageType: string,
  clientOffset: string,
): Promise<{ newMessage: NewMessage; updatedAt: Date }> => {
  let newMessage: NewMessage | undefined;

  try {
    const messageRepository = new MessageRepository();
    const isPrivateChat = chatType === ChatType.PRIVATE;
    const isGroupChat = chatType === ChatType.GROUP;

    newMessage = await messageRepository.insertNewMessage(
      messageContent,
      senderId,
      // Terrible hack to get past the foreign key constraint in the messages table
      // This error happens because the recipient id in the messages table references the users table.
      // When sending messages in a group chat, the group id is used as the recipient id which does not exist in the user's table
      // TODO: Create distinct tables for private and group chat messages
      isPrivateChat ? chatId : null,
      isGroupChat ? chatId : null,
      room,
      messageType,
      clientOffset,
    );

    // Retrieve the updated_at value of the newly inserted message - it's needed to correctly sort a user's chat list
    // The updated_at value differs from last_message_time in that it will always be populated with the date of the latest chat activity (e.g. message, chat creation, etc), whereas the last_message_time can be null if no messages exist in a chat
    const [updatedAt] = await Promise.all(
      isPrivateChat
        ? [
          setLastMessage(newMessage.id, room),
          updateLastReadAt(senderId, room)
        ] : [
          setLastGroupMessage(newMessage.id, room),
          updateGroupMemberLastReadAt(chatId, senderId)
        ]);

    return { newMessage, updatedAt };
  } catch (error) {
    // TODO: Use database transactions instead of manually deleting inserted messages when an error occurs
    if (newMessage) {
      const messageRepository = new MessageRepository();
      await messageRepository.deleteMessage(senderId, newMessage.id);
    }
    if (error instanceof Error) {
      if (
        error.message !== 'User is not authorised to send messages in this chat'
      ) {
        console.error(
          'Message with this client offset already exists:',
          clientOffset,
        );
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
};

export const findLastMessageInfo = async (room: string, chatType: ChatType) => {
  const messageRepository = new MessageRepository();
  const lastMessageInfo = await messageRepository.findLastMessageInfo(room);
  const isImage = lastMessageInfo?.type === MessageType.IMAGE;
  const isPrivateChat = chatType === ChatType.PRIVATE;

  const lastMessageContent = lastMessageInfo
    ? isImage
      ? 'Image'
      : lastMessageInfo.content
    : null;

  const lastMessageTime = lastMessageInfo
    ? lastMessageInfo.event_time
    : null;

  return { lastMessageContent, lastMessageTime, isPrivateChat };
}

export const formatMessage = async (
  message: Message,
): Promise<FormattedMessage> => {
  const recipientId = message.recipient_id;
  const groupId = message.group_id;

  const isGroup = recipientId === null ? true : false;
  const chatId = isGroup ? groupId : recipientId;
  const chatType = isGroup ? 'group' : 'private';
  const isImage = message.type === MessageType.IMAGE;

  const content = isImage
    ? await createPresignedUrl(
      process.env.BUCKET_NAME!,
      `${S3AttachmentsStoragePath.CHAT_ATTACHMENTS}/${chatType}/${chatId}/${message.content}`,
    )
    : message.content;

  return {
    from: message.sender_username,
    content,
    eventTime: message.event_time,
    id: message.id,
    senderId: message.sender_id,
    isEdited: message.is_edited,
    messageType: message.type,
  };
};
