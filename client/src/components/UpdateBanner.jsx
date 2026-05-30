import { useState } from 'react';
import { FiDownload, FiX, FiZap } from 'react-icons/fi';

/**
 * UpdateBanner
 *
 * Full-screen overlay shown when a newer APK version is available.
 * - If forceUpdate=true  → no close button; user must tap "Download Update"
 * - If forceUpdate=false → shows "Maybe Later" to dismiss
 */
export default function UpdateBanner({
  forceUpdate,
  apkUrl,
  releaseNotes,
  latestVersion,
  onDismiss,
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    if (!apkUrl) return;
    setDownloading(true);
    window.open(apkUrl, '_blank');
    // Reset after a short delay
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'linear-gradient(145deg, #1e1b4b 0%, #1e293b 100%)',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
          position: 'relative',
        }}
      >
        {/* Dismiss button — only shown when not forced */}
        {!forceUpdate && (
          <button
            onClick={onDismiss}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <FiX size={16} />
          </button>
        )}

        {/* Top accent gradient bar */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #dc2626, #7c3aed, #2563eb)',
          }}
        />

        {/* Icon + Header */}
        <div style={{ padding: '32px 28px 20px', textAlign: 'center' }}>
          {/* Animated icon ring */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 0 8px rgba(220,38,38,0.15), 0 0 0 16px rgba(220,38,38,0.07)',
              animation: 'pulse-ring 2s ease-in-out infinite',
            }}
          >
            <FiZap size={34} color="#fff" />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '20px',
              padding: '4px 12px',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {forceUpdate ? '🔴 Update Required' : '🟡 Update Available'}
            </span>
          </div>

          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            New Version {latestVersion}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: 0 }}>
            {forceUpdate
              ? 'A required update is available. Please update to continue using the app.'
              : 'A new version of the app is available with improvements and fixes.'}
          </p>
        </div>

        {/* Release notes */}
        {releaseNotes && (
          <div
            style={{
              margin: '0 28px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '14px 16px',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              What's New
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
              {releaseNotes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleDownload}
            disabled={downloading || !apkUrl}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              background: downloading
                ? 'rgba(220,38,38,0.5)'
                : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              cursor: downloading || !apkUrl ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(220,38,38,0.4)',
              transition: 'all 0.2s',
              transform: 'translateY(0)',
            }}
            onMouseEnter={e => { if (!downloading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <FiDownload size={18} />
            {downloading ? 'Opening Download...' : `Download v${latestVersion}`}
          </button>

          {!forceUpdate && (
            <button
              onClick={onDismiss}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 8px rgba(220,38,38,0.15), 0 0 0 16px rgba(220,38,38,0.07); }
          50%       { box-shadow: 0 0 0 12px rgba(220,38,38,0.2), 0 0 0 24px rgba(220,38,38,0.04); }
        }
      `}</style>
    </div>
  );
}
