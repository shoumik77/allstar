import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { ExchangeShell } from '@/components/exchange/ExchangeShell';
import { AccessGate } from '@/components/AccessGate';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/Home';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { MarketsPage } from '@/pages/Markets';
import { TerminalPage } from '@/pages/Terminal';
import { OrdersPage } from '@/pages/Orders';
import { PositionsPage } from '@/pages/Positions';
import { ActivityPage } from '@/pages/Activity';
import { PortfolioPage } from '@/pages/Portfolio';

function CreatePickRedirect() {
  const [params] = useSearchParams();
  const gameId = params.get('gameId');
  return <Navigate to={gameId ? `/markets/${gameId}?new=1` : '/markets'} replace />;
}

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
              <ExchangeShell />
            </ProtectedRoute>
          </AccessGate>
        }
      >
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/markets/:gameId" element={<TerminalPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />

        {/* Legacy route redirects (pre-redesign paths). */}
        <Route path="/feed" element={<Navigate to="/markets" replace />} />
        <Route path="/games" element={<Navigate to="/markets" replace />} />
        <Route path="/my-picks" element={<Navigate to="/positions" replace />} />
        <Route path="/leaderboard" element={<Navigate to="/portfolio" replace />} />
        <Route path="/create-pick" element={<CreatePickRedirect />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
