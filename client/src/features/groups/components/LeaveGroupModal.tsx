import { useState } from 'react';
import { toast } from 'sonner';
import { leaveGroup } from '../../../api/group-chat-api';
import Modal from '../../../components/ModalTemplate';
import type { GroupInfoWithMembers } from '../../../types/group';

interface LeaveGroupModalProps {
  group: GroupInfoWithMembers;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function LeaveGroupModal({
  group,
  isModalOpen,
  setIsModalOpen,
}: LeaveGroupModalProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLeavingGroup = async (): Promise<void> => {
    try {
      const groupId = group.info.chatId;
      const result = await leaveGroup(groupId);
      toast.success(result);
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
        <div className="modal-heading">Leave group?</div>
        <div className="modal-subtext">
          Are you sure you want to leave this group? You will no longer be able
          to access or participate in it.
        </div>

        <div className="modal-action-buttons-container">
          <button
            className="confirm-action-button"
            style={{ backgroundColor: 'red' }}
            onClick={() => handleLeavingGroup()}
          >
            Leave
          </button>

          <button
            className="close-modal-button"
            onClick={() => {
              setIsModalOpen(false);
            }}
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
