import type { Chat } from '../types/chat';
import type { UserInfo } from '../types/user';

// Fetch the chat list of a specific user
export async function getChatList(): Promise<Chat[]> {
  const response = await fetch(
    `/api/chats/private`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }

  const data = await response.json();
  return data;
}

export async function getRecipientProfile(
  room: string,
  navigate: (path: string) => void,
): Promise<UserInfo> {
  const response = await fetch(
    `/api/chats/private/${room}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    },
  );
  const data = await response.json();

  // Redirect user to homepage if they try to access a chat via the URL with a user that does not exist
  // or they try to access a room that they are not a part of
  if (
    response.status === 403 ||
    response.status === 404 ||
    response.status === 500
  ) {
    navigate(data.redirectPath);
  }
  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}

// Add a chat to the user's chat list
export async function addChat(inputUsername: string): Promise<Chat> {
  if (!inputUsername) {
    throw new Error('Username is required');
  }

  const response = await fetch(
    `/api/chats/private`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        recipientName: inputUsername,
      }),
      credentials: 'include',
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}

// Needed for when the most recent message in a chat is deleted
// Ensures the correct latest message is shown in the chat list
export async function updateLastMessageId(
  messageId: number | null,
  room: string,
): Promise<void> {
  const response = await fetch(
    `/api/chats/private/${room}/last_message`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId }),
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }
}

export async function updateLastReadStatus(room: string): Promise<void> {
  const response = await fetch(
    `/api/chats/private/${room}/read_status`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }
}

// Delete a chat from the user's chat list
export async function deletePrivateChat(room: string): Promise<void> {
  const response = await fetch(
    `/api/chats/private/${room}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }
}

