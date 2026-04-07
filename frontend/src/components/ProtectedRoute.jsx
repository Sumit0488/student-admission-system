import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps admin routes — redirects to /login if not authenticated.
 * While the initial auth check is still in progress, renders nothing
 * to avoid a flash of the login page for already-logged-in users.
 */
export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();

  if (!ready) return null; // still checking localStorage token
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
