import { useState } from 'react';
import toast from 'react-hot-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import api from '../config/api';
import { FiSettings, FiHelpCircle, FiLogOut, FiChevronRight, FiCreditCard, FiBell, FiShield, FiGift, FiEdit2, FiX, FiCamera } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';

const MENU_ITEMS = [
  // {
  //   icon: FiCreditCard, label: 'Payment Methods', sub: 'Cards & UPI linked',
  //   iconBg: '#eff6ff', iconColor: '#2563eb',
  //   badge: null,
  // },
  {
    icon: FiBell, label: 'Notifications', sub: 'Alerts & updates',
    iconBg: '#fff7ed', iconColor: '#ea580c',
    badge: '3',
  },
  // {
  //   icon: FiShield, label: 'Security', sub: '2FA enabled',
  //   iconBg: '#f0fdf4', iconColor: '#16a34a',
  //   badge: null,
  // },
  // {
  //   icon: FiGift, label: 'Refer & Earn', sub: 'Get ₹200 per referral',
  //   iconBg: '#fdf4ff', iconColor: '#9333ea',
  //   badge: 'NEW',
  // },
  // {
  //   icon: FiSettings, label: 'Account Settings', sub: 'Preferences & data',
  //   iconBg: '#f9fafb', iconColor: '#6b7280',
  //   badge: null,
  // },
  {
    icon: FiHelpCircle, label: 'Help & Support', sub: '24/7 live chat',
    iconBg: '#eff6ff', iconColor: '#0284c7',
    badge: null,
  },
];

const STATS = [
  { label: 'Tickets', value: '24', color: '#4f46e5' },
  { label: 'Wins', value: '3', color: '#059669' },
  { label: 'Total Won', value: '₹900', color: '#dc2626' },
];

export default function Profile() {
  const { user, logout, refreshProfile } = useAuthStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditAvatar(null);
    setAvatarPreview(user?.avatar_url || null);
    setIsEditModalOpen(true);
  };

  const handleAvatarSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return toast.error('Name cannot be empty');
    setIsSaving(true);
    try {
      let avatar_url = user.avatar_url;
      if (editAvatar) {
        toast.loading('Uploading photo...', { id: 'avatar-upload' });
        // Using profile-images path
        const imgRef = ref(storage, `profile-images/avatar_${user.id}_${Date.now()}.webp`);
        const snapshot = await uploadBytes(imgRef, editAvatar, { contentType: editAvatar.type });
        avatar_url = await getDownloadURL(snapshot.ref);
        toast.dismiss('avatar-upload');
      }

      await api.put('/users/me', { name: editName, avatar_url });
      await refreshProfile();
      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
      toast.dismiss('avatar-upload');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="pb-4">

        {/* ── Header Band ── */}
        <div
          className="relative px-5 pt-10 pb-20 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 40%, #7c3aed 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/8" />
          <div className="absolute top-4 left-10 w-3 h-3 rounded-full bg-white/30" />
          <div className="absolute top-8 right-16 w-2 h-2 rounded-full bg-yellow-300/60" />
        </div>

        {/* ── Profile Card (overlapping header) ── */}
        <div className="px-4 -mt-16 relative">
          <div
            className="relative bg-white rounded-3xl p-5 text-center"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
          >
            <button
              onClick={openEditModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 cursor-pointer"
            >
              <FiEdit2 size={18} />
            </button>
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div
                className="w-24 h-24 rounded-full mx-auto overflow-hidden flex items-center justify-center"
                style={{
                  border: '4px solid #ffffff',
                  boxShadow: '0 0 0 3px #dc2626, 0 8px 24px rgba(220,38,38,0.3)',
                  background: user?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #dc2626, #7c3aed)',
                }}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-white">
                    {(user?.name || 'P').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-xl font-black text-gray-900 tracking-tight">{user?.name || 'Player'}</h1>
            <p className="text-gray-400 text-sm font-medium mt-0.5">{user?.email || user?.phone || ''}</p>

            {/* Verified + Level badges */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ background: '#d1fae5', color: '#065f46' }}
              >
                ✓ Verified Player
              </span>
              {/* <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
              style={{ background: '#fef3c7', color: '#92400e' }}
            >
              ⭐ Gold Level
            </span> */}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="px-4 mt-4">
          <div
            className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}
          >
            {STATS.map((s, i) => (
              <div key={i} className="py-4 text-center bg-white">
                <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Promo Banner ── */}
        {/* <div className="px-4 mt-4">
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            border: '1px solid #fcd34d',
          }}
        >
          <span className="text-3xl">🎁</span>
          <div className="flex-1">
            <p className="font-black text-amber-900 text-sm">Refer & Earn</p>
            <p className="text-amber-700 text-xs font-medium mt-0.5">Invite friends, earn ₹200 each!</p>
          </div>
          <button
            className="px-3 py-2 rounded-xl text-xs font-black text-white active:scale-95 transition-all"
            style={{ background: '#f59e0b' }}
          >
            Invite →
          </button>
        </div>
      </div> */}

        {/* ── Menu ── */}
        <div className="px-4 mt-4">
          <div
            className="rounded-2xl overflow-hidden bg-white"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}
          >
            {MENU_ITEMS.map((item, idx) => (
              <button
                key={idx}
                className="w-full flex items-center justify-between px-4 py-3.5 transition-all active:bg-gray-50 group"
                style={{
                  borderBottom: idx < MENU_ITEMS.length - 1 ? '1px solid #f9fafb' : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.iconBg }}
                  >
                    <item.icon style={{ width: 18, height: 18, color: item.iconColor }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.sub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-black"
                      style={
                        item.badge === 'NEW'
                          ? { background: '#fdf4ff', color: '#9333ea' }
                          : { background: '#fee2e2', color: '#dc2626' }
                      }
                    >
                      {item.badge}
                    </span>
                  )}
                  <FiChevronRight className="text-gray-300 group-hover:text-gray-500 transition-colors w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Log Out ── */}
        <div className="px-4 mt-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all"
            style={{
              background: '#fff1f2',
              border: '1.5px solid #fecdd3',
              color: '#dc2626',
            }}
          >
            <FiLogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>



      </div>

      {/* ── Edit Profile Modal ── */}
      {
        isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ zIndex: 51 }}>
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-black text-gray-900">Edit Profile</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-6">
                {/* Avatar upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center"
                      style={{ background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #dc2626, #7c3aed)' }}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-white">
                          {(user?.name || 'P').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 shadow-md transition-colors">
                      <FiCamera size={14} />
                      <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                    </label>
                  </div>
                  <p className="text-xs font-medium text-gray-400 mt-3">Tap camera icon to change</p>
                </div>

                {/* Name input */}
                <div className="mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
}
