import { useState } from 'react';
import ProfilePicture from '../features/users/components/ProfilePicture';
import UsernameEdit from '../features/users/components/UsernameEdit';
import '../styles/Settings.css';

export default function Settings() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  return (
    <div className="settings-main-container">
      <div className="settings-header">
        <div className="settings-heading">Settings</div>
      </div>

      <div className="account-container">
        <div className="account-heading">Account</div>
        <ProfilePicture />

        <UsernameEdit
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      </div>
    </div>
  );
}
