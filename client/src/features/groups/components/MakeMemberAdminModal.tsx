import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '../../../components/ModalTemplate';
import {
  GroupMemberRole,
  type GroupInfoWithMembers,
} from '../../../types/group';
import { updateGroupMemberRole } from '../../../api/group-chat-api';

interface MakeAdminModalProps {
  group: GroupInfoWithMembers;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  memberId: number;
  memberName: string;
}

export default function MakeMemberAdminModal({
  group,
  isModalOpen,
  setIsModalOpen,
  memberId,
  memberName,
}: MakeAdminModalProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleAdminAssignment = async (): Promise<void> => {
    try {
      const groupId = group.info.chatId;
      const result = await updateGroupMemberRole(
        groupId,
        memberId,
        GroupMemberRole.ADMIN,
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
        <div className="modal-heading">{`Make ${memberName} an admin?`}</div>
        <div className="modal-subtext">
          As admin, <strong>{memberName}</strong> will have the ability to kick
          members. They will not however be able to give admin to other members
          or delete the group.
        </div>

        <div className="modal-action-buttons-container">
          <button
            className="confirm-action-button"
            style={{ backgroundColor: '#1db954' }}
            onClick={() => handleAdminAssignment()}
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
