import { useContext, useEffect } from 'react';
import { ChatContext } from '../contexts/ChatContext';

export default function useClearErrorMessage(
  errorMessage: string,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
) {
  const { chatId } = useContext(ChatContext);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage, setErrorMessage]);

  // Clear error message when the user changes chat
  useEffect(() => {
    setErrorMessage('');
  }, [chatId, setErrorMessage]);
}
