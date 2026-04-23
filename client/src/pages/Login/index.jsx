import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { LuWallet } from 'react-icons/lu';
import { FiPhone, FiArrowLeft, FiChevronRight } from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

// OTP Input — 6 individual boxes
function OtpInput({ value, onChange }) {
  const digits = value.split('');
  const handleKey = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx]) {
      const prev = document.getElementById(`otp-${idx - 1}`);
      if (prev) prev.focus();
    }
  };
  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = [...digits];
    arr[idx] = val;
    onChange(arr.join(''));
    if (val) {
      const next = document.getElementById(`otp-${idx + 1}`);
      if (next) next.focus();
    }
  };
  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="tel"
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          className="w-12 h-14 rounded-xl text-center text-xl font-black text-white bg-white/10 border-2 border-white/20 focus:border-red-400 focus:outline-none transition-colors"
        />
      ))}
    </div>
  );
}

export default function Login() {
  const { user, loginWithGoogle, loginWithPhone, verifyOtp, isLoading, confirmationResult } = useAuthStore();
  const navigate = useNavigate();

  // 'method' → null = choose, 'phone' = enter number, 'otp' = enter OTP
  const [step, setStep] = useState('choose'); // 'choose' | 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setBusy(true);
      await loginWithGoogle();
      toast.success('Logged in with Google!');
    } catch (err) {
      toast.error('Google login failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async () => {
    // Validate phone — add +91 if not already E.164
    let formatted = phone.trim();
    if (!formatted.startsWith('+')) formatted = '+91' + formatted;
    if (formatted.length < 10) return toast.error('Enter a valid phone number');
    try {
      setBusy(true);
      await loginWithPhone(formatted);
      setStep('otp');
      toast.success('OTP sent! Check your messages.');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return toast.error('Enter the 6-digit OTP');
    try {
      setBusy(true);
      await verifyOtp(otp);
      toast.success('Logged in successfully!');
    } catch (err) {
      toast.error(err.message.includes('invalid-verification-code')
        ? 'Wrong OTP. Please try again.'
        : err.message || 'OTP verification failed');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex justify-center"
        style={{ background: 'linear-gradient(160deg, #e8eaf6 0%, #f0f2f8 50%, #fce4ec 100%)' }}
      >
        <div
          className="relative w-full max-w-[430px] min-h-screen flex items-center justify-center bg-[#0f172a]"
          style={{ boxShadow: '0 0 60px rgba(0,0,0,0.12)' }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  // Already logged in — redirect
  if (user) {
    return <Navigate to="/" replace />;
  }


  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: 'linear-gradient(160deg, #e8eaf6 0%, #f0f2f8 50%, #fce4ec 100%)' }}
    >
      {/* reCAPTCHA anchor — always mounted, Firebase requires it to persist in DOM */}
      <div id="recaptcha-container" style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}></div>

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

        {step === 'choose' && (
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
          >
            <FiArrowLeft size={20} />
            <span>Back</span>
          </button>
        )}

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full flex flex-col items-center text-center">

            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 mb-6">
              <LuWallet size={40} className="text-white" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Last Digit Lotto</h1>
            <p className="text-gray-400 text-sm mb-10">Sign in to start playing and winning today.</p>

            {/* ── STEP: CHOOSE ── */}
            {step === 'choose' && (
              <div className="w-full flex flex-col gap-4">
                {/* Google */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={busy}
                  className="w-full py-4 px-4 rounded-2xl flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold transition-all active:scale-[0.98] shadow-xl disabled:opacity-60"
                >
                  <FcGoogle size={24} />
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-gray-500 text-xs font-medium">OR</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* Phone */}
                <button
                  onClick={() => setStep('phone')}
                  className="w-full py-4 px-4 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    color: '#e2e8f0',
                  }}
                >
                  <FiPhone size={20} className="text-red-400" />
                  <span>Continue with Phone Number</span>
                </button>

                <p className="mt-4 text-xs text-gray-500">
                  By signing in, you agree to our Terms &amp; Privacy Policy.
                </p>
              </div>
            )}

            {/* ── STEP: ENTER PHONE ── */}
            {step === 'phone' && (
              <div className="w-full flex flex-col gap-5">
                <button
                  onClick={() => setStep('choose')}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium self-start"
                >
                  <FiArrowLeft size={16} /> Back
                </button>

                <div className="text-left mb-2">
                  <h2 className="text-xl font-bold text-white">Enter your number</h2>
                  <p className="text-gray-400 text-sm mt-1">We'll send a 6-digit OTP to verify.</p>
                </div>

                <div
                  className="flex items-center gap-3 rounded-2xl px-4"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {/* Country prefix */}
                  <span className="text-white font-bold text-sm shrink-0 py-4 border-r border-white/10 pr-3">🇮🇳 +91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="flex-1 py-4 bg-transparent text-white placeholder-gray-500 font-medium focus:outline-none text-sm"
                  />
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={busy || phone.length < 10}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                  style={{
                    background: phone.length >= 10
                      ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: phone.length >= 10 ? '0 8px 24px rgba(220,38,38,0.35)' : 'none',
                  }}
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Send OTP <FiChevronRight size={18} /></>
                  )}
                </button>
              </div>
            )}

            {/* ── STEP: ENTER OTP ── */}
            {step === 'otp' && (
              <div className="w-full flex flex-col gap-5">
                <button
                  onClick={() => { setStep('phone'); setOtp(''); }}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium self-start"
                >
                  <FiArrowLeft size={16} /> Back
                </button>

                <div className="text-left mb-2">
                  <h2 className="text-xl font-bold text-white">Enter OTP</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Sent to <span className="text-white font-semibold">+91 {phone}</span>
                  </p>
                </div>

                <OtpInput value={otp} onChange={setOtp} />

                <button
                  onClick={handleVerifyOtp}
                  disabled={busy || otp.length < 6}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                  style={{
                    background: otp.length === 6
                      ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: otp.length === 6 ? '0 8px 24px rgba(220,38,38,0.35)' : 'none',
                  }}
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                <button
                  onClick={handleSendOtp}
                  disabled={busy}
                  className="text-sm text-gray-400 hover:text-red-400 transition-colors font-medium"
                >
                  Didn't receive it? Resend OTP
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
