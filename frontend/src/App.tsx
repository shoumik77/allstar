import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { PlaceholderPage } from '@/pages/Placeholder';
import { GamesPage } from '@/pages/Games';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<PlaceholderPage title="Feed" description="Open picks land here in phase 3." />} />
        <Route path="/games" element={<GamesPage />} />
        <Route
          path="/my-picks"
          element={<PlaceholderPage title="My Picks" description="Your positions land here in phase 3." />}
        />
        <Route
          path="/leaderboard"
          element={<PlaceholderPage title="Leaderboard" description="Weekly rankings land in phase 5." />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}
