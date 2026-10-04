import { useContext, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { Chat } from '../../../types/chat';
import { ChatContext } from '../../../contexts/ChatContext';

export default function useChatUpdates(
  socket: Socket | null,
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>,
  room: string,
) {
  const { setRecipientProfilePicture, setGroupPicture, setChatName } =
    useContext(ChatContext);

  useEffect(() => {
    if (!socket) return;

    // Update the picture of a group in the chat list for all its members in real-time
    const handleGroupPictureUpdate = (data: {
      groupPicture: string;
      room: string;
    }): void => {
      setChatList((prevChatList): Chat[] =>
        prevChatList.map((chat) =>
          chat.room === data.room
            ? { ...chat, chat_picture: data.groupPicture }
            : chat,
        ),
      );
      // Update other components where the data is also displayed, such as the contact header and chat info modal
      // Since these components exist in the chat view, only update them in real-time if the user currently has -
      // the chat where the update occurred open
      if (room === data.room) {
        setGroupPicture(data.groupPicture);
      }
    };

    // Update the profile picture of a private chat contact in the chat list when changed
    const handleProfilePictureUpdate = (data: {
      userId: number;
      newInfo: string;
      room: string;
    }): void => {
      setChatList((prevChatList): Chat[] =>
        prevChatList.map((chat) =>
          chat.recipient_user_id === data.userId
            ? { ...chat, chat_picture: data.newInfo }
            : chat,
        ),
      );
      // Update other components where the data is also displayed, such as the contact header and chat info modal
      // Since these components exist in the chat view, only update them in real-time if the user currently has -
      // the chat where the update occurred open
      if (room === data.room) {
        setRecipientProfilePicture(data.newInfo);
      }
    };

    // Update the username of a private chat contact in the chat list when changed
    const handleUsernameUpdate = (data: {
      userId: number;
      newInfo: string;
      room: string;
    }): void => {
      setChatList((prevChatList): Chat[] =>
        prevChatList.map((chat) =>
          chat.recipient_user_id === data.userId
            ? { ...chat, name: data.newInfo }
            : chat,
        ),
      );
      // Update other components where the data is also displayed, such as the contact header and chat info modal
      // Since these components exist in the chat view, only update them in real-time if the user currently has -
      // the chat where the update occurred open
      if (room === data.room) {
        setChatName(data.newInfo);
      }
    };

    socket.on('update-group-picture', handleGroupPictureUpdate);
    socket.on(
      'update-profile-picture-for-contacts',
      handleProfilePictureUpdate,
    );
    socket.on('update-username-for-contacts', handleUsernameUpdate);

    return () => {
      socket.off('update-group-picture', handleGroupPictureUpdate);
      socket.off(
        'update-profile-picture-for-contacts',
        handleProfilePictureUpdate,
      );
      socket.off('update-username-for-contacts', handleUsernameUpdate);
    };
  }, [
    socket,
    setChatList,
    room,
    setChatName,
    setGroupPicture,
    setRecipientProfilePicture,
  ]);
}
