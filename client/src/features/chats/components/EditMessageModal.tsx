import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { MessageContext } from '../../../contexts/MessageContext';
import { editMessage } from '../../../api/message-api';
import { useSocket } from '../../../hooks/useSocket';
import Modal from '../../../components/ModalTemplate';
import { ChatContext } from '../../../contexts/ChatContext';
import type { ClientMessageEditEventPayload } from '../../../types/message';

interface EditMessageModalProps {
  chatType: string;
  messageId: number | null;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}

export default function EditMessageModal({
  chatType,
  messageId,
  isModalOpen,
  setIsModalOpen,
  errorMessage,
  setErrorMessage,
}: EditMessageModalProps) {
  const socket = useSocket();
  const { room } = useParams();
  const { chatId } = useContext(ChatContext);
  const { currentMessage, filteredMessages, newMessage, setNewMessage } =
    useContext(MessageContext);
  // const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  const handleMessageEdit = async (
    messageId: number | null,
  ): Promise<void> => {
    try {
      if (!socket || !room || messageId === null) return;

      if (!newMessage) {
        setIsModalOpen(false);
        return;
      }

      // TODO: Write to database in socket event instead of API call
      if (chatId && messageId) {
        await editMessage(chatType, chatId, newMessage, messageId);
      }

      const messageList = [...filteredMessages];
      // TODO: Perfrom this check on the server
      const isLastMessage = messageList[messageList.length - 1]?.id === messageId;
      if (isLastMessage) {
        socket.emit('last-message-updated', { room, chatType });
      }

      const messageEditPayload: ClientMessageEditEventPayload =
        { messageId, content: newMessage, room };
      socket.emit('message-edited', messageEditPayload);

      setNewMessage('');
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
        <div className='modal-heading'>Edit message</div>
        <div>
          <textarea
            autoFocus
            id='message-edit-textarea'
            placeholder={currentMessage}
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            style={{ width: '100%' }}
          />
          {/* <button
            type='button'
            className='emoji-picker-button-edit-modal'
            onClick={(event) => {
              event.stopPropagation();
              setShowEmojiPicker((value) => !value);
            }}
            style={{ color: showEmojiPicker ? '#1db954' : 'white' }}
          >
            {showEmojiPicker ? 'Close' : 'Emoji menu'}
          </button> */}
        </div>

        {/* {showEmojiPicker ? (
          <div className='emoji-picker-container'></div>
        ) : null} */}

        <div className='modal-action-buttons-container'>
          <button
            className='confirm-action-button'
            style={{ backgroundColor: '#1db954' }}
            onClick={() => handleMessageEdit(messageId)}
          >
            Save
          </button>

          <button
            className='close-modal-button'
            onClick={() => {
              setNewMessage('');
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
