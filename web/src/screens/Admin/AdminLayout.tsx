import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin',             icon: 'dashboard',          label: 'Overview',        end: true },
  { to: '/admin/users',       icon: 'group',              label: 'Users'            },
  { to: '/admin/assessments', icon: 'assignment',         label: 'Assessments'      },
  { to: '/admin/audit-log',   icon: 'policy',             label: 'Audit Log'        },
  { to: '/admin/export',      icon: 'download',           label: 'Export'           },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F4F6]">
      {/* ── Sidebar ── */}
      <aside className="flex flex-col w-56 shrink-0 bg-[#2B3437] text-white">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-base font-black tracking-tight">RWA-Index</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-0.5">
            Admin Console
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-5 py-2.5 bg-white/10 text-white font-semibold border-r-2 border-white text-sm'
                  : 'flex items-center gap-3 px-5 py-2.5 text-white/60 hover:bg-white/5 hover:text-white transition-colors text-sm'
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors w-full"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
            Back to App
          </button>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 truncate max-w-[120px]">{user?.email}</span>
            <button
              onClick={logout}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
