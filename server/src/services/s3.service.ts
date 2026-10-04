import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { ChatDto, ChatType, S3AvatarStoragePath } from '../types/chat.ts';

if (!process.env.AWS_REGION || !process.env.BUCKET_NAME) {
  throw new Error('Missing AWS configuration environment variables');
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export const createS3Uploader = ({
  id,
  storagePathPrefix,
  maxFileSize = 10 * 1024 * 1024,
}: {
  id: string;
  storagePathPrefix: string;
  maxFileSize?: number;
}) =>
  multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.BUCKET_NAME!,
      cacheControl: 'max-age=31536000', // Cache the uploaded image - reducing the need to re-fetch it from the database
      metadata: function (_req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (_req: Request, file, cb) {
        const fileName = file.originalname;
        const storagePath = `${storagePathPrefix}/${id}/${fileName}`;
        cb(null, storagePath);
      },
    }),
    limits: { fileSize: maxFileSize },
  });

// Delete object from S3 bucket
export const deleteS3Object = async (
  bucket: string,
  key: string,
): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await s3Client.send(command);
    return console.log('Object deleted successfully:', response);
  } catch (error) {
    // Only log the error, no need to throw it, as the user experience is not affected if the S3 deletion fails
    return console.error('Error deleting object from S3:', error);
  }
};

// Delete a directory and its contents
export async function deleteS3Directory(
  bucket: string,
  prefix: string,
): Promise<void> {
  const directoryObjects = await s3Client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
  );

  if (!directoryObjects.Contents || directoryObjects.Contents.length < 0) {
    return;
  }

  const deleteParams = {
    Bucket: bucket,
    Delete: {
      Objects: directoryObjects.Contents.map((object) => ({
        Key: object.Key,
      })),
    },
  };

  await s3Client.send(new DeleteObjectsCommand(deleteParams));
  console.log(`Successfully deleted directory ${prefix} and its contents`);
}

// Create a presigned S3 URL for temporary access to the object
export const createPresignedUrl = (
  bucket: string,
  key: string,
): Promise<string> => {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3Client, command, { expiresIn: 604800 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Error creating presigned S3 URL: ${error.message}`);
    }
    throw new Error('Unknown error creating presigned S3 URL');
  }
};

// For each chat in the chat list, generate a presigned S3 url using the recipient's profile picture file name
// This url is required to display the recipient's profile picture in the chat list
export const generateChatListPresignedUrls = async (
  chatList: ChatDto[],
): Promise<ChatDto[]> => {
  try {
    const results = await Promise.allSettled(
      chatList.map(async (chat) => {
        if (!chat.chat_picture) {
          return null;
        }

        const isPrivateChat = chat.chat_type === ChatType.PRIVATE;
        const objectKey = buildAvatarObjectKey(chat, isPrivateChat);

        const presignedUrl = createPresignedUrl(
          process.env.BUCKET_NAME!,
          objectKey,
        );
        return presignedUrl;
      }),
    );

    const updatedChatList = results.map((result, index) => {
      const chat = chatList[index];

      if (result.status === 'fulfilled') {
        return { ...chat, chat_picture: result.value };
      } else {
        console.error('Error loading profile picture:', result.reason);
        return { ...chat, chat_picture: null };
      }
    });

    return updatedChatList;
  } catch (error) {
    // An unexpected picture processing error shouldn't prevent the entire chat list from being rendered
    // This handles unexpected errors gracefully by still rendering the chat list but setting all chat pictures to null
    console.error('Unexpected error generating chat picture URLs:', error);

    return chatList.map((chat) => ({
      ...chat,
      chat_picture: null,
    }));
  }
};

function buildAvatarObjectKey(chat: ChatDto, isPrivateChat: boolean) {
  if (isPrivateChat) {
    const fileName = chat.chat_picture;
    const recipientId = chat.recipient_user_id;
    return `${S3AvatarStoragePath.USER_AVATARS}/${recipientId}/${fileName}`;
  } else {
    // Chat IDs used in the chat list constructed for the frontend are given prefixes to differentiate -
    // between private and group chats (e.g. p_1, g_4), so to get the group ID -
    // we need to transform it so only the number is left, which can then be used in the S3 path
    const groupId = chat.chat_id.split('_').pop();
    const fileName = chat.chat_picture;
    return `${S3AvatarStoragePath.GROUP_AVATARS}/${groupId}/${fileName}`;
  }
}
