/**
 * Landing page for the email verification link.
 * URL: /verify-email?token=xxx
 *
 * Shows: verifying spinner → success (auto-approved or pending) → error
 */
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi, type VerifyEmailResponse } from '../api/client';

type State =
  | { phase: 'loading' }
  | { phase: 'success'; data: VerifyEmailResponse }
  | { phase: 'error'; message: string };

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ phase: 'error', message: 'No verification token found in the link.' });
      return;
    }
    authApi
      .verifyEmail(token)
      .then((data) => setState({ phase: 'success', data }))
      .catch((err: Error) =>
        setState({ phase: 'error', message: err.message })
      );
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-[#2B3437]">
            <div className="text-2xl font-bold text-white tracking-tight font-headline mb-1">
              RWA-Index
            </div>
            <div className="text-xs uppercase tracking-widest text-[#5E5C75] font-label font-bold">
              Email Verification
            </div>
          </div>

          <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
            {state.phase === 'loading' && (
              <>
                <span className="material-symbols-outlined text-5xl text-[#5E5C75] animate-spin">
                  progress_activity
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">Verifying your email…</h2>
                  <p className="text-sm text-slate-400 mt-1">Please wait.</p>
                </div>
              </>
            )}

            {state.phase === 'success' && state.data.auto_approved && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-green-400">
                    verified
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-white">Account activated!</h2>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                    Your email has been verified and your account is now active. You can sign in immediately.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    您的電子郵件已驗證，帳號已啟用，可立即登入。
                  </p>
                </div>
                <Link
                  to="/login"
                  className="bg-[#5E5C75] hover:bg-[#4E4C65] text-white font-bold text-sm px-6 py-2.5 rounded transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}

            {state.phase === 'success' && !state.data.auto_approved && (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-900/30 border border-blue-700/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-blue-400">
                    mark_email_read
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-white">Email verified!</h2>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                    Your email has been verified and your application has been submitted for review.
                    We'll notify you within <strong className="text-white">1–2 business days</strong>.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    您的電子郵件已驗證，申請已提交審核，我們將在 1–2 個工作日內通知您。
                  </p>
                </div>
                <div className="bg-[#0F1117] border border-[#2B3437] rounded p-3 w-full text-left">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    While you wait, you can explore the public pages — market data,
                    framework overview, and friction analysis are available without an account.
                  </p>
                </div>
                <Link
                  to="/market"
                  className="text-sm text-[#5E5C75] hover:text-white transition-colors"
                >
                  Explore public pages →
                </Link>
              </>
            )}

            {state.phase === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-700/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-red-400">
                    error
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-white">Verification failed</h2>
                  <p className="text-sm text-red-400 leading-relaxed max-w-xs">
                    {state.message}
                  </p>
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xs text-slate-500">
                    The link may have expired (valid for 24 hours).
                  </p>
                  <Link
                    to="/login"
                    className="text-sm text-[#5E5C75] hover:text-white transition-colors"
                  >
                    Return to sign in to request a new link
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
