import { useMemo } from 'react';
import { GroupMemberRole, type GroupMember } from '../../../types/group';
import PersonRemoveAlt1RoundedIcon from '@mui/icons-material/PersonRemoveAlt1Rounded';
import AddModeratorRoundedIcon from '@mui/icons-material/AddModeratorRounded';
import RemoveModeratorRoundedIcon from '@mui/icons-material/RemoveModeratorRounded';

interface MembersListProps {
  membersList: GroupMember[];
  loggedInUsername: string;
  loggedInUserId: number;
  setIsMakeAdminModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRemoveAsAdminModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRemoveMemberModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMemberId: React.Dispatch<React.SetStateAction<number>>;
  setMemberName: React.Dispatch<React.SetStateAction<string>>;
}

export default function MembersList({
  membersList,
  loggedInUsername,
  loggedInUserId,
  setIsMakeAdminModalOpen,
  setIsRemoveAsAdminModalOpen,
  setIsRemoveMemberModalOpen,
  setMemberId,
  setMemberName,
}: MembersListProps) {
  // Check if current logged in user is the group owner
  const isMemberOwner = useMemo(() => {
    return membersList.some(
      (member) =>
        member.id === loggedInUserId &&
        member.role === GroupMemberRole.OWNER
    );
  }, [membersList, loggedInUserId]);

  // Check if current logged in user is a group admin
  const isMemberAdmin = useMemo(() => {
    return membersList.some(
      (member) =>
        member.id === loggedInUserId &&
        member.role === GroupMemberRole.ADMIN
    );
  }, [membersList, loggedInUserId]);

  return (
    <>
      <div className='group-member-list-container'>
        <div className='group-member-list-header'>Members</div>
        {membersList.map((member) => {
          const isSelf = member.id === loggedInUserId;

          const showKickButton =
            // OWNER: able to kick everybody except themselves
            (isMemberOwner && !isSelf) ||
            // ADMIN: able to kick only normal members (not owner, not self, not other admins)
            (isMemberAdmin &&
              member.role !== GroupMemberRole.OWNER &&
              member.role !== GroupMemberRole.ADMIN &&
              !isSelf);

          return (
            <div className='group-member' key={member.id}>
              <div className='group-member-metadata'>
                <img
                  className='group-member-profile-picture'
                  src={member.profile_picture ?? '/images/default-avatar.jpg'}
                  alt='Profile avatar'
                />
                <div className='group-member-name-and-role'>
                  <div className='group-member-name'>
                    {loggedInUsername === member.username
                      ? 'You'
                      : member.username}
                  </div>
                  <div className='group-member-role'>
                    <div>
                      {member.role === GroupMemberRole.OWNER
                        ? 'Owner'
                        : member.role === GroupMemberRole.ADMIN
                        ? 'Admin'
                        : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className='group-moderation-buttons-container'>
                {
                  // For the owner of the group, do not show the button to add/remove an admin next to their name
                  member.role !== GroupMemberRole.OWNER ? (
                    isMemberOwner && member.role !== GroupMemberRole.ADMIN ? (
                      <button
                        className='make-admin-button'
                        title='Make admin'
                        onClick={() => {
                          setIsMakeAdminModalOpen(true);
                          setMemberId(member.id);
                          setMemberName(member.username);
                        }}
                      >
                        <AddModeratorRoundedIcon fontSize='small' />
                      </button>
                    ) : isMemberOwner &&
                      member.role === GroupMemberRole.ADMIN ? (
                      <button
                        className='remove-admin-button'
                        title='Remove as admin'
                        onClick={() => {
                          setIsRemoveAsAdminModalOpen(true);
                          setMemberId(member.id);
                          setMemberName(member.username);
                        }}
                      >
                        <RemoveModeratorRoundedIcon fontSize='small'></RemoveModeratorRoundedIcon>
                      </button>
                    ) : null
                  ) : null
                }

                {showKickButton ? (
                  <button
                    className='remove-member-button'
                    title='Kick'
                    onClick={() => {
                      setIsRemoveMemberModalOpen(true);
                      setMemberId(member.id);
                      setMemberName(member.username);
                    }}
                  >
                    <PersonRemoveAlt1RoundedIcon fontSize='small' />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
