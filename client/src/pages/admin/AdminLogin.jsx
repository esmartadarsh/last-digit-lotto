import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FiShield, FiPhone, FiLock } from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { user, loginAdminWithPassword, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Please enter both phone number and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginAdminWithPassword(phone, password);
      // Wait for React to re-render, the Navigate component below will take over
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already logged in, check role
  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        // Do nothing, handled by Navigate below
      } else {
        toast.error("Access Denied: You do not have admin privileges.");
        logout(); // Kick them out if they tried to login via admin portal but aren't admin
      }
    }
  }, [user, isLoading, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Already logged in and is admin
  if (user && (user.role === 'admin' || user.role === 'superadmin')) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 text-white font-sans">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 [50%] h-[50%] bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-0 -right-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-slate-700/50 p-8 md:p-12 rounded-3xl max-w-md w-full shadow-2xl relative z-10 flex flex-col items-center">

        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 shadow-inner">
          <FiShield className="text-red-500 w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Portal</h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          Sign in with your authorized phone number and password.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiPhone className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Admin Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiLock className="text-slate-400" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/50 w-full text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
          >
            Return to Main Site
          </button>
        </div>

      </div>
    </div>
  );
}
