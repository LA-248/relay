import { BrowserRouter as Router } from 'react-router-dom';
import { UserProvider } from '../contexts/UserContext';
import { ChatProvider } from '../contexts/ChatContext';
import { MessageProvider } from '../contexts/MessageContext';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <ChatProvider>
        <MessageProvider>
          <Router>
            <Toaster position="top-center" richColors={true} />
            {children}
          </Router>
        </MessageProvider>
      </ChatProvider>
    </UserProvider>
  );
}
