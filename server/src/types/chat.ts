import { MessageType } from './message.ts';

export type ChatDto = {
  id: string;
  picture: string | null;
  type: ChatType;
  recipient_user_id: number | null;
  name: string;
  room: string;
  last_message_content: string | null;
  last_message_id: number | null;
  last_message_time: Date | null;
  last_message_type: MessageType;
  last_read_at: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type InsertedChat = {
  id: number;
  type: ChatType;
  room: string;
  created_at: Date;
  updated_at: Date;
  last_message_at: Date | null;
  last_message_id: number | null;
  name: string | null;
  picture: string | null;
};

export type ChatInsertionMetadata = {
  type: string;
  room: string;
  name: string;
  picture: string | null;
};

export type ChatRoom = {
  room: string | null;
};

export enum ChatType {
  PRIVATE = 'chats',
  GROUP = 'groups',
}

export enum NewChatType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export enum S3AvatarStoragePath {
  USER_AVATARS = 'avatars/users',
  GROUP_AVATARS = 'avatars/groups',
}

export enum S3AttachmentsStoragePath {
  CHAT_ATTACHMENTS = 'attachments/chats',
}

export enum MulterUploadField {
  USER_AVATAR = 'profile-picture',
  GROUP_PICTURE = 'group-picture',
  MEDIA_UPLOAD = 'media-upload',
}
