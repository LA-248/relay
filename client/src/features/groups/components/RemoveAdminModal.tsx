import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '../../../components/ModalTemplate';
import {
  GroupMemberRole,
  type GroupInfoWithMembers,
} from '../../../types/group';
import { updateGroupMemberRole } from '../../../api/group-chat-api';

interface RemoveAsAdminModalProps {
  group: GroupInfoWithMembers;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  memberId: number;
  memberName: string;
}

export default function RemoveAsAdminModal({
  group,
  isModalOpen,
  setIsModalOpen,
  memberId,
  memberName,
}: RemoveAsAdminModalProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleAdminRemoval = async (): Promise<void> => {
    try {
      const groupId = group.info.chatId;
      const result = await updateGroupMemberRole(
        groupId,
        memberId,
        GroupMemberRole.MEMBER,
      );
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
        <div className="modal-heading">{`Remove ${memberName} as admin?`}</div>
        <div className="modal-subtext">
          This will remove <strong>{memberName}'s</strong> admin privileges,
          they will no longer have the ability to kick members.
        </div>

        <div className="modal-action-buttons-container">
          <button
            className="confirm-action-button"
            style={{ backgroundColor: '#1db954' }}
            onClick={() => handleAdminRemoval()}
          >
            Confirm
          </button>

          <button
            className="close-modal-button"
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
