import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { GroupMember } from '../../../types/group';

export default function useMembersListUpdate(
  socket: Socket | null,
  setMembersList: React.Dispatch<React.SetStateAction<GroupMember[]>>
) {
  useEffect(() => {
    if (!socket) return;

    const handleMemberRemoval = (data: { removedUserId: number }) => {
      setMembersList((prevMembersList) =>
        prevMembersList.filter(
          (member) => member.id !== data.removedUserId
        )
      );
    };

    const handleMemberAddition = (data: { addedUsersInfo: GroupMember[] }) => {
      setMembersList((prevMembersList) =>
        prevMembersList.concat(data.addedUsersInfo)
      );
    };

    const handleGroupMemberRoleUpdate = (data: {
      updatedMember: Omit<GroupMember, 'username' | 'profile_picture'>;
    }) => {
      setMembersList((prevMembersList) =>
        prevMembersList.map((member) => {
          return member.id === data.updatedMember.id
            ? { ...member, role: data.updatedMember.role }
            : member;
        })
      );
    };

    const handleGroupMemberProfilePictureUpdate = (data: {
      userId: number;
      newInfo: string;
      groupRoom: string;
    }) => {
      setMembersList((prevMembersList) =>
        prevMembersList.map((member) => {
          return member.id === data.userId
            ? { ...member, profile_picture: data.newInfo }
            : member;
        })
      );
    };

    const handleGroupMemberUsernameUpdate = (data: {
      userId: number;
      newInfo: string;
      groupRoom: string;
    }) => {
      setMembersList((prevMembersList) =>
        prevMembersList.map((member) => {
          return member.id === data.userId
            ? { ...member, username: data.newInfo }
            : member;
        })
      );
    };

    socket.on('remove-member', handleMemberRemoval);
    socket.on('add-members', handleMemberAddition);
    socket.on('update-group-owner', handleGroupMemberRoleUpdate);
    socket.on('update-member-role', handleGroupMemberRoleUpdate);
    socket.on(
      'update-profile-picture-in-groups',
      handleGroupMemberProfilePictureUpdate
    );
    socket.on('update-username-in-groups', handleGroupMemberUsernameUpdate);

    return () => {
      socket.off('remove-member', handleMemberRemoval);
      socket.off('add-members', handleMemberAddition);
      socket.off('update-group-owner', handleGroupMemberRoleUpdate);
      socket.off('update-member-role', handleGroupMemberRoleUpdate);
      socket.off(
        'update-profile-picture-in-groups',
        handleGroupMemberProfilePictureUpdate
      );
      socket.off('update-username-in-groups', handleGroupMemberUsernameUpdate);
    };
  }, [socket, setMembersList]);
}
