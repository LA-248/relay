export type UserInfo = {
  userId: number | string;
  username: string;
  profilePicture: string | null;
};

export type UserContextType = {
  loggedInUserId: number;
  setLoggedInUserId: React.Dispatch<React.SetStateAction<number>>;
  loggedInUsername: string;
  setLoggedInUsername: React.Dispatch<React.SetStateAction<string>>;
  profilePicture: string | null;
  setProfilePicture: React.Dispatch<React.SetStateAction<string | null>>;
  isBlocked: boolean;
  setIsBlocked: React.Dispatch<React.SetStateAction<boolean>>;
};

export type UserProfileUpdate = {
  userId: number;
  newInfo: string;
  room: string;
};
