import { createContext, type ReactNode, useState } from 'react';
import type { UserContextType } from '../types/user';

const defaultUserContext: UserContextType = {
  loggedInUserId: 0,
  setLoggedInUserId: () => {},
  loggedInUsername: '',
  setLoggedInUsername: () => {},
  profilePicture: '',
  setProfilePicture: () => {},
  isBlocked: false,
  setIsBlocked: () => {},
};

const UserContext = createContext<UserContextType>(defaultUserContext);

const UserProvider = ({ children }: { children: ReactNode }) => {
  const [loggedInUserId, setLoggedInUserId] = useState<number>(0);
  const [loggedInUsername, setLoggedInUsername] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string | null>('');
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  return (
    <UserContext.Provider
      value={{
        loggedInUserId,
        setLoggedInUserId,
        loggedInUsername,
        setLoggedInUsername,
        profilePicture,
        setProfilePicture,
        isBlocked,
        setIsBlocked,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
