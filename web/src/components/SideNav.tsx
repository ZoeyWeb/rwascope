import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sideItems = [
  { to: '/market', icon: 'dashboard', label: 'Market' },
  { to: '/market?tab=protocols', icon: 'format_list_bulleted', label: 'Protocol Directory' },
  { to: '/methodology', icon: 'analytics', label: 'Methodology' },
];

const scoreItems = [
  { to: '/score', icon: 'rate_review', label: 'New Assessment' },
  { to: '/score/history', icon: 'history', label: 'My Reports' },
];

export default function SideNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col h-full py-4 bg-[#F1F4F6] w-64 border-r border-[#737C7F]/20 shrink-0">
      <div className="px-6 mb-8">
        <div className="text-lg font-black text-[#2B3437] tracking-tight font-headline">RWA-Index</div>
        <div className="text-[10px] uppercase tracking-widest text-[#737C7F] font-bold font-label">Academic Research Tool</div>
      </div>

      <nav className="flex-1 space-y-1">
        {sideItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/market'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-6 py-3 bg-[#EAEFF1] text-[#5E5C75] font-bold border-r-4 border-[#5E5C75] transition-all duration-100'
                : 'flex items-center gap-3 px-6 py-3 text-[#737C7F] hover:bg-[#DBE4E7] transition-all duration-100'
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}

        {/* RWA Score section */}
        <div className="px-6 pt-4 pb-1">
          <div className="text-[10px] uppercase tracking-widest text-[#737C7F]/60 font-bold font-label">
            Due Diligence
          </div>
        </div>

        {scoreItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/score'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-6 py-3 bg-[#EAEFF1] text-[#5E5C75] font-bold border-r-4 border-[#5E5C75] transition-all duration-100'
                : 'flex items-center gap-3 px-6 py-3 text-[#737C7F] hover:bg-[#DBE4E7] transition-all duration-100'
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Auth footer */}
      <div className="mt-auto px-6 py-4 border-t border-[#737C7F]/10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary" />
          <span className="text-[10px] font-bold text-on-surface-variant font-label">DATA: DEFILLAMA</span>
        </div>

        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#5E5C75] flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(user.full_name ?? user.email)[0].toUpperCase()}
              </div>
              <span className="text-xs text-[#737C7F] truncate">
                {user.full_name ?? user.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded hover:bg-[#DBE4E7] text-[#737C7F] hover:text-[#2B3437] transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-xs text-[#737C7F] hover:text-[#2B3437] transition-colors"
          >
            <span className="material-symbols-outlined text-base">login</span>
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
