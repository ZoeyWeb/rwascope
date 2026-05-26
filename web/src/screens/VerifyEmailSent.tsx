/**
 * Shown immediately after registration.
 * Tells the user to check their inbox and lets them resend the verification email.
 */
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authApi } from '../api/client';

export default function VerifyEmailSent() {
  const location = useLocation();
  const email: string = (location.state as { email?: string })?.email ?? '';

  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleResend() {
    if (!email || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      await authApi.resendVerification(email);
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-[#2B3437]">
            <div className="text-2xl font-bold text-white tracking-tight font-headline mb-1">
              RWA-Index
            </div>
            <div className="text-xs uppercase tracking-widest text-[#5E5C75] font-label font-bold">
              Academic Research Tool
            </div>
          </div>

          <div className="px-8 py-8 space-y-5">
            {/* Icon + heading */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#5E5C75]/20 border border-[#5E5C75]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-[#5E5C75]">
                  mark_email_unread
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">Check your inbox</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                We've sent a verification link to{' '}
                {email ? (
                  <strong className="text-white">{email}</strong>
                ) : (
                  'your email address'
                )}
                . Click the link to verify your email and continue.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                請查收您的電子郵件，點擊驗證連結以繼續申請流程。
              </p>
            </div>

            {/* What happens next */}
            <div className="bg-[#0F1117] border border-[#2B3437] rounded p-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                What happens next
              </p>
              <div className="space-y-2">
                {[
                  { icon: 'check_circle', text: 'Verify your email (this step)' },
                  { icon: 'manage_accounts', text: 'Application reviewed within 1–2 business days' },
                  { icon: 'login', text: 'Receive approval email and sign in' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5E5C75] text-base shrink-0">
                      {step.icon}
                    </span>
                    <span className="text-xs text-slate-400">{step.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 pt-1">
                Academic (.edu, .ac.uk, .edu.hk) and government (.gov, .gov.hk) addresses are approved instantly.
              </p>
            </div>

            {/* Resend */}
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-500">Didn't receive the email?</p>
              {resendStatus === 'sent' ? (
                <p className="text-xs text-green-400">
                  ✓ Verification email resent. Please check your spam folder too.
                </p>
              ) : resendStatus === 'error' ? (
                <p className="text-xs text-red-400">
                  Something went wrong. Please try again.
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendStatus === 'sending' || !email}
                  className="text-xs text-[#5E5C75] hover:text-white disabled:opacity-50 transition-colors"
                >
                  {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          <Link to="/login" className="hover:text-slate-400 transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
