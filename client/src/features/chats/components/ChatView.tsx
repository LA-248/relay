import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useSocket } from '../../../hooks/useSocket';
import { useSocketErrorHandling } from '../../../hooks/useSocketErrorHandling';
import ContactHeader from './ContactHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DeleteMessageModal from './DeleteMessageModal';
import EditMessageModal from './EditMessageModal';
import useFetchPrivateChatInfo from '../hooks/useFetchPrivateChatInfo';
import useFetchGroupChatInfo from '../../groups/hooks/useFetchGroupChatInfo';

function ChatView() {
  const location = useLocation();
  // Extract chat type from URL path
  const pathSegments = location.pathname.split('/');
  const chatType = pathSegments[1];

  const { room } = useParams();
  const socket = useSocket();
  const [messageId, setMessageId] = useState<number | null>(null);
  const [messageIndex, setMessageIndex] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const privateChatInfo = useFetchPrivateChatInfo(
    room!, // the route pattern chats/:room guarantees room exists at runtime
    chatType,
    setErrorMessage,
  );
  const groupChatInfo = useFetchGroupChatInfo(room!, chatType, setErrorMessage);

  useSocketErrorHandling(socket, setErrorMessage);

  return (
    <div className="chat-view-container">
      <ContactHeader
        room={room!}
        chatType={chatType}
        privateChatInfo={privateChatInfo}
        groupChatInfo={groupChatInfo}
      />

      <MessageList
        room={room!}
        chatType={chatType}
        groupChatInfo={groupChatInfo}
        recipientUserId={Number(privateChatInfo.userId)}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
        setIsEditModalOpen={setIsEditModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        setMessageId={setMessageId}
        setMessageIndex={setMessageIndex}
      />

      <div className="message-form-container">
        <MessageInput key={room} />
      </div>

      <DeleteMessageModal
        chatType={chatType}
        messageId={messageId}
        messageIndex={messageIndex}
        isModalOpen={isDeleteModalOpen}
        setIsModalOpen={setIsDeleteModalOpen}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />

      <EditMessageModal
        chatType={chatType}
        messageId={messageId}
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModalOpen}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
}

export { ChatView };
