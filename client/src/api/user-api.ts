import type { UserInfo } from '../types/user';

export async function getLoggedInUserData(): Promise<UserInfo> {
  const response = await fetch(
    `/api/users`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }

  const data = await response.json();
  return data;
}

// Retrieve the ID of a message recipient from the database using their username
export async function getUserIdByUsername(
  username: string
): Promise<number> {
  const response = await fetch(
    `/api/users/${username}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }

  const data = await response.json();
  return data.userId;
}

export async function getUserProfilePicture(userId: number): Promise<string | null> {
  const response = await fetch(
    `/api/users/${userId}/pictures`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }

  const data = await response.json();
  return data.profilePicture;
}

// Retrieve the block list of the logged in user
export async function getBlockList(): Promise<number[]> {
  const response = await fetch(
    `/api/users/blocked`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }

  const data = await response.json();
  return data.blockList;
}

export async function updateUsername(username: string): Promise<string> {
  const response = await fetch(
    `/api/users`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username: username }),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }

  const data = await response.json();
  return data.success;
}

// Update a user's block list with the ID of who they want blocked
export async function updateBlockList(userIds: number[]): Promise<void> {
  const response = await fetch(
    `/api/users/blocked`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blockedUserIds: userIds }),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.error);
  }
}
