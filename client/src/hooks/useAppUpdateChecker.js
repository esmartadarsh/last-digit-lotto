import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { APP_VERSION } from '../config/appVersion';

/**
 * Compares two semver strings (e.g. "1.0.0" vs "1.0.1").
 * Returns true if `remote` is strictly greater than `local`.
 */
function isNewerVersion(remote, local) {
  try {
    const r = remote.split('.').map(Number);
    const l = local.split('.').map(Number);
    for (let i = 0; i < Math.max(r.length, l.length); i++) {
      const rv = r[i] ?? 0;
      const lv = l[i] ?? 0;
      if (rv > lv) return true;
      if (rv < lv) return false;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * useAppUpdateChecker
 *
 * Subscribes to the Firestore document `config/app_version` in real-time.
 * If the remote version is newer than the locally-baked APP_VERSION,
 * it signals that an update is available.
 *
 * Returns:
 *   - updateAvailable {boolean}
 *   - forceUpdate     {boolean}  — if true, user cannot dismiss the banner
 *   - apkUrl          {string}   — download link for the new APK
 *   - releaseNotes    {string}   — what changed in this release
 *   - latestVersion   {string}   — the version string from Firestore
 */
export function useAppUpdateChecker() {
  const [state, setState] = useState({
    updateAvailable: false,
    forceUpdate: false,
    apkUrl: '',
    releaseNotes: '',
    latestVersion: '',
  });

  useEffect(() => {
    const docRef = doc(db, 'config', 'app_version');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const remoteVersion = data.version ?? '';
        console.log('neccesery',remoteVersion, APP_VERSION)
        const updateAvailable = isNewerVersion(remoteVersion, APP_VERSION);

        setState({
          updateAvailable,
          forceUpdate: updateAvailable ? (data.force_update ?? false) : false,
          apkUrl: data.apk_url ?? '',
          releaseNotes: data.release_notes ?? '',
          latestVersion: remoteVersion,
        });
      },
      (error) => {
        console.warn('[useAppUpdateChecker] Firestore listener error:', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  return state;
}
