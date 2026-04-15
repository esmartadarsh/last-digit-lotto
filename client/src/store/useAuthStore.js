import { create } from 'zustand';
import axios from 'axios';
import { auth, googleProvider, signInWithPopup } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const API_BASE_URL = 'http://localhost:3000/api';

const useAuthStore = create((set, get) => ({
  user: null,         // MySQL user object (contains balance, role, etc)
  fbUser: null,       // Raw Firebase user object
  token: null,        // Firebase Bearer token
  isLoading: true,    // True while checking auth state on load
  error: null,

  // Called in App.jsx to listen to Firebase auth state
  initAuthListener: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
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
            isLoading: false 
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

  logout: async () => {
    try {
      await signOut(auth);
      set({ fbUser: null, token: null, user: null });
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
