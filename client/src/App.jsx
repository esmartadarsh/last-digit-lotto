import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import AppRoutes from './routes/route';

function App() {
  const { initAuthListener } = useAuthStore();

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  return <AppRoutes />;
}

export default App;