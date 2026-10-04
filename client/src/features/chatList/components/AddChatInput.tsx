import { useCallback, useState } from 'react';
import { addChat } from '../../../api/private-chat-api';
import useClearErrorMessage from '../../../hooks/useClearErrorMessage';
import type { Chat } from '../../../types/chat';

interface AddChatInputProps {
  chatList: Chat[];
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}

export default function AddChatInput({
  chatList,
  setChatList,
  errorMessage,
  setErrorMessage,
}: AddChatInputProps) {
  const [inputUsername, setInputUsername] = useState<string>('');

  // Adds a new chat to the sidebar
  const handleAddChat = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        const exists = chatList.some(
          (chat) => chat.name === inputUsername && !chat.deleted_at,
        );
        if (exists) {
          throw new Error('You already have an active chat with this user');
        }
        if (!inputUsername) {
          throw new Error('Please enter a username');
        }

        const addedChat = await addChat(inputUsername);
        setChatList((prevChatList) => {
          let updatedList: Chat[];

          // Only append the new chat to the list if it does not already exist
          if (
            !prevChatList.some((chat) => chat.chat_id === addedChat.chat_id)
          ) {
            updatedList = [addedChat, ...prevChatList];
          } else {
            // If it does already exist, just set deleted_at to null
            updatedList = prevChatList.map((chat) => {
              if (chat.chat_id === addedChat.chat_id) {
                return { ...chat, deleted_at: null };
              }
              return chat;
            });
          }
          // Sorting must be done here for when chats are restored,
          // since a re-added chat might not be the most recently updated one
          return updatedList.sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          );
        });
        setInputUsername('');
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      }
    },
    [chatList, setChatList, inputUsername, setErrorMessage],
  );

  useClearErrorMessage(errorMessage, setErrorMessage);

  return (
    <div className="username-form-container">
      <form id="username-form" action="" onSubmit={handleAddChat}>
        <div className="username-input-container">
          <input
            id="username-input"
            type="text"
            placeholder="Start a conversation"
            value={inputUsername}
            onChange={(event) => {
              setInputUsername(event.target.value);
              setErrorMessage('');
            }}
          />
          <button
            className="start-chat-button"
            style={{
              marginLeft: '10px',
              opacity:
                inputUsername.trim().length === 0 || inputUsername.includes(' ')
                  ? '0.4'
                  : undefined,
              cursor:
                inputUsername.trim().length === 0 || inputUsername.includes(' ')
                  ? 'auto'
                  : undefined,
            }}
            disabled={
              inputUsername.trim().length === 0 || inputUsername.includes(' ')
            }
          >
            Start chat
          </button>
        </div>
        {errorMessage && (
          <div className="error-message" style={{ marginTop: '20px' }}>
            {errorMessage}
          </div>
        )}
      </form>
    </div>
  );
}
