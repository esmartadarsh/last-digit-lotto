import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  const location = useLocation();

  // allowed routes for bottom nav
  const showBottomNavRoutes = ['/', '/tickets', '/balance', '/profile'];

  const showBottomNav = showBottomNavRoutes.includes(location.pathname);

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: 'linear-gradient(160deg, #e8eaf6 0%, #f0f2f8 50%, #fce4ec 100%)' }}
    >
      <div
        className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-white"
        style={{
          boxShadow: '0 0 60px rgba(0,0,0,0.12), 0 20px 80px rgba(220,38,38,0.08)',
        }}
      >
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
          style={{ background: '#f4f5fb' }}
        >
          <Outlet />
        </main>

        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}