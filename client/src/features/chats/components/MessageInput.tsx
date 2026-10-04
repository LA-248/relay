import { v4 as uuidv4 } from 'uuid';
import { useContext, useRef, useState } from 'react';
import { useMatch, useParams } from 'react-router-dom';
import { useSocket } from '../../../hooks/useSocket';
import { UserContext } from '../../../contexts/UserContext';
import { ChatContext } from '../../../contexts/ChatContext';
import {
  MessageType,
  type ClientMessageEventPayload,
} from '../../../types/message';
import { useSendMediaMessage } from '../hooks/useSendMediaMessage';
import useClearErrorMessage from '../../../hooks/useClearErrorMessage';
import { ChatType } from '../../../types/chat';

export default function MessageInput() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(
    null,
  ) as React.RefObject<HTMLFormElement>;
  const socket = useSocket();
  const { room } = useParams();
  const isPrivate = useMatch('/chats/:room') !== null;
  const chatType: ChatType = isPrivate ? ChatType.PRIVATE : ChatType.GROUP;

  const { chatId } = useContext(ChatContext);
  const { loggedInUsername, isBlocked } = useContext(UserContext);

  const [message, setMessage] = useState<string>('');
  // const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const username = loggedInUsername;
  const messageType = MessageType.TEXT;

  const handleChatMessageSubmission = (
    event: React.FormEvent<HTMLFormElement>,
  ): void => {
    event.preventDefault();
    if (message) {
      if (!socket || !room) return;
      const content = message;

      const messagePayload: ClientMessageEventPayload = {
        username,
        chatId,
        content,
        room,
        chatType,
        messageType,
      };

      const clientOffset = uuidv4(); // Compute a unique offset

      // Send the message and its metadata to the server
      socket.emit(
        'chat-message',
        messagePayload,
        clientOffset,
        (response: { success: boolean; message?: string; error?: string }) => {
          if (!response.success) {
            setErrorMessage(response.error ?? 'Unknown error');
          }
        },
      );
      setMessage('');
    }
  };

  // Handle media content
  const { handleFileInputClick, handleUpload } = useSendMediaMessage(
    fileInputRef,
    formRef,
    username,
    chatId,
    room!, // the route pattern chats/:room guarantees room exists at runtime
    chatType,
  );
  useClearErrorMessage(errorMessage, setErrorMessage);

  return (
    <div>
      <form id="message-form" action="" onSubmit={handleChatMessageSubmission}>
        {/* {showEmojiPicker ? (
          <div className='emoji-picker-container'></div>
        ) : null} */}

        <div
          className="error-message"
          style={{ marginBottom: '10px', textAlign: 'left' }}
        >
          {errorMessage}
        </div>

        <div className="message-input-container">
          <input
            id="message-input"
            type="text"
            placeholder={
              isBlocked
                ? 'You have this user blocked, unblock to message them'
                : 'Message'
            }
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isBlocked}
            autoFocus
          />
          <button
            type="button"
            className="media-upload-button"
            onClick={handleFileInputClick}
            disabled={isBlocked}
            style={{
              opacity: isBlocked ? '0.5' : undefined,
              cursor: isBlocked ? 'auto' : 'pointer',
            }}
          >
            Media
          </button>
          {/* <button
            type='button'
            className='emoji-picker-button'
            onClick={(event) => {
              event.stopPropagation();
              setShowEmojiPicker((value) => !value);
            }}
            disabled={isBlocked}
            style={{
              opacity: isBlocked ? '0.5' : undefined,
              cursor: isBlocked ? 'auto' : 'pointer',
            }}
          >
            Emojis
          </button> */}
          <button
            type="submit"
            className="submit-message-button"
            style={{
              opacity: isBlocked ? '0.5' : undefined,
              cursor: isBlocked ? 'auto' : 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </form>

      <form ref={formRef} id="media-upload-form" encType="multipart/form-data">
        <input
          ref={fileInputRef}
          type="file"
          name="media-upload"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
        ></input>
      </form>
    </div>
  );
}
