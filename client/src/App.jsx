import { useEffect, useState } from 'react';
import useAuthStore from './store/useAuthStore';
import AppRoutes from './routes/route';
import { useAppUpdateChecker } from './hooks/useAppUpdateChecker';
import UpdateBanner from './components/UpdateBanner';
import { Capacitor } from '@capacitor/core';

// Capacitor.isNativePlatform() returns true ONLY when running as a real
// Android/iOS APK — always false in a web browser, regardless of build config.
const IS_APK = Capacitor.isNativePlatform();

function App() {
  const justToChECK = Capacitor.isNativePlatform()
  console.log(justToChECK, 'see the console')
  const { initAuthListener, user } = useAuthStore();
  const { updateAvailable, forceUpdate, apkUrl, releaseNotes, latestVersion } = useAppUpdateChecker();
  const [dismissed, setDismissed] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  // Reset dismissed state whenever a brand-new version comes in
  useEffect(() => {
    if (updateAvailable) setDismissed(false);
  }, [latestVersion, updateAvailable]);

  // Only show on APK — never on the website — and never to admins
  const showBanner = IS_APK && updateAvailable && !dismissed && !isAdmin;

  return (
    <>
      <AppRoutes />
      {showBanner && (
        <UpdateBanner
          forceUpdate={forceUpdate}
          apkUrl={apkUrl}
          releaseNotes={releaseNotes}
          latestVersion={latestVersion}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </>
  );
}

export default App;