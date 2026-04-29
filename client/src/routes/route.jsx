// route.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/useAuthStore';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Layouts
import AppLayout from '@/components/Layout/AppLayout';
import AdminLayout from '@/pages/admin/AdminLayout';

// Pages
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import MyTickets from '@/pages/MyTickets';
import Balance from '@/pages/Balance';
import Profile from '@/pages/Profile';
import BuyLotteryTicket from '@/pages/BuyLotteryTicket';
import BuyAbcTicket from '@/pages/BuyAbcTicket';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageDraws from '@/pages/admin/ManageDraws';
import ManageUsers from '@/pages/admin/ManageUsers';
import ManageLotteryGame from '@/pages/admin/ManageLotteryGame';
import ManageAbcGame from '@/pages/admin/ManageAbcGame';
import AdminLogin from '@/pages/admin/AdminLogin';

// ── Hard Auth Guard ──
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
        if (location.pathname.startsWith('/admin')) {
            return <Navigate to="/admin/login" state={{ from: location }} replace />;
        }
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && user.role !== 'admin' && user.role !== 'superadmin') {
        return <Navigate to="/" replace />;
    }

    return children;
}

// ── Soft Auth Gate ──
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
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
                <h2 className="text-xl font-black mb-2">Sign In Required</h2>
                <button
                    onClick={async () => {
                        try {
                            await loginWithGoogle();
                        } catch (e) {
                            toast.error('Login failed: ' + e.message);
                        }
                    }}
                    className="py-3 px-6 rounded-xl bg-red-500 text-white"
                >
                    Sign in with Google
                </button>
            </div>
        );
    }

    return children;
}

export default function AppRoutes() {
    return (
        <>
            <Toaster position="top-center" />

            <Router>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />

                    {/* User */}
                    <Route path="/" element={<AppLayout />}>
                        <Route index element={<Home />} />
                        <Route path="tickets" element={<MyTickets />} />

                        <Route path="balance" element={
                            <RequireAuth><Balance /></RequireAuth>
                        } />

                        <Route path="profile" element={
                            <RequireAuth><Profile /></RequireAuth>
                        } />
                        {/* No auth required to browse — login is only enforced at purchase time */}
                        <Route path="abc-ticket/:game" element={<BuyAbcTicket />} />
                        <Route path="lottery-ticket/:game" element={<BuyLotteryTicket />} />
                    </Route>

                    {/* Admin */}
                    {import.meta.env.VITE_PLATFORM === 'web' && (
                        <>
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route
                                path="/admin"
                                element={
                                    <RequireAuth requireAdmin>
                                        <AdminLayout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<AdminDashboard />} />
                                <Route path="draws" element={<ManageDraws />} />
                                <Route path="lottery" element={<ManageLotteryGame />} />
                                <Route path="abc" element={<ManageAbcGame />} />
                                <Route path="users" element={<ManageUsers />} />
                            </Route>
                        </>
                    )}

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </>
    );
}