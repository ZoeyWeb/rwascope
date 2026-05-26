/**
 * Forgot password — enter email to receive reset link.
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await authApi.forgotPassword(email);
      setStatus('sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-[#2B3437]">
            <div className="text-2xl font-bold text-white tracking-tight font-headline mb-1">
              RWA-Index
            </div>
            <div className="text-xs uppercase tracking-widest text-[#5E5C75] font-label font-bold">
              Reset Password
            </div>
          </div>

          <div className="px-8 py-8">
            {status === 'sent' ? (
              <div className="flex flex-col items-center text-center gap-4">
                <span className="material-symbols-outlined text-5xl text-[#5E5C75]">
                  mark_email_unread
                </span>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-white">Check your inbox</h2>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                    If an account exists for <strong className="text-white">{email}</strong>,
                    we've sent a password reset link. It expires in 1 hour.
                  </p>
                  <p className="text-xs text-slate-500">
                    如果該電子郵件已有帳號，密碼重置連結已發送，1 小時內有效。
                  </p>
                </div>
                <Link
                  to="/login"
                  className="text-sm text-[#5E5C75] hover:text-white transition-colors mt-2"
                >
                  ← Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white">Forgot your password?</h2>
                  <p className="text-sm text-slate-400">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@institution.com"
                    className="w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#5E5C75]"
                  />
                </div>

                {(status === 'error') && error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[#5E5C75] hover:bg-[#4E4C65] disabled:opacity-40 text-white font-bold py-2.5 rounded text-sm transition-colors"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-base animate-spin">
                        progress_activity
                      </span>
                      Sending…
                    </span>
                  ) : (
                    'Send Reset Link'
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
