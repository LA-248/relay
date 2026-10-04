import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { ChatContext } from '../../../contexts/ChatContext';
import useBlockAndUnblock from '../../users/hooks/useBlockAndUnblock';
import Modal from '../../../components/ModalTemplate';
import { ChatType } from '../../../types/chat';

interface ContactInfoModalProps {
  recipientUserId: number;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  updateBlockList: (userIds: number[]) => void;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}

export default function ContactInfoModal({
  recipientUserId,
  isModalOpen,
  setIsModalOpen,
  updateBlockList,
  errorMessage,
  setErrorMessage,
}: ContactInfoModalProps) {
  const location = useLocation();
  // Extract chat type from URL path
  const pathSegments = location.pathname.split('/');
  const chatType = pathSegments[1];

  const { chatName, recipientProfilePicture } = useContext(ChatContext);
  const { isBlocked, setIsBlocked } = useContext(UserContext);

  const handleBlockAndUnblock = useBlockAndUnblock(
    recipientUserId,
    updateBlockList,
    setIsBlocked,
    setErrorMessage,
  );

  return (
    <Modal
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      errorMessage={errorMessage}
      setErrorMessage={setErrorMessage}
    >
      <div className="modal-heading">
        {chatType === ChatType.GROUP ? 'Group info' : 'Contact info'}
      </div>
      {isBlocked ? (
        <div className="blocked-status" style={{ marginTop: '-15px' }}>
          You have this user blocked
        </div>
      ) : null}

      <div className="contact-info-container">
        <img
          className="chat-pic"
          src={recipientProfilePicture || '/images/default-avatar.jpg'}
          alt="Profile avatar"
          style={{ height: '100px', width: '100px' }}
        ></img>
        <div
          className="chat-name-contact-info-modal"
          style={{ textDecoration: 'none', cursor: 'auto' }}
        >
          {chatName}
        </div>
      </div>

      <div className="modal-action-buttons-container">
        {chatType === ChatType.PRIVATE ? (
          <button className="block-user-button" onClick={handleBlockAndUnblock}>
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
        ) : null}
        <button
          className="close-modal-button"
          onClick={() => setIsModalOpen(false)}
          style={{
            width: chatType === ChatType.GROUP ? '100%' : undefined,
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
