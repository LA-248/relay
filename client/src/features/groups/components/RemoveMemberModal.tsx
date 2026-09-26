import { useState } from 'react';
import { toast } from 'sonner';
import { removeKickedGroupMember } from '../../../api/group-chat-api';
import Modal from '../../../components/ModalTemplate';
import type { GroupInfoWithMembers } from '../../../types/group';

interface RemoveMemberModalProps {
  group: GroupInfoWithMembers;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  memberId: number;
  memberName: string;
}

export default function RemoveMemberModal({
  group,
  isModalOpen,
  setIsModalOpen,
  memberId,
  memberName,
}: RemoveMemberModalProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleMemberRemoval = async (): Promise<void> => {
    try {
      const groupId = group.info.chatId;
      const result = await removeKickedGroupMember(groupId, memberId);
      toast.success(result);
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
        <div className='modal-heading'>{`Remove ${memberName}?`}</div>
        <div className='modal-subtext'>
          Are you sure you want to remove <strong>{memberName}</strong> from the
          group? They will be able to join again if they are re-added.
        </div>

        <div className='modal-action-buttons-container'>
          <button
            className='confirm-action-button'
            style={{ backgroundColor: 'red' }}
            onClick={() => handleMemberRemoval()}
          >
            Remove
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
