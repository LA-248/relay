import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../../../contexts/ChatContext';

export default function Logout() {
  const { setActiveChatRoom } = useContext(ChatContext);
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.json());
      }

      setActiveChatRoom(null);
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Log out
    </button>
  );
}
