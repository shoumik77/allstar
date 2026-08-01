import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { GamesPage } from '@/pages/Games';
import { CreatePickPage } from '@/pages/CreatePick';
import { FeedPage } from '@/pages/Feed';
import { MyPicksPage } from '@/pages/MyPicks';
import { LeaderboardPage } from '@/pages/Leaderboard';

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
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/create-pick" element={<CreatePickPage />} />
        <Route path="/my-picks" element={<MyPicksPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}
