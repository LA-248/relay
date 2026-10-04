import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

export const useSocketErrorHandling = (
  socket: Socket | null,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
) => {
  useEffect(() => {
    if (!socket) return;

    const handleCustomError = (errorResponse: { error: string }) => {
      setErrorMessage(errorResponse.error);
    };

    // Handle connection and custom errors
    socket.on('custom-error', handleCustomError);

    socket.on('connect_error', () => {
      setErrorMessage('Unable to connect to chat server. Please try again.');
    });

    socket.on('disconnect', () => {
      setErrorMessage(
        'Disconnected from chat server. Attempting to reconnect...',
      );
    });

    return () => {
      // Clean up error event listeners
      socket.off('custom-error', handleCustomError);
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, [socket, setErrorMessage]);
};
