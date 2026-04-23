import { create } from 'zustand';
import axios from 'axios';
import { auth, googleProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const setupRecaptcha = async (auth) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      }
    );
    // 👇 IMPORTANT: wait for render
    await window.recaptchaVerifier.render();
  }
};

const useAuthStore = create((set, get) => ({
  user: null,         // MySQL user object (contains balance, role, etc)
  fbUser: null,       // Raw Firebase user object
  token: null,        // Firebase Bearer token
  isLoading: true,    // True while checking auth state on load
  error: null,

  // -- Phone OTP state --
  confirmationResult: null, // Returned by signInWithPhoneNumber

  // Called in App.jsx to listen to Firebase auth state
  initAuthListener: async () => {
    // Check for admin token in localStorage first
    const adminToken = localStorage.getItem('admin_token');

    if (adminToken) {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/admin/me`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        set({
          user: res.data.user,
          token: adminToken,
          isLoading: false
        });
        return; // Skip Firebase listener completely if authenticated as admin
      } catch (err) {
        console.error("Admin token invalid or expired", err);
        localStorage.removeItem('admin_token');
        set({ token: null, user: null });
      }
    }

    // Default: Normal user via Firebase
    onAuthStateChanged(auth, async (firebaseUser) => {
      // If an admin is already logged in (checked synchronously via state if somehow this triggers), ignore.
      if (get().user?.role === 'admin' || get().user?.role === 'superadmin') return;

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          // Sync with our backend to get the full profile (balance, role, etc)
          const response = await axios.post(`${API_BASE_URL}/auth/sync`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });

          set({
            fbUser: firebaseUser,
            token,
            user: response.data.user,
            isLoading: false,
            confirmationResult: null,
          });
        } catch (err) {
          console.error("Auth sync error:", err);
          set({ fbUser: null, token: null, user: null, isLoading: false, error: err.message });
        }
      } else {
        // Logged out
        set({ fbUser: null, token: null, user: null, isLoading: false });
      }
    });
  },

  // Admin Manual Login
  loginAdminWithPassword: async (phone, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axios.post(`${API_BASE_URL}/auth/admin/login`, { phone, password });

      const { token, user } = res.data;
      localStorage.setItem('admin_token', token);

      set({
        user,
        token,
        isLoading: false,
      });
    } catch (err) {
      console.error("Admin login error:", err);
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      await signInWithPopup(auth, googleProvider);
      // The onAuthStateChanged listener will automatically pick up the new user
    } catch (err) {
      console.error("Google sign in error:", err);
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  // Step 1: Send OTP to phone number
  // phoneNumber must be in E.164 format: e.g. +919876543210
  loginWithPhone: async (phoneNumber) => {
    try {
      set({ error: null });

      await setupRecaptcha(auth);

      const appVerifier = window.recaptchaVerifier;

      await appVerifier.verify();
      console.log(auth, phoneNumber, appVerifier, 'see this')


      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );


      set({ confirmationResult });
      return confirmationResult;

    } catch (err) {
      console.error("Phone sign in error:", err);
      set({ error: err.message });
      throw err;
    }
  },

  // Step 2: Verify the OTP entered by user
  verifyOtp: async (otp) => {
    const { confirmationResult } = get();
    if (!confirmationResult) throw new Error('No pending OTP. Request one first.');
    try {
      set({ isLoading: true, error: null });
      await confirmationResult.confirm(otp);
      // onAuthStateChanged will handle the rest (sync profile, set user, etc)
    } catch (err) {
      console.error("OTP verification error:", err);
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  logout: async () => {
    try {
      // Clear admin token if present
      localStorage.removeItem('admin_token');

      // Firebase logout (safe even if admin)
      await signOut(auth);

      // Clear reCAPTCHA if it was created
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      set({ fbUser: null, token: null, user: null, confirmationResult: null });
    } catch (err) {
      console.error("Logout error:", err);
    }
  },

  // Helper to quickly reload wallet balance after a purchase
  refreshProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const resp = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: resp.data.user });
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }
}));

export default useAuthStore;
