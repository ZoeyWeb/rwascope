/**
 * Reset password — set new password using token from email link.
 * URL: /reset-password?token=xxx
 */
import { useState, type FormEvent } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link — no token found.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      await authApi.resetPassword(token, password);
      setStatus('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  const INPUT_CLS =
    'w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#5E5C75]';

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-[#2B3437]">
            <div className="text-2xl font-bold text-white tracking-tight font-headline mb-1">
              RWA-Index
            </div>
            <div className="text-xs uppercase tracking-widest text-[#5E5C75] font-label font-bold">
              Set New Password
            </div>
          </div>

          <div className="px-8 py-8">
            {status === 'success' ? (
              <div className="flex flex-col items-center text-center gap-4">
                <span className="material-symbols-outlined text-5xl text-green-400">
                  check_circle
                </span>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-white">Password updated</h2>
                  <p className="text-sm text-slate-400">
                    Your password has been reset. You can now sign in with your new password.
                  </p>
                  <p className="text-xs text-slate-500">
                    您的密碼已重置，可以使用新密碼登入。
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#5E5C75] hover:bg-[#4E4C65] text-white font-bold text-sm px-6 py-2.5 rounded transition-colors mt-2"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white">Set a new password</h2>
                  <p className="text-sm text-slate-400">
                    Choose a strong password of at least 8 characters.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    className={INPUT_CLS}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    <span>{error}</span>
                  </div>
                )}

                {!token && (
                  <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded px-3 py-2">
                    <span className="material-symbols-outlined text-base shrink-0">warning</span>
                    <span>Invalid reset link. Please request a new one.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading' || !token}
                  className="w-full bg-[#5E5C75] hover:bg-[#4E4C65] disabled:opacity-40 text-white font-bold py-2.5 rounded text-sm transition-colors"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-base animate-spin">
                        progress_activity
                      </span>
                      Updating…
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
