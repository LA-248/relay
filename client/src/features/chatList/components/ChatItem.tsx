import type { Chat } from '../../../types/chat';
import { MessageType } from '../../../types/message';
import formatDate from '../../../utils/DateTimeFormat';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  isHovered: boolean;
  onMouseEnter: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave: React.MouseEventHandler<HTMLDivElement>;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  onDeleteClick: React.MouseEventHandler<HTMLButtonElement>;
}

export default function ChatItem({
  chat,
  isActive,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDeleteClick,
}: ChatItemProps) {
  const lastMessage = chat.last_message_time || 0;
  const lastRead = chat.last_read_at || 0;
  const showUnread = lastMessage > lastRead;

  return (
    <div className="chat-item-container">
      <div
        className={`chat-item ${isActive ? 'active' : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        <img
          className="chat-pic"
          alt="Profile avatar"
          src={chat.chat_picture || '/images/default-avatar.jpg'}
        ></img>
        <div className="chat-info">
          <div className="chat-name-and-time">
            <h4 className="chat-name">{chat.name}</h4>
            <div className="time-and-notification-container">
              <div className="chat-time">
                {chat.last_message_time ? formatDate(chat.updated_at) : null}
              </div>
              {showUnread ? <span className="unread-message-alert" /> : null}
            </div>
          </div>
          <div className="chat-metadata-container">
            <p className="chat-last-message">
              {chat.last_message_type === MessageType.IMAGE
                ? 'Image'
                : chat.last_message_content}
            </p>
            <div className="chat-utilities">
              {isHovered && (
                <button onClick={onDeleteClick} className="chat-delete-button">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
