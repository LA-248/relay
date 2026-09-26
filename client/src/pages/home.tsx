import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { ChatContext } from '../contexts/ChatContext';
import { UserContext } from '../contexts/UserContext';
import { SocketContext } from '../contexts/SocketContext';
import { getLoggedInUserData } from '../api/user-api';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const { setActiveChatRoom } = useContext(ChatContext);
  const {
    loggedInUserId,
    setLoggedInUserId,
    setLoggedInUsername,
    setProfilePicture,
  } = useContext(UserContext);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Retrieve data for logged in user
    const fetchUserData = async (): Promise<void> => {
      try {
        const userData = await getLoggedInUserData();
        setLoggedInUserId(Number(userData.userId));
        setLoggedInUsername(userData.username);

        setProfilePicture(
          userData.profilePicture,
        );
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      }
    };

    fetchUserData();
  }, [setLoggedInUserId, setLoggedInUsername, setProfilePicture]);

  useEffect(() => {
    if (loggedInUserId) {
      // Connect to socket server running on the backend
      const socketInstance = io({
        auth: {
          serverOffset: 0,
        },
        // Need to send cookies with the request
        withCredentials: true,
      });
      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [loggedInUserId]);

  return (
    socket && (
      <SocketContext.Provider value={socket}>
        <div className='main-container'>
          <div className='sidebar-container'>
            {errorMessage ? (
              <div className='error-message'>{errorMessage}</div>
            ) : null}
            <Link
              to='/'
              style={{
                color: '#1db954',
                fontWeight: '600',
                fontSize: '28px',
                textDecoration: 'none',
                padding: '10px 10px 0px 10px',
                width: 'fit-content',
              }}
              onClick={() => setActiveChatRoom(null)}
            >
              relay
            </Link>
            <Sidebar />
          </div>
          <div className='chat-window-container'>
            <Outlet />
          </div>
        </div>
      </SocketContext.Provider>
    )
  );
}
