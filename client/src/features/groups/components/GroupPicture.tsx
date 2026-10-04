import { useContext, useRef } from 'react';
import { ChatContext } from '../../../contexts/ChatContext';
import { useMediaUpload } from '../../../hooks/useMediaUpload';

export default function GroupPicture() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const chatContext = useContext(ChatContext);
  if (!chatContext) {
    throw new Error();
  }
  const { groupPicture, setGroupPicture, chatId } = chatContext;
  const groupId = chatId;

  const apiEndpoint = `/api/chats/groups/${groupId}/pictures`;

  const { handleFileInputClick, handleMediaUpload } = useMediaUpload(
    fileInputRef,
    formRef,
    apiEndpoint,
    setGroupPicture,
    'Picture uploaded successfully',
  );

  return (
    <div className="group-picture-container">
      <img
        className="group-picture"
        alt="Group avatar"
        src={groupPicture ?? '/images/default-avatar.jpg'}
      ></img>
      <form
        ref={formRef}
        id="group-picture-upload-form"
        encType="multipart/form-data"
      >
        <input
          ref={fileInputRef}
          type="file"
          name="group-picture"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleMediaUpload}
        />
      </form>
      <button
        type="button"
        className="upload-group-picture-button"
        onClick={handleFileInputClick}
      >
        Change picture
      </button>
    </div>
  );
}
