import { getBlockList } from '../../../api/user-api';

export default function useBlockAndUnblock(
  recipientUserId: number,
  updateBlockList: (userIds: number[]) => void,
  setIsBlocked: React.Dispatch<React.SetStateAction<boolean>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
) {
  const handleBlockAndUnblock = async (): Promise<void> => {
    try {
      const currentUserBlockList = await getBlockList();

      if (!currentUserBlockList.includes(recipientUserId)) {
        // Block user
        const updatedBlockList = [...currentUserBlockList, recipientUserId];
        updateBlockList(updatedBlockList);
        setIsBlocked(true);
      } else {
        // Unblock user
        const updatedBlockList = currentUserBlockList.filter(
          (id) => id !== recipientUserId,
        );
        updateBlockList(updatedBlockList);
        setIsBlocked(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
  };

  return handleBlockAndUnblock;
}
