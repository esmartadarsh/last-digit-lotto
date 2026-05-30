import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSave, FiSmartphone, FiToggleLeft, FiToggleRight, FiDownload, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const FIRESTORE_DOC = { collection: 'config', id: 'app_version' };

export default function ManageAppVersion() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    version: '',
    apk_url: '',
    force_update: false,
    release_notes: '',
  });

  // Load current Firestore values on mount
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, FIRESTORE_DOC.collection, FIRESTORE_DOC.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            version: d.version ?? '',
            apk_url: d.apk_url ?? '',
            force_update: d.force_update ?? false,
            release_notes: d.release_notes ?? '',
          });
        }
      } catch (err) {
        toast.error('Failed to load version config: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!form.version.trim()) return toast.error('Version is required (e.g. 1.0.1)');
    if (!form.apk_url.trim()) return toast.error('APK download URL is required');

    setSaving(true);
    try {
      const ref = doc(db, FIRESTORE_DOC.collection, FIRESTORE_DOC.id);
      await setDoc(ref, {
        version: form.version.trim(),
        apk_url: form.apk_url.trim(),
        force_update: form.force_update,
        release_notes: form.release_notes.trim(),
        updated_at: new Date().toISOString(),
      });
      toast.success('✅ App version config saved! All users will see the prompt instantly.');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f1f5f9',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #334155', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiSmartphone size={22} color="#f87171" />
          </div>
          <div>
            <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>App Version Manager</h1>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Control APK update prompts shown to all users in real-time</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {/* <div style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '16px', padding: '14px 18px', display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-start' }}>
        <FiInfo size={18} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ color: '#93c5fd', fontSize: '13px', fontWeight: 700, margin: '0 0 4px' }}>How It Works</p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>
            Set the new version number and APK URL below, then click Save. Every user who has the app open will <strong style={{ color: '#cbd5e1' }}>instantly</strong> see an update prompt. Enable Force Update to prevent users from skipping it.
          </p>
        </div>
      </div> */}

      {/* Main Card */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', overflow: 'hidden' }}>
        {/* Card Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 800, margin: 0 }}>Version Configuration</h2>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Version Number */}
          <div>
            <label style={labelStyle}>Current Version Number *</label>
            <input
              type="text"
              placeholder="e.g. 1.0.1"
              value={form.version}
              onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#dc2626'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
            <p style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>
              Use semantic versioning: MAJOR.MINOR.PATCH — Users on any lower version will see the update prompt
            </p>
          </div>

          {/* APK URL */}
          <div>
            <label style={labelStyle}>
              <FiDownload size={11} style={{ marginRight: '4px' }} />
              APK Download URL *
            </label>
            <input
              type="url"
              placeholder="https://firebasestorage.googleapis.com/..."
              value={form.apk_url}
              onChange={e => setForm(f => ({ ...f, apk_url: e.target.value }))}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }}
              onFocus={e => e.target.style.borderColor = '#dc2626'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
            <p style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>
              Paste the Firebase Storage download link for the new APK. This also updates the download link on the Profile page.
            </p>
          </div>

          {/* Release Notes */}
          <div>
            <label style={labelStyle}>Release Notes (optional)</label>
            <textarea
              placeholder={'• Bug fixes and performance improvements\n• New feature: ...'}
              value={form.release_notes}
              onChange={e => setForm(f => ({ ...f, release_notes: e.target.value }))}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = '#dc2626'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
            <p style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>
              Shown inside the update banner. Supports line breaks.
            </p>
          </div>

          {/* Force Update Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '16px 20px' }}>
            <div>
              <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>Force Update</p>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                {form.force_update
                  ? '🔴 Users cannot dismiss the update — they MUST download'
                  : '🟡 Users can tap "Maybe Later" and skip the update'}
              </p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, force_update: !f.force_update }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: form.force_update ? '#dc2626' : '#475569', transition: 'color 0.2s' }}
            >
              {form.force_update
                ? <FiToggleRight size={40} />
                : <FiToggleLeft size={40} />}
            </button>
          </div>

          {/* Force Update Warning */}
          {form.force_update && (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '12px', padding: '12px 16px' }}>
              <p style={{ color: '#fca5a5', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>
                ⚠️ <strong>Force Update is ON.</strong> All users will be blocked until they download the new APK. Only use this for critical security fixes or breaking changes.
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ padding: '0 24px 24px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '14px',
              border: 'none',
              background: saving ? 'rgba(220,38,38,0.4)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: saving ? 'none' : '0 8px 24px rgba(220,38,38,0.35)',
              transition: 'all 0.2s',
            }}
          >
            <FiSave size={18} />
            {saving ? 'Saving to Firestore...' : 'Save & Notify All Users'}
          </button>
        </div>
      </div>

      {/* Preview Card */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', overflow: 'hidden', marginTop: '24px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 800, margin: 0 }}>Current Config Preview</h2>
        </div>
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'Version', value: form.version || '—' },
            { label: 'Force Update', value: form.force_update ? '🔴 Yes — Blocking' : '🟡 No — Optional' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#0f172a', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ color: '#475569', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{label}</p>
              <p style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>{value}</p>
            </div>
          ))}
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '14px 16px', gridColumn: '1 / -1' }}>
            <p style={{ color: '#475569', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>APK URL</p>
            <p style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 500, margin: 0, wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {form.apk_url || '—'}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}
