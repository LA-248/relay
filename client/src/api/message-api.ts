import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { ChatType } from '../types/chat';
import { MessageType, type ClientMessageEventPayload } from '../types/message';

export async function editMessage(
  chatType: string,
  chatId: number,
  newMessage: string,
  messageId: number
): Promise<void> {
  const type = determineChatType(chatType);

  const response = await fetch(
    `/api/chats/${type}/${chatId}/messages/${messageId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newMessage }),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }
}

export async function deleteMessage(
  chatType: string,
  chatId: number,
  messageId: number
): Promise<void> {
  const type = determineChatType(chatType);

  const response = await fetch(
    `/api/chats/${type}/${chatId}/messages/${messageId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }
}

export const uploadMedia = async (
  event: React.ChangeEvent<HTMLInputElement>,
  formRef: React.RefObject<HTMLFormElement>,
  socket: Socket,
  username: string,
  chatId: number,
  room: string,
  chatType: ChatType
): Promise<void> => {
  event.preventDefault();

  if (!socket) return;

  const type = determineChatType(chatType);

  // Use formData to package the file to then be sent to the server
  if (!formRef.current) return;
  const formData = new FormData(formRef.current);

  const loadingToast = toast.loading('Uploading media...', {
    duration: Infinity,
  });

  try {
    const response = await fetch(
      `/api/chats/${type}/${chatId}/media`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.error);
    }
    const data = await response.json();
    const content = data.fileName;
    const fileKey = data.fileKey;

    const messageType = MessageType.IMAGE;
    const clientOffset = uuidv4();

    const messagePayload: ClientMessageEventPayload =
      { username, chatId, content, room, chatType, messageType, fileKey };


    // TODO: Move this logic out of here
    socket.emit(
      'chat-message',
      messagePayload,
      clientOffset,
      (response: { success: boolean, message?: string, error?: string }) => {
        if (response.success) {
          toast.success(response.message);
          toast.dismiss(loadingToast);
        } else {
          toast.error(response.error);
          toast.dismiss(loadingToast);
        }
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      toast.dismiss(loadingToast);
      toast.error(error.message);
    }
  }
};

function determineChatType(chatType: string) {
  return chatType === ChatType.PRIVATE ? 'private' : 'group';
}
