import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { useAuthStore } from './stores/auth.store';

export function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // Restores the session from a stored token on first load (page refresh, new tab).
  useEffect(() => {
    void restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
