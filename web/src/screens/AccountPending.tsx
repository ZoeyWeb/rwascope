/**
 * Shown when a logged-in user's account is not yet active.
 * Polls the /auth/me endpoint every 30s for status updates.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_COPY: Record<
  string,
  { title: string; body: string; bodyZh: string; color: string; icon: string }
> = {
  pending_verification: {
    title: 'Awaiting email verification',
    body: 'Please check your inbox and click the verification link to continue.',
    bodyZh: '請查收電子郵件並點擊驗證連結以繼續。',
    color: 'text-yellow-400',
    icon: 'mark_email_unread',
  },
  pending_review: {
    title: 'Application under review',
    body: 'Your email has been verified. Our team is reviewing your application. We aim to respond within 1–2 business days.',
    bodyZh: '您的電子郵件已驗證，我們的團隊正在審核您的申請，通常於 1–2 個工作日內回覆。',
    color: 'text-blue-400',
    icon: 'pending',
  },
  rejected: {
    title: 'Application not approved',
    body: 'Unfortunately your application was not approved. Please contact research@rwa-index.com if you believe this is an error.',
    bodyZh: '很遺憾，您的申請未獲批准。如有疑問，請聯繫 research@rwa-index.com。',
    color: 'text-red-400',
    icon: 'cancel',
  },
  suspended: {
    title: 'Account suspended',
    body: 'Your account has been suspended. Please contact research@rwa-index.com for assistance.',
    bodyZh: '您的帳號已暫停，請聯繫 research@rwa-index.com 尋求協助。',
    color: 'text-orange-400',
    icon: 'block',
  },
};

export default function AccountPending() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [polling, setPolling] = useState(true);

  // If user becomes active, redirect to the score tool
  useEffect(() => {
    if (user?.status === 'active') {
      navigate('/score', { replace: true });
    }
  }, [user?.status, navigate]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => {
      refreshUser().catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [polling, refreshUser]);

  const status = user?.status ?? 'pending_review';
  const info = STATUS_COPY[status] ?? STATUS_COPY['pending_review'];

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-[#2B3437]">
            <div className="text-2xl font-bold text-white tracking-tight font-headline mb-1">
              RWA-Index
            </div>
            <div className="text-xs uppercase tracking-widest text-[#5E5C75] font-label font-bold">
              Application Status
            </div>
          </div>

          <div className="px-8 py-8 flex flex-col items-center text-center gap-5">
            <div
              className={`w-16 h-16 rounded-full bg-[#0F1117] border border-[#2B3437] flex items-center justify-center`}
            >
              <span className={`material-symbols-outlined text-4xl ${info.color}`}>
                {info.icon}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">{info.title}</h2>
              {user && (
                <p className="text-xs text-slate-500">
                  Signed in as <span className="text-slate-300">{user.email}</span>
                </p>
              )}
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{info.body}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{info.bodyZh}</p>
            </div>

            {status === 'pending_review' && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="material-symbols-outlined text-sm animate-spin text-[#5E5C75]">
                  progress_activity
                </span>
                Checking for updates…
              </div>
            )}

            {status === 'pending_verification' && (
              <Link
                to="/verify-email-sent"
                state={{ email: user?.email }}
                className="text-sm text-[#5E5C75] hover:text-white transition-colors"
              >
                Resend verification email →
              </Link>
            )}

            <div className="w-full pt-2 border-t border-[#2B3437] flex gap-4 justify-center">
              <Link to="/market" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Browse public pages
              </Link>
              <button
                onClick={logout}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
