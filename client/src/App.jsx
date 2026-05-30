import { useEffect, useState } from 'react';
import useAuthStore from './store/useAuthStore';
import AppRoutes from './routes/route';
import { useAppUpdateChecker } from './hooks/useAppUpdateChecker';
import UpdateBanner from './components/UpdateBanner';

// Update banner is only relevant on the APK build.
// Web users always get the latest version automatically on page load.
const IS_APK = import.meta.env.VITE_PLATFORM !== 'web';

function App() {
  const { initAuthListener } = useAuthStore();
  const { updateAvailable, forceUpdate, apkUrl, releaseNotes, latestVersion } = useAppUpdateChecker();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  // Reset dismissed state whenever a brand-new version comes in
  useEffect(() => {
    if (updateAvailable) setDismissed(false);
  }, [latestVersion, updateAvailable]);

  // Only show on APK — never on the website
  const showBanner = IS_APK && updateAvailable && !dismissed;

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