import { useContext, useRef } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import { useMediaUpload } from '../../../hooks/useMediaUpload';

export default function ProfilePicture() {
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const { profilePicture, setProfilePicture, loggedInUserId } =
    useContext(UserContext);
  const successMessage = 'Picture uploaded successfully';

  const apiEndpoint = `/api/users/${loggedInUserId}/pictures`;

  const { handleFileInputClick, handleMediaUpload } = useMediaUpload(
    fileInputRef,
    formRef,
    apiEndpoint,
    setProfilePicture,
    successMessage,
  );

  return (
    <div className="profile-picture-container">
      <img
        className="profile-picture"
        alt="Profile avatar"
        src={profilePicture ?? '/images/default-avatar.jpg'}
      ></img>
      <form
        ref={formRef}
        id="profile-picture-upload-form"
        encType="multipart/form-data"
      >
        <input
          ref={fileInputRef}
          type="file"
          name="profile-picture"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleMediaUpload}
        />
      </form>
      <button
        type="button"
        className="upload-profile-picture-button"
        onClick={handleFileInputClick}
      >
        Upload
      </button>
    </div>
  );
}
