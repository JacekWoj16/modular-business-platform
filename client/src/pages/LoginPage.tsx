import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

/** Login form page. */
export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      // error is already surfaced via the auth store
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <form onSubmit={(e) => void handleSubmit(e)} className="w-80 rounded-lg bg-white p-6 shadow-xl">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">Modular Business App</h1>
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-slate-600">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-400">Demo users: admin, sales_rep, warehouse — password: demo1234</p>
      </form>
    </div>
  );
}
