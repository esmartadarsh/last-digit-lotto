import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { FiHome, FiClock, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin', icon: <FiHome size={20} /> },
    { label: 'Draws & Results', path: '/admin/draws', icon: <FiClock size={20} /> },
    { label: 'Users & Balances', path: '/admin/users', icon: <FiUsers size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <FiSettings size={20} /> },
  ];

  return (
    <div className="min-h-screen flex bg-[#0f172a] text-gray-100 font-sans">
      
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-[#1e293b] border-r border-[#334155] flex flex-col shrink-0">
        
        {/* Logo/Brand */}
        <div className="h-20 flex items-center px-6 border-b border-[#334155]">
          <div className="w-8 h-8 rounded-lg bg-red-500 mr-3 shadow-lg shadow-red-500/20"></div>
          <span className="font-bold text-xl tracking-tight">Admin Panel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-red-500/10 text-red-400 shadow-[inset_0px_0px_0px_1px_rgba(239,68,68,0.2)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile & Logout */}
        <div className="p-4 border-t border-[#334155]">
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate text-slate-200">{user?.name}</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{user?.role}</span>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>

      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 border-b border-[#334155] bg-[#1e293b]/50 backdrop-blur-sm shrink-0 flex items-center px-8 z-10 sticky top-0">
          <h2 className="text-xl font-semibold opacity-90">
            {NAV_ITEMS.find((n) => n.path === location.pathname)?.label || 'Admin Panel'}
          </h2>
          <div className="ml-auto flex items-center gap-4">
            <Link to="/" className="text-sm font-medium px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors">
               Switch to Web App ↗
            </Link>
          </div>
        </header>

        {/* Scrollable Page Outlet */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {/* Subtle background glow */}
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <Outlet />
        </div>

      </main>

    </div>
  );
}
