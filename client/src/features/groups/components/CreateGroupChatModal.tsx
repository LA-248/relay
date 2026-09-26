import { useContext, useEffect, useState } from 'react';
import {
  getUserIdByUsername,
  getUserProfilePicture,
} from '../../../api/user-api';
import { createGroupChat } from '../../../api/group-chat-api';
import { toast } from 'sonner';
import Modal from '../../../components/ModalTemplate';
import {
  GroupMemberRole,
  type GroupMemberToBeAdded,
  type GroupMemberToRemove,
} from '../../../types/group';
import { UserContext } from '../../../contexts/UserContext';

interface CreateGroupChatModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  loggedInUsername: string;
  loggedInUserId: number;
}

export default function CreateGroupChatModal({
  isModalOpen,
  setIsModalOpen,
  loggedInUsername,
  loggedInUserId,
}: CreateGroupChatModalProps) {
  const { profilePicture } = useContext(UserContext);
  const [groupName, setGroupName] = useState<string>('');
  const [inputUsername, setInputUsername] = useState<string>('');
  const [addedMembers, setAddedMembers] = useState<GroupMemberToBeAdded[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Automatically add group creator to added members list
    setAddedMembers([
      {
        username: loggedInUsername,
        userId: loggedInUserId,
        profilePicture: profilePicture,
        role: GroupMemberRole.OWNER,
      },
    ]);
  }, [loggedInUserId, loggedInUsername, profilePicture]);

  const handleAddMember = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    try {
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
        throw new Error('This user has already been added to the group');
      }

      // Check if the user being added exists in the database, if they do, their user id is returned
      const memberUserId = await getUserIdByUsername(
        sanitizedUsername
      );
      const memberProfilePicture = await getUserProfilePicture(memberUserId);

      // Store the username, id, and group role of each added member, this is needed to add them as a group member in the database
      setAddedMembers((prevMembers) => [
        ...prevMembers,
        {
          username: sanitizedUsername,
          userId: memberUserId,
          profilePicture: memberProfilePicture,
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

  const handleCreateGroup = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    try {
      if (!groupName) {
        throw new Error('Please enter a name for your group');
      }
      if (!/^[a-zA-Z0-9 ]+$/.test(groupName)) {
        throw new Error('Group name can only contain letters and numbers');
      }
      if (groupName.length < 1 || groupName.length > 50) {
        throw new Error('Group name must be between 1 and 50 characters');
      }
      if (addedMembers.length <= 1) {
        throw new Error('You must add at least one member to your group');
      }

      await createGroupChat(loggedInUserId, groupName, addedMembers);
      toast.success('Group chat created');
      setGroupName('');
      setAddedMembers([
        {
          username: loggedInUsername,
          userId: loggedInUserId,
          profilePicture: profilePicture,
          role: GroupMemberRole.OWNER,
        },
      ]);
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
      <div className='modal-heading'>Create new group chat</div>
      <div className='set-group-name-container'>
        <div className='group-name-heading'>Name</div>
        <input
          className='set-group-name-input'
          placeholder='Group name'
          value={groupName}
          onChange={(event) => {
            setGroupName(event.target.value);
            setErrorMessage('');
          }}
        />
      </div>
      <div className='add-group-members-container'>
        <div className='add-group-members-heading'>Add members</div>
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
              Add user
            </button>
          </div>
          {addedMembers.length > 0 ? (
            <div className='added-group-members-heading'>Added:</div>
          ) : null}
          <div className='added-group-members-container'>
            {addedMembers.map((addedMember, index) => (
              <div className='added-group-member' key={index}>
                <div className='added-member-container'>
                  <img
                    src={
                      addedMember.profilePicture ?? '/images/default-avatar.jpg'
                    }
                    className='added-member-profile-picture'
                  ></img>
                  <div>{addedMember.username}</div>
                  {addedMember.role === GroupMemberRole.OWNER ? (
                    <div style={{ marginLeft: '-5px' }}>(You)</div>
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
        <form onSubmit={handleCreateGroup}>
          <button className='confirm-action-button'>Create group</button>
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
