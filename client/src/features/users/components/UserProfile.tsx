import { Link } from 'react-router-dom';
import Logout from './UserLogout';

type UserProfileProps = {
  profilePicture: string | null;
  loggedInUsername: string;
  setActiveChatRoom: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function UserProfile({
  profilePicture,
  loggedInUsername,
  setActiveChatRoom,
}: UserProfileProps) {
  return (
    <div className="profile-settings-container">
      <div className="user-profile-info">
        <img
          src={profilePicture ?? '/images/default-avatar.jpg'}
          alt="Profile"
          className="user-profile-picture"
        ></img>
        <div className="account-username">{loggedInUsername}</div>
      </div>
      <div className="user-navigation-buttons">
        <Logout />
        <Link
          to="/settings"
          style={{ textDecoration: 'none', marginLeft: '10px' }}
        >
          <button
            className="settings-button"
            onClick={() => setActiveChatRoom(null)}
          >
            Settings
          </button>
        </Link>
      </div>
    </div>
  );
}
