import { Navigate } from 'react-router-dom';
import { accessStore } from '@/lib/access';

export function AccessGate({ children }: { children: React.ReactNode }) {
  if (!accessStore.granted) return <Navigate to="/" replace />;
  return <>{children}</>;
}
