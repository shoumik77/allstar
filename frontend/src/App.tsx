import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AccessGate } from '@/components/AccessGate';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/Home';
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
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <AccessGate>
            <LoginPage />
          </AccessGate>
        }
      />
      <Route
        path="/register"
        element={
          <AccessGate>
            <RegisterPage />
          </AccessGate>
        }
      />

      <Route
        element={
          <AccessGate>
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          </AccessGate>
        }
      >
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/create-pick" element={<CreatePickPage />} />
        <Route path="/my-picks" element={<MyPicksPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
