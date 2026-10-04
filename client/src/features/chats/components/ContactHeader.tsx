import { useContext, useEffect, useState } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import useMembersListUpdate from '../../groups/hooks/useMembersListUpdate';

import { ChatContext } from '../../../contexts/ChatContext';
import { MessageContext } from '../../../contexts/MessageContext';
import { UserContext } from '../../../contexts/UserContext';

import { getBlockList, updateBlockList } from '../../../api/user-api';
import { ChatType } from '../../../types/chat';
import type { UserInfo } from '../../../types/user';
import type { GroupInfoWithMembers } from '../../../types/group';
import MessageSearch from './MessageSearch';
import ContactInfoModal from './ContactInfoModal';
import GroupInfoModal from '../../groups/components/GroupInfoModal';
import useClearErrorMessage from '../../../hooks/useClearErrorMessage';
import AddGroupMembers from '../../groups/components/AddGroupMembers';
import LocalPhoneRoundedIcon from '@mui/icons-material/LocalPhoneRounded';

interface ContactHeaderProps {
  room: string;
  chatType: string;
  privateChatInfo: UserInfo;
  groupChatInfo: GroupInfoWithMembers;
}

export default function ContactHeader({
  room,
  chatType,
  privateChatInfo,
  groupChatInfo,
}: ContactHeaderProps) {
  const isPrivateChat = chatType === ChatType.PRIVATE;
  const isGroupChat = chatType === ChatType.GROUP;

  const {
    setChatId,
    recipientProfilePicture,
    setRecipientProfilePicture,
    groupPicture,
    setGroupPicture,
    chatName,
    setChatName,
    membersList,
    setMembersList,
    setActiveChatRoom,
  } = useContext(ChatContext);
  const socket = useSocket();
  const { messages, setFilteredMessages } = useContext(MessageContext);
  const { loggedInUsername, loggedInUserId, setIsBlocked } =
    useContext(UserContext);

  const [recipientUserId, setRecipientUserId] = useState<number>(0);
  const [isChatInfoModalOpen, setIsChatInfoModalOpen] =
    useState<boolean>(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useClearErrorMessage(errorMessage, setErrorMessage);

  // Handle setting the contact header and modal info of a private chat
  useEffect(() => {
    if (!isPrivateChat) return;

    const handlePrivateChatInfo = async (): Promise<void> => {
      try {
        const blockList = await getBlockList();
        const recipientId = privateChatInfo.userId;
        if (typeof recipientId === 'number') {
          setRecipientUserId(recipientId);
          setIsBlocked(blockList.includes(recipientId));
          setChatId(recipientId);
        }
        const contactProfilePicture = privateChatInfo.profilePicture;
        const contactUsername = privateChatInfo.username;

        setRecipientProfilePicture(contactProfilePicture);
        setChatName(contactUsername);
        setActiveChatRoom(room);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      }
    };

    handlePrivateChatInfo();
  }, [
    room,
    chatType,
    privateChatInfo,
    isPrivateChat,
    setIsBlocked,
    setChatId,
    setChatName,
    setRecipientProfilePicture,
    setActiveChatRoom,
  ]);

  // Handle setting the contact header and modal info (members list, group picture, etc) of a group chat
  useEffect(() => {
    if (!isGroupChat) return;

    const handleGroupChatInfo = async (): Promise<void> => {
      try {
        const groupId = groupChatInfo.info.chatId;
        const groupChatPicture = groupChatInfo.info.groupPicture;
        const groupMembersList = groupChatInfo.members;
        const groupName = groupChatInfo.info.name;

        setChatId(groupId);
        setGroupPicture(groupChatPicture);
        setMembersList(groupMembersList);
        setChatName(groupName);
        setActiveChatRoom(room);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      }
    };

    handleGroupChatInfo();
  }, [
    isGroupChat,
    groupChatInfo,
    room,
    setActiveChatRoom,
    setChatId,
    setChatName,
    setGroupPicture,
    setMembersList,
  ]);

  useMembersListUpdate(socket, setMembersList);

  return (
    <div>
      <div className="contact-header-container">
        <div className="contact-header">
          <div className="picture-and-name">
            <img
              className="chat-pic"
              src={
                (isPrivateChat ? recipientProfilePicture : groupPicture) ||
                '/images/default-avatar.jpg'
              }
              alt="Profile avatar"
              style={{ height: '35px', width: '35px' }}
            ></img>
            <div>
              <div
                className="chat-name-contact-header"
                onClick={() => setIsChatInfoModalOpen(true)}
              >
                {chatName}
              </div>
              {isGroupChat && groupChatInfo.members ? (
                <div className="group-member-list">
                  {membersList
                    .map((member) => {
                      return loggedInUsername === member.username
                        ? 'You'
                        : member.username;
                    })
                    .join(', ')}
                </div>
              ) : null}
            </div>
          </div>

          <div className="chat-action-buttons">
            {isPrivateChat ? (
              <button className="start-voice-call-button">
                <LocalPhoneRoundedIcon fontSize="medium"></LocalPhoneRoundedIcon>
              </button>
            ) : null}

            {isGroupChat ? (
              <button
                className="add-group-members-button"
                onClick={() => setIsAddMembersModalOpen(true)}
              >
                Add members
              </button>
            ) : null}
            <MessageSearch
              messages={messages}
              setFilteredMessages={setFilteredMessages}
            />
          </div>
        </div>
      </div>

      <AddGroupMembers
        isModalOpen={isAddMembersModalOpen}
        setIsModalOpen={setIsAddMembersModalOpen}
        groupId={groupChatInfo.info.chatId}
        loggedInUsername={loggedInUsername}
        loggedInUserId={loggedInUserId}
      />

      {isChatInfoModalOpen && chatType === ChatType.PRIVATE && (
        <ContactInfoModal
          recipientUserId={recipientUserId}
          isModalOpen={isChatInfoModalOpen}
          setIsModalOpen={setIsChatInfoModalOpen}
          updateBlockList={updateBlockList}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {isChatInfoModalOpen && chatType === ChatType.GROUP && (
        <GroupInfoModal
          group={groupChatInfo}
          membersList={membersList}
          loggedInUserId={loggedInUserId}
          loggedInUsername={loggedInUsername}
          isModalOpen={isChatInfoModalOpen}
          setIsModalOpen={setIsChatInfoModalOpen}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
    </div>
  );
}
