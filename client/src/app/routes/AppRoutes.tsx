import { Routes, Route } from 'react-router-dom';

import Home from '../../pages/home';
import SignUp from '../../pages/sign-up';
import Login from '../../pages/login';
import Settings from '../../pages/settings';
import ProtectedRoutes from './ProtectedRoutes';
import ChatWindowPlaceholder from '../../features/chats/components/ChatWindowPlaceholder';
import { ChatView } from '../../features/chats/components/ChatView';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<SignUp />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />}>
          <Route index element={<ChatWindowPlaceholder />} />
          <Route path="chats/:room" element={<ChatView />} />
          <Route path="groups/:room" element={<ChatView />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}
