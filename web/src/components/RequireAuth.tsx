import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps protected routes.
 * - Not logged in → /login (preserving intended destination)
 * - Logged in but status != active → /account-pending
 * - Active → render children
 */
export default function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.status !== 'active') {
    return <Navigate to="/account-pending" replace />;
  }

  return <Outlet />;
}
