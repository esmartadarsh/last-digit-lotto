import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiDollarSign, FiAlertTriangle, FiPlayCircle } from "react-icons/fi";

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "#f4f5fb" }}>
      {/* ── Header ── */}
      <div
        className="relative p-2 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 40%, #7c3aed 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/8" />
        <div className="absolute top-4 left-10 w-3 h-3 rounded-full bg-white/30" />
        <div className="absolute top-8 right-16 w-2 h-2 rounded-full bg-yellow-300/60" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="relative z-10 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <FiArrowLeft size={20} />
          <span className="text-sm font-semibold">Back</span>
        </button>

        <div className="relative z-10 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          >
            <FiInfo size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">About Us</h1>
          <p className="text-white/70 text-sm mt-1 font-medium">Last Digit Lotto</p>
        </div>
      </div>

      {/* ── Content Cards ── */}
      <div className="px-4 mt-6 pb-10 space-y-4">

        {/* How to Play */}
        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        >
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#2563eb" }}
            >
              <FiPlayCircle size={18} className="text-white" />
            </div>
            <h2 className="text-base font-black text-blue-900 uppercase tracking-wider">
              How to Play
            </h2>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              Welcome to{" "}
              <span className="font-black text-gray-900">[LAST DIGIT LOTTO]</span>—your
              go-to platform for exciting games and real-time results! Whether you're
              looking to play, track your progress, or see if you've won, everything is
              right at your fingertips. Our game results are instantly uploaded to
              YouTube, and you can check them right inside the app.
            </p>
          </div>
        </div>

        {/* Deposits & Withdrawals */}
        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        >
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#16a34a" }}
            >
              <FiDollarSign size={18} className="text-white" />
            </div>
            <h2 className="text-base font-black text-green-900 uppercase tracking-wider">
              Deposits &amp; Withdrawals Policy
            </h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            {/* Deposit */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style={{ background: "#dcfce7", color: "#15803d" }}
                >
                  Deposit
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 leading-relaxed">
                In <span className="font-black text-gray-900">[LAST DIGIT LOTTO]</span>,
                deposits are simple and secure. You can deposit funds using{" "}
                <span className="font-bold text-gray-800">UPI only</span>. After you make
                your payment, you will need to enter the{" "}
                <span className="font-bold text-gray-800">
                  UTR (Unique Transaction Reference)
                </span>{" "}
                number in the app to confirm your deposit.
              </p>
            </div>

            <div
              className="h-px"
              style={{ background: "linear-gradient(to right, transparent, #e5e7eb, transparent)" }}
            />

            {/* Withdrawal */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style={{ background: "#dbeafe", color: "#1d4ed8" }}
                >
                  Withdrawal
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 leading-relaxed">
                For withdrawals, you can choose between{" "}
                <span className="font-bold text-gray-800">UPI and bank transfer</span>.
                Once requested, withdrawals will be processed within{" "}
                <span className="font-bold text-gray-800">30 minutes</span>. Please
                ensure your account is verified before transacting. Note that standard
                UPI or bank charges may apply.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        >
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #fff7ed, #fed7aa)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#ea580c" }}
            >
              <FiAlertTriangle size={18} className="text-white" />
            </div>
            <h2 className="text-base font-black text-orange-900 uppercase tracking-wider">
              Disclaimer
            </h2>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              <span className="font-black text-gray-900">[Last Digit Lotto]</span> is
              intended for{" "}
              <span className="font-bold text-gray-800">entertainment purposes only</span>
              . We do not guarantee any winnings or outcomes. Users are responsible for
              their own participation and any financial transactions. We are not liable
              for any losses or damages incurred. Please{" "}
              <span className="font-bold text-orange-600">play responsibly</span>.
            </p>
          </div>
        </div>

        {/* Footer branding */}
        <div className="text-center pt-2 pb-4">
          <p className="text-xs text-gray-400 font-medium">
            © 2026 Last Digit Lotto · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
