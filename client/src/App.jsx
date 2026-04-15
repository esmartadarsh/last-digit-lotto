import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Layouts
import AppLayout from './components/Layout/AppLayout';
import AdminLayout from './pages/admin/AdminLayout';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import Balance from './pages/Balance';
import Profile from './pages/Profile';
import BuyLotteryTicket from './pages/BuyLotteryTicket';
import BuyAbcTicket from './pages/BuyAbcTicket/index';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDraws from './pages/admin/ManageDraws';
import ManageUsers from './pages/admin/ManageUsers';

// ── Hard Auth Guard: blocks the route entirely, redirects to /login ──
function RequireAuth({ children, requireAdmin }) {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5fb]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ── Soft Auth Gate: lets you VIEW the page but shows a login prompt if not authed ──
// Use this for pages like Balance & Profile that need auth to do anything useful
function SoftAuthGate({ children }) {
  const { user, isLoading, loginWithGoogle } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5fb]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    // Show an inline prompt within the mobile shell instead of redirecting
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-xl font-black text-gray-800 mb-2">Sign In Required</h2>
        <p className="text-sm text-gray-500 mb-6">You need to sign in to access this page.</p>
        <button
          onClick={async () => {
            try {
              await loginWithGoogle();
            } catch (e) {
              toast.error('Login failed: ' + e.message);
            }
          }}
          className="w-full max-w-xs py-3.5 rounded-2xl font-bold text-white active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', boxShadow: '0 8px 24px rgba(220,38,38,0.35)' }}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return children;
}

function App() {
  const { initAuthListener } = useAuthStore();

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#333', color: '#fff', borderRadius: '12px' },
          success: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />

      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* 📱 USER MOBILE APP — AppLayout wraps all user-facing pages */}
          <Route path="/" element={<AppLayout />}>
            {/* Freely accessible — no auth needed */}
            <Route index element={<Home />} />
            <Route path="tickets" element={<MyTickets />} />

            {/* Soft-gated: visible shell, but requires sign-in to use */}
            <Route path="balance" element={<SoftAuthGate><Balance /></SoftAuthGate>} />
            <Route path="profile" element={<SoftAuthGate><Profile /></SoftAuthGate>} />

            {/* Hard-gated: buying tickets always requires auth */}
            <Route path="abc-ticket/:game" element={<RequireAuth><BuyAbcTicket /></RequireAuth>} />
            <Route path="lottery-ticket/:game" element={<RequireAuth><BuyLotteryTicket /></RequireAuth>} />
          </Route>

          {/* 💻 ADMIN DESKTOP DASHBOARD */}
          {import.meta.env.VITE_PLATFORM === 'web' && (
            <Route
              path="/admin"
              element={
                <RequireAuth requireAdmin={true}>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="draws" element={<ManageDraws />} />
              <Route path="users" element={<ManageUsers />} />
            </Route>
          )}

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;