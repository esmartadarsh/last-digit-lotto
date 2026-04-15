import { Navigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { LuWallet } from 'react-icons/lu';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, loginWithGoogle, isLoading } = useAuthStore();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success('Successfully logged in!');
    } catch (err) {
      toast.error('Login failed: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex justify-center"
        style={{ background: 'linear-gradient(160deg, #e8eaf6 0%, #f0f2f8 50%, #fce4ec 100%)' }}
      >
        <div
          className="relative w-full max-w-[430px] min-h-screen flex items-center justify-center bg-white"
          style={{ boxShadow: '0 0 60px rgba(0,0,0,0.12)' }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  // Already logged in — redirect
  if (user) {
    if ((user.role === 'admin' || user.role === 'superadmin') && import.meta.env.VITE_PLATFORM === 'web') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: 'linear-gradient(160deg, #e8eaf6 0%, #f0f2f8 50%, #fce4ec 100%)' }}
    >
      {/* Same max-w-430px mobile shell as AppLayout */}
      <div
        className="relative w-full max-w-[430px] min-h-screen flex flex-col overflow-hidden"
        style={{
          background: '#0f172a',
          boxShadow: '0 0 60px rgba(0,0,0,0.12), 0 20px 80px rgba(220,38,38,0.08)',
        }}
      >
        {/* Background glow blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full flex flex-col items-center text-center">

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 mb-6">
              <LuWallet size={40} className="text-white" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Last Digit Lotto</h1>
            <p className="text-gray-400 text-sm mb-10">Sign in to start playing and winning today.</p>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 px-4 rounded-2xl flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold transition-all active:scale-[0.98] shadow-xl"
            >
              <FcGoogle size={24} />
              <span>Continue with Google</span>
            </button>

            <p className="mt-6 text-xs text-gray-500">By signing in, you agree to our Terms &amp; Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
