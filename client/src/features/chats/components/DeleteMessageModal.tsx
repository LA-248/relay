import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { deleteMessage } from '../../../api/message-api';
import { useSocket } from '../../../hooks/useSocket';
import { MessageContext } from '../../../contexts/MessageContext';
import { updateLastMessageId } from '../../../api/private-chat-api';
import { updateLastGroupMessageId } from '../../../api/group-chat-api';
import Modal from '../../../components/ModalTemplate';
import { ChatType } from '../../../types/chat';
import { ChatContext } from '../../../contexts/ChatContext';
import type { ClientMessageDeleteEventPayload } from '../../../types/message';

interface DeleteMessageModalProps {
  chatType: string;
  messageId: number | null;
  messageIndex: number | null;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}

export default function DeleteMessageModal({
  chatType,
  messageId,
  messageIndex,
  isModalOpen,
  setIsModalOpen,
  errorMessage,
  setErrorMessage,
}: DeleteMessageModalProps) {
  const socket = useSocket();
  const { room } = useParams();
  const { filteredMessages } = useContext(MessageContext);
  const { chatId } = useContext(ChatContext);

  const handleMessageDelete = async (
    messageId: number | null,
    messageIndex: number | null,
  ): Promise<void> => {
    try {
      if (!socket || !room || messageId === null) return;

      const messageList = [...filteredMessages];
      const isLastMessage = messageIndex === messageList.length - 1;

      if (messageId && chatId) {
        await deleteMessage(chatType, chatId, messageId);
      }

      // Update chat list in real-time after most recent message is deleted
      // If last remaining message is deleted, ensure last message id in private chat table is null
      if (messageList.length === 1) {
        if (chatType === ChatType.PRIVATE) {
          await updateLastMessageId(null, room);
        } else {
          await updateLastGroupMessageId(null, room);
        }
        socket.emit('last-message-updated', { room, chatType });
      }
      if (isLastMessage && messageList.length > 1) {
        const newLastMessageIndex = messageList.length - 2;
        const newLastMessageId = messageList[newLastMessageIndex].id;

        // Update the private or group chat table to reflect the correct ID of the last sent message after deletion
        if (chatType === ChatType.PRIVATE) {
          await updateLastMessageId(newLastMessageId, room);
        } else {
          await updateLastGroupMessageId(newLastMessageId, room);
        }

        socket.emit('last-message-updated', { room, chatType });
      }

      const messageDeletePayload: ClientMessageDeleteEventPayload =
        { messageId, room };
      socket.emit('message-deleted', messageDeletePayload);

      setIsModalOpen(false);
    } catch (error) {
      setIsModalOpen(true);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <>
      <Modal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      >
        <div className='modal-heading'>Delete message</div>
        <div className='modal-subtext'>
          Are you sure you want to delete this message? It will be deleted for
          everyone.
        </div>

        <div className='modal-action-buttons-container'>
          <button
            className='confirm-action-button'
            style={{ backgroundColor: 'red' }}
            onClick={() => handleMessageDelete(messageId, messageIndex)}
          >
            Delete
          </button>

          <button
            className='close-modal-button'
            onClick={() => {
              setIsModalOpen(false);
            }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </>
  );
}
