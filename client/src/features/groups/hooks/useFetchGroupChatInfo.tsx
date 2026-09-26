import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroupInfo } from '../../../api/group-chat-api';
import type { GroupInfoWithMembers } from '../../../types/group';
import { ChatType } from '../../../types/chat';

export default function useFetchGroupChatInfo(
  room: string,
  chatType: string,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
) {
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState<GroupInfoWithMembers>({
    info: {
      chatId: 0,
      name: '',
      groupPicture: '',
    },
    members: [],
  });

  useEffect(() => {
    const fetchGroupInfo = async (): Promise<void> => {
      try {
        if (chatType === ChatType.GROUP) {
          const groupChatInfo = await getGroupInfo(room, navigate);
          setGroupInfo(groupChatInfo);
        }
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      }
    };

    fetchGroupInfo();
  }, [room, chatType, navigate, setErrorMessage]);

  return groupInfo;
}
