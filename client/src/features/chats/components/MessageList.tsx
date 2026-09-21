import { useContext, useEffect, useMemo, useState } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import { UserContext } from '../../../contexts/UserContext';
import { MessageContext } from '../../../contexts/MessageContext';
import { ChatContext } from '../../../contexts/ChatContext';
import { updateBlockList } from '../../../api/user-api';
import { updateReadStatus } from '../../../api/private-chat-api';
import { updateLastReadAt } from '../../../api/group-chat-api';
import ContactInfoModal from './ContactInfoModal';
import formatDate from '../../../utils/DateTimeFormat';
import type { GroupInfoWithMembers, GroupMember } from '../../../types/group';
import { MessageType, type Message, type ServerMessageDeleteEventPayload, type ServerMessageEditEventPayload } from '../../../types/message';
import { ChatType } from '../../../types/chat';
import type { UserProfileUpdate } from '../../../types/user';

interface MessageListProps {
  room: string;
  chatType: string;
  groupChatInfo: GroupInfoWithMembers;
  recipientUserId: number;
  hoveredIndex: number | null;
  setHoveredIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMessageId: React.Dispatch<React.SetStateAction<number | null>>;
  setMessageIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function MessageList({
  room,
  chatType,
  groupChatInfo,
  recipientUserId,
  hoveredIndex,
  setHoveredIndex,
  setIsEditModalOpen,
  setIsDeleteModalOpen,
  setMessageId,
  setMessageIndex,
}: MessageListProps) {
  const isPrivateChat = chatType === ChatType.PRIVATE;
  const isGroupChat = chatType === ChatType.GROUP;
  const socket = useSocket();

  const { recipientProfilePicture, chatName } = useContext(ChatContext);
  const { loggedInUsername, loggedInUserId, profilePicture } =
    useContext(UserContext);
  const { setMessages, setCurrentMessage, messageSearchValueText, filteredMessages } =
    useContext(MessageContext);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const groupId = groupChatInfo.info.chatId;
  const groupMembersInfo = groupChatInfo.members;

  useEffect(() => {
    if (!socket) return;

    socket.emit('open-chat', room);

    const handleMessage = async (messageData: Message): Promise<void> => {
      try {
        // Append message to UI only if the user is currently in the room where the message was sent
        if (room === messageData.room) {
          setMessages((prevMessages: Message[]) => {
            return prevMessages.concat(messageData);
          });
          // If a message is received while the user has the chat open, automatically mark the chat as read
          if (messageData.chatType === ChatType.PRIVATE) {
            await updateReadStatus(room);
          } else if (messageData.chatType === ChatType.GROUP) {
            await updateLastReadAt(groupId, loggedInUserId);
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      }
    };

    // Display all messages of a chat when opened
    const displayInitialMessages = (initialMessages: Message[]): void => {
      setMessages(initialMessages);
    };

    const handleMessageEdit = (messageEditEventPayload:
      ServerMessageEditEventPayload
    ): void => {
      if (messageEditEventPayload.room === room) {
        setMessages((prevMessages: Message[]) => {
          return prevMessages
            .map((message) => {
              if (message.id === messageEditEventPayload.messageId) {
                return { ...message, content: messageEditEventPayload.content, isEdited: true };
              } else {
                return message;
              }
            })
        });
      }
    };

    const handleMessageDelete = (messageDeleteEventPayload:
      ServerMessageDeleteEventPayload
    ): void => {
      if (messageDeleteEventPayload.room === room) {
        setMessages((prevMessages: Message[]) => {
          return prevMessages
            .filter(message => message.id !== messageDeleteEventPayload.messageId);
        });
      }
    };

    socket.on('chat-message', handleMessage);
    socket.on('initial-messages', displayInitialMessages);
    socket.on('message-edited', handleMessageEdit);
    socket.on('message-deleted', handleMessageDelete);

    return () => {
      socket.off('chat-message', handleMessage);
      socket.off('initial-messages', displayInitialMessages);
      socket.off('message-edited', handleMessageEdit);
      socket.off('message-deleted', handleMessageDelete);
    };
  }, [room, socket, setMessages, groupId, loggedInUserId]);

  // Build maps that associate users in the chat with their respective username and profile picture
  // These maps can then be used to retrieve a specific user's info for display in the message list
  const { profilePictureMap, usernameMap } = useMemo(() => {
    const profilePictureMap = new Map<number, string>();
    const usernameMap = new Map<number, string>();

    if (isGroupChat) {
      groupMembersInfo.forEach((member: GroupMember) => {
        profilePictureMap.set(
          member.id,
          member.profile_picture ?? '/images/default-avatar.jpg',
        );
        usernameMap.set(member.id, member.username);
      });
    }
    if (isPrivateChat) {
      profilePictureMap.set(
        loggedInUserId,
        profilePicture || '/images/default-avatar.jpg',
      );
      profilePictureMap.set(
        recipientUserId,
        recipientProfilePicture ?? '/images/default-avatar.jpg',
      );
      usernameMap.set(loggedInUserId, loggedInUsername);
      usernameMap.set(recipientUserId, chatName);
    }

    return { profilePictureMap, usernameMap };
  }, [
    isGroupChat,
    isPrivateChat,
    groupMembersInfo,
    loggedInUserId,
    profilePicture,
    recipientUserId,
    recipientProfilePicture,
    loggedInUsername,
    chatName,
  ]);

  // Update the profile picture and/or username of a user displayed in the message list in real-time when they change it
  useEffect(() => {
    if (!isGroupChat || !socket) return;

    const handleMemberProfilePictureUpdate = (
      data: UserProfileUpdate,
    ): void => {
      profilePictureMap.set(
        data.userId,
        data.newInfo || '/images/default-avatar.jpg',
      );
    };
    const handleMemberUsernameUpdate = (data: UserProfileUpdate): void => {
      usernameMap.set(data.userId, data.newInfo);
    };

    socket.on(
      'update-profile-picture-in-groups',
      handleMemberProfilePictureUpdate,
    );
    socket.on('update-username-in-groups', handleMemberUsernameUpdate);
    return () => {
      socket.off(
        'update-profile-picture-in-groups',
        handleMemberProfilePictureUpdate,
      );

      socket.off('update-username-in-groups', handleMemberUsernameUpdate);
    };
  }, [isGroupChat, profilePictureMap, socket, usernameMap]);

  const getChatMemberProfilePicture = (senderId: number): string => {
    return profilePictureMap.get(senderId) || '/images/default-avatar.jpg';
  };
  const getChatMemberUsername = (senderId: number): string | undefined => {
    return usernameMap.get(senderId);
  };

  return (
    <>
      {isModalOpen && (
        <ContactInfoModal
          recipientUserId={recipientUserId}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          updateBlockList={updateBlockList}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      )}

      <div className='chat-content-container'>
        <div className='messages-container'>
          <ul id='messages'>
            {messageSearchValueText && filteredMessages.length === 0 ? (
              <div id='no-messages-state'>No messages found</div>
            ) : (
              filteredMessages.map((messageData, index) => (
                <li
                  className='individual-message'
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className='message-container'>
                    {
                      <img
                        className='message-profile-picture'
                        src={getChatMemberProfilePicture(messageData.senderId)}
                        alt='Profile avatar'
                      />
                    }
                    <div className='message-metadata'>
                      <div className='message-details'>
                        <div
                          className={`message-from ${loggedInUserId !== messageData.senderId &&
                            isPrivateChat
                            ? 'clickable'
                            : ''
                            }`}
                          onClick={() =>
                            loggedInUserId !== messageData.senderId &&
                              isPrivateChat
                              ? setIsModalOpen(true)
                              : null
                          }
                        >
                          {getChatMemberUsername(messageData.senderId)}
                        </div>
                        <div className='message-time'>
                          {formatDate(messageData.eventTime)}
                        </div>
                        {hoveredIndex === index &&
                          loggedInUserId === messageData.senderId ? (
                          <div className='message-actions-button'>
                            {messageData.messageType === MessageType.TEXT ? (
                              <div
                                className='message-edit-button'
                                onClick={() => {
                                  setIsEditModalOpen(true);
                                  setMessageId(messageData.id);
                                  setMessageIndex(index);
                                  setCurrentMessage(messageData.content);
                                }}
                              >
                                Edit
                              </div>
                            ) : null}
                            <div
                              className='message-delete-button'
                              onClick={() => {
                                setIsDeleteModalOpen(true);
                                setMessageId(messageData.id);
                                setMessageIndex(index);
                              }}
                            >
                              Delete
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className='message-content-container'>
                        {messageData.messageType === MessageType.TEXT ? (
                          <div className='message-content'>
                            {messageData.content}
                          </div>
                        ) : (
                          <img
                            className='message-media-content'
                            src={messageData.content}
                          ></img>
                        )}
                        {messageData.isEdited ? (
                          <div className='message-edited-tag'>(edited)</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        {errorMessage ? (
          <div
            className='error-message'
            style={{ margin: '20px', textAlign: 'left' }}
          >
            {errorMessage}
          </div>
        ) : null}
      </div>
    </>
  );
}
