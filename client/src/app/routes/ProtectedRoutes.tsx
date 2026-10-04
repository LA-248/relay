import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';

// Set up route protection - done by retrieving the auth status from the backend
export default function ProtectedRoutes() {
  const [authenticationStatus, setAuthenticationStatus] = useState<
    boolean | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const checkAuthStatus = async (): Promise<void> => {
        const response = await fetch(`/api/auth/status`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(
            'There was an error retrieving the authentication status.',
          );
        }

        const data = await response.json();
        setAuthenticationStatus(data.authenticated);
      };

      checkAuthStatus();
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      }
      setError('An unexpected error occurred');
    }
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (authenticationStatus === null) {
    return <div>Loading...</div>;
  }

  if (authenticationStatus) {
    return <Outlet />;
  } else {
    return <Navigate to="/login" />;
  }
}
