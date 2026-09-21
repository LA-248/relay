import { useMemo, useState } from 'react';
import {
  GroupMemberRole,
  type GroupInfoWithMembers,
  type GroupMember,
} from '../../../types/group';
import Modal from '../../../components/ModalTemplate';
import LeaveGroupModal from './LeaveGroupModal';
import GroupPicture from './GroupPicture';
import MembersList from './MembersList';
import RemoveMemberModal from './RemoveMemberModal';
import DeleteGroupModal from './DeleteGroupModal';
import MakeMemberAdminModal from './MakeMemberAdminModal';
import RemoveAsAdminModal from './RemoveAdminModal';

interface GroupInfoHeaderProps {
  group: GroupInfoWithMembers;
  membersList: GroupMember[];
  loggedInUserId: number;
  setIsDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function GroupInfoHeader({
  group,
  membersList,
  loggedInUserId,
  setIsDeleteModalOpen,
}: GroupInfoHeaderProps) {
  const isMemberOwner = useMemo(() => {
    return membersList.some(
      (member) =>
        member.id === loggedInUserId &&
        member.role === GroupMemberRole.OWNER
    );
  }, [membersList, loggedInUserId]);

  return (
    <>
      <GroupPicture />
      <div
        className='chat-name-contact-info-modal'
        style={{ textDecoration: 'none', cursor: 'auto' }}
      >
        {group.info.name}
      </div>
      {isMemberOwner ? (
        <div className='delete-group-container'>
          <button
            className='delete-group-button'
            onClick={() => setIsDeleteModalOpen(true)}
            style={{ width: '100%', marginBottom: '-5px' }}
          >
            Delete group
          </button>
        </div>
      ) : null}
    </>
  );
}

interface GroupInfoModalProps {
  group: GroupInfoWithMembers;
  membersList: GroupMember[];
  loggedInUserId: number;
  loggedInUsername: string;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}

export default function GroupInfoModal({
  group,
  membersList,
  loggedInUserId,
  loggedInUsername,
  isModalOpen,
  setIsModalOpen,
  errorMessage,
  setErrorMessage,
}: GroupInfoModalProps) {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] =
    useState<boolean>(false);
  const [isMakeMemberAdminModalOpen, setIsMakeMemberAdminModalOpen] =
    useState<boolean>(false);
  const [isRemoveAsAdminModalOpen, setIsRemoveAsAdminModalOpen] =
    useState<boolean>(false);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] =
    useState<boolean>(false);
  const [memberId, setMemberId] = useState<number>(0);
  const [memberName, setMemberName] = useState<string>('');

  return (
    <Modal
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      errorMessage={errorMessage}
      setErrorMessage={setErrorMessage}
    >
      <div className='modal-heading'>Group info</div>

      <div className='group-info-container'>
        <GroupInfoHeader
          group={group}
          membersList={membersList}
          loggedInUserId={loggedInUserId}
          setIsDeleteModalOpen={setIsDeleteGroupModalOpen}
        />
        <hr
          style={{ width: '100%', border: 'solid 1px gray', margin: '10px' }}
        ></hr>
        <MembersList
          membersList={membersList}
          loggedInUsername={loggedInUsername}
          loggedInUserId={loggedInUserId}
          setIsMakeAdminModalOpen={setIsMakeMemberAdminModalOpen}
          setIsRemoveAsAdminModalOpen={setIsRemoveAsAdminModalOpen}
          setIsRemoveMemberModalOpen={setIsRemoveMemberModalOpen}
          setMemberId={setMemberId}
          setMemberName={setMemberName}
        />
      </div>

      <div
        className='leave-group-button'
        onClick={() => {
          setIsLeaveModalOpen(true);
        }}
      >
        Leave group
      </div>

      <div className='modal-action-buttons-container'>
        <button
          className='close-modal-button'
          onClick={() => setIsModalOpen(false)}
          style={{ width: '100%' }}
        >
          Close
        </button>
      </div>

      <LeaveGroupModal
        group={group}
        isModalOpen={isLeaveModalOpen}
        setIsModalOpen={setIsLeaveModalOpen}
      />
      <DeleteGroupModal
        group={group}
        isModalOpen={isDeleteGroupModalOpen}
        setIsModalOpen={setIsDeleteGroupModalOpen}
      />
      <MakeMemberAdminModal
        group={group}
        isModalOpen={isMakeMemberAdminModalOpen}
        setIsModalOpen={setIsMakeMemberAdminModalOpen}
        memberId={memberId}
        memberName={memberName}
      />
      <RemoveAsAdminModal
        group={group}
        isModalOpen={isRemoveAsAdminModalOpen}
        setIsModalOpen={setIsRemoveAsAdminModalOpen}
        memberId={memberId}
        memberName={memberName}
      />
      <RemoveMemberModal
        group={group}
        isModalOpen={isRemoveMemberModalOpen}
        setIsModalOpen={setIsRemoveMemberModalOpen}
        memberId={memberId}
        memberName={memberName}
      />
    </Modal>
  );
}
