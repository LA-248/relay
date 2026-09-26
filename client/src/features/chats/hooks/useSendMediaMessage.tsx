import type { ChangeEvent } from 'react';
import { uploadMedia } from '../../../api/message-api';
import { useSocket } from '../../../hooks/useSocket';
import type { ChatType } from '../../../types/chat';

export function useSendMediaMessage(
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  formRef: React.RefObject<HTMLFormElement>,
  username: string,
  chatId: number,
  room: string,
  chatType: ChatType,
) {
  const socket = useSocket();

  // Use the reference to the file picker input to open it when clicking on the upload button
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (socket) {
      uploadMedia(
        event,
        formRef,
        socket,
        username,
        chatId,
        room,
        chatType,
      );
    }
  };

  return { handleFileInputClick, handleUpload };
}
