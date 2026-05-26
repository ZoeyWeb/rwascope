import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard for /admin.
 * - Not logged in → /login
 * - Logged in but not admin → 403 page
 * - Admin → render children
 */
export default function RequireAdmin() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F1F4F6]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!user.is_admin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F1F4F6]">
        <div className="text-center">
          <div className="text-6xl font-black text-[#5E5C75] mb-4">403</div>
          <div className="text-lg text-[#2B3437] font-bold mb-2">Access Denied</div>
          <div className="text-sm text-[#737C7F]">Administrator access required.</div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
