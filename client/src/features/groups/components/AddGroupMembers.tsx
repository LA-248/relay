import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getUserIdByUsername } from '../../../api/user-api';
import {
  addMembers,
  getMemberUsernames,
} from '../../../api/group-chat-api';
import Modal from '../../../components/ModalTemplate';
import {
  GroupMemberRole,
  type GroupMemberToBeAdded,
  type GroupMemberToRemove,
} from '../../../types/group';

interface AddGroupMembersProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  groupId: number;
  loggedInUsername: string;
  loggedInUserId: number;
}

export default function AddGroupMembers({
  isModalOpen,
  setIsModalOpen,
  groupId,
  loggedInUsername,
  loggedInUserId,
}: AddGroupMembersProps) {
  const { room } = useParams();
  const [inputUsername, setInputUsername] = useState<string>('');
  const [addedMembers, setAddedMembers] = useState<GroupMemberToBeAdded[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setAddedMembers([]);
  }, [loggedInUserId, loggedInUsername]);

  const handleAddMember = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    try {
      const currentGroupMembers = await getMemberUsernames(groupId);
      const sanitizedUsername = inputUsername.replace(/[\\/]/g, '');

      if (!sanitizedUsername) {
        throw new Error('Please enter a username');
      }
      if (addedMembers.length >= 10) {
        throw new Error('You may only add up to 10 members');
      }
      if (sanitizedUsername === loggedInUsername) {
        throw new Error('You are already in the group');
      }

      const exists = addedMembers.some(
        (member) => member.username === sanitizedUsername
      );
      if (exists) {
        throw new Error('This user has already been selected to be added');
      }
      if (currentGroupMembers.length === 10) {
        throw new Error('Groups have a limit of 10 members');
      }
      // Check if the user being added exists in the database, if they do, their user id is returned
      const memberUserId = await getUserIdByUsername(
        sanitizedUsername
      );

      // This checks if the user trying to be added is already a member
      if (currentGroupMembers.includes(sanitizedUsername)) {
        throw new Error('This user is already a member of this group');
      }

      // Store the username, id, and group role of each added member, this is needed to add them as a group member in the database
      setAddedMembers((prevMembers) => [
        ...prevMembers,
        {
          username: sanitizedUsername,
          userId: memberUserId,
          role: GroupMemberRole.MEMBER,
        },
      ]);
      setInputUsername('');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
  };

  const removeMember = (memberToRemove: GroupMemberToRemove): void => {
    setAddedMembers(
      addedMembers.filter((member) => member.userId !== memberToRemove.userId)
    );
  };

  const handleAddMembers = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (addedMembers.length === 0) {
      return;
    }

    try {
      if (!room) return;
      const result = await addMembers(room, addedMembers);
      toast.success(result.message);
      setAddedMembers([]);
      setIsModalOpen(false);
    } catch (error) {
      setIsModalOpen(true);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <Modal
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      errorMessage={errorMessage}
      setErrorMessage={setErrorMessage}
    >
      <div className='modal-heading'>Add members</div>
      <div className='add-group-members-container'>
        <form id='add-group-members-form' onSubmit={handleAddMember}>
          <div className='input-button-wrapper'>
            <input
              className='add-group-members-input'
              placeholder='Username'
              value={inputUsername}
              onChange={(event) => {
                setInputUsername(event.target.value);
                setErrorMessage('');
              }}
            />
            <button type='submit' className='add-member-button'>
              Select
            </button>
          </div>
          {addedMembers.length > 0 ? (
            <div className='added-group-members-heading'>Selected:</div>
          ) : null}
          <div className='added-group-members-container'>
            {addedMembers.map((addedMember, index) => (
              <div className='added-group-member' key={index}>
                <div className='added-member-username-container'>
                  <div>{addedMember.username}</div>
                  {addedMember.role === GroupMemberRole.OWNER ? (
                    <div>(You)</div>
                  ) : null}
                </div>
                {addedMember.role === GroupMemberRole.MEMBER ? (
                  <div
                    className='remove-group-member-button'
                    onClick={() => removeMember(addedMember)}
                  >
                    Remove
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </form>
      </div>

      <div className='modal-action-buttons-container'>
        <form onSubmit={handleAddMembers}>
          <button
            className='confirm-action-button'
            disabled={addedMembers.length === 0}
            style={{
              opacity: addedMembers.length === 0 ? '0.6' : undefined,
              cursor: addedMembers.length === 0 ? 'auto' : 'pointer',
            }}
          >
            Add
          </button>
        </form>

        <button
          className='close-modal-button'
          onClick={() => {
            setIsModalOpen(false);
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
