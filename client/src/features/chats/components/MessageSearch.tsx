import { useContext, useEffect, useState } from 'react';
import { MessageContext } from '../../../contexts/MessageContext';
import type { Message } from '../../../types/message';

interface MessageSearchProps {
  messages: Message[];
  setFilteredMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function MessageSearch({
  messages,
  setFilteredMessages,
}: MessageSearchProps) {
  const { messageSearchValueText, setMessageSearchValueText } =
    useContext(MessageContext);

  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    if (messageSearchValueText) {
      const filtered = messages.filter((message) =>
        message.content
          .toLowerCase()
          .includes(messageSearchValueText.toLowerCase()),
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [setFilteredMessages, messageSearchValueText, messages]);

  return (
    <div className="message-search-container">
      <input
        id="message-search-input"
        type="text"
        placeholder="Search messages"
        value={messageSearchValueText}
        onChange={(event) => setMessageSearchValueText(event.target.value)}
        onClick={() => setActive(true)}
        onBlur={() => setActive(false)}
        style={{ width: active ? '350px' : '150px' }}
      />
    </div>
  );
}
