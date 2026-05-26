/**
 * Login / Apply for access screen.
 *
 * Login tab: standard email + password → JWT
 * Register tab: full application form with 3 consent checkboxes + Turnstile
 */
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Cloudflare Turnstile widget ───────────────────────────────────────────────
// Site key is public — set in VITE_TURNSTILE_SITE_KEY env var.
// Falls back gracefully when key not set (dev mode).
const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? '';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; theme: string }
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

function TurnstileWidget({ onToken }: { onToken: (t: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return; // dev: skip

    const renderWidget = () => {
      if (!containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile!.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        theme: 'dark',
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }
    return () => {
      widgetIdRef.current = null;
    };
  }, [onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} className="mt-2" />;
}

// ── Consent items ─────────────────────────────────────────────────────────────

const CONSENT_ITEMS = [
  {
    id: 'c1',
    text: 'I understand that RWA-Index is an academic research tool, not a credit rating service, and does not hold any regulated financial services licence.',
  },
  {
    id: 'c2',
    text: 'I understand that any scores or assessments I produce using the RARM framework reflect my own professional judgment and are stored privately — they are not published or endorsed by RWA-Index.',
  },
  {
    id: 'c3',
    text: 'I have read and agree to the Terms of Use and Disclaimer.',
  },
] as const;

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  'w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#5E5C75]';

// ── Main component ────────────────────────────────────────────────────────────

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/score';

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register-only fields
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [useCase, setUseCase] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Consent checkboxes
  const [consents, setConsents] = useState({ c1: false, c2: false, c3: false });
  const allConsented = Object.values(consents).every(Boolean);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleConsent(id: keyof typeof consents) {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function switchMode(m: 'login' | 'register') {
    setMode(m);
    setError('');
  }

  // Turnstile is required only when SITE_KEY is configured
  const turnstileRequired = Boolean(TURNSTILE_SITE_KEY);
  const registerReady =
    allConsented && (!turnstileRequired || Boolean(turnstileToken));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!allConsented) {
        setError('Please confirm all three statements before applying.');
        return;
      }
      if (!fullName.trim()) {
        setError('Full name is required.');
        return;
      }
      if (!organization.trim()) {
        setError('Organization is required.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        const result = await register({
          email,
          password,
          full_name: fullName.trim(),
          organization: organization.trim(),
          use_case: useCase.trim() || undefined,
          newsletter_subscribed: newsletterSubscribed,
          terms_accepted: true,
          methodology_acknowledged: true,
          not_rating_service_acknowledged: true,
          turnstile_token: turnstileToken ?? undefined,
        });
        navigate('/verify-email-sent', { state: { email: result.email } });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A2E] border border-[#2B3437] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#2B3437]">
          <div className="text-2xl font-bold text-white tracking-tight font-headline mb-1">
            RWA-Index
          </div>
          <div className="text-xs uppercase tracking-widest text-[#5E5C75] font-label font-bold">
            Academic Research Tool · RARM Framework
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2B3437]">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mode === m
                  ? 'text-white border-b-2 border-[#5E5C75]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Apply for Access'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">

          {/* ── Register-only fields ── */}
          {mode === 'register' && (
            <>
              <Field label="Full Name *">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Organization *">
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                  placeholder="University of Hong Kong / HKMA / Firm Name"
                  className={INPUT_CLS}
                />
              </Field>
            </>
          )}

          {/* ── Shared fields ── */}
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={mode === 'register' ? 'your@institution.com' : 'analyst@institution.com'}
              className={INPUT_CLS}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
              className={INPUT_CLS}
            />
          </Field>

          {/* Forgot password link */}
          {mode === 'login' && (
            <div className="text-right -mt-2">
              <Link
                to="/forgot-password"
                className="text-xs text-[#5E5C75] hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {/* ── Register-only: use case + consent ── */}
          {mode === 'register' && (
            <>
              <Field label="How will you use RWA-Index? (optional)">
                <textarea
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="e.g. Academic research on RWA tokenisation risk, due diligence for institutional clients…"
                  className={`${INPUT_CLS} resize-none leading-relaxed`}
                />
                <div className="text-right text-[10px] text-slate-600 mt-0.5">
                  {useCase.length}/200
                </div>
              </Field>

              {/* Consent checkboxes */}
              <div className="space-y-3 pt-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Please confirm before applying:
                </p>
                {CONSENT_ITEMS.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={consents[item.id]}
                        onChange={() => toggleConsent(item.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                          consents[item.id]
                            ? 'bg-[#5E5C75] border-[#5E5C75]'
                            : 'bg-[#0F1117] border-[#2B3437] group-hover:border-[#5E5C75]'
                        }`}
                      >
                        {consents[item.id] && (
                          <span className="material-symbols-outlined text-white text-xs">
                            check
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                      {item.id === 'c3' ? (
                        <>
                          I have read and agree to the{' '}
                          <Link
                            to="/terms"
                            target="_blank"
                            className="text-[#5E5C75] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms of Use and Disclaimer
                          </Link>
                          .
                        </>
                      ) : (
                        item.text
                      )}
                    </span>
                  </label>
                ))}
              </div>

              {/* Turnstile */}
              <TurnstileWidget onToken={setTurnstileToken} />

              {/* Newsletter opt-in */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={newsletterSubscribed}
                    onChange={() => setNewsletterSubscribed((v) => !v)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                      newsletterSubscribed
                        ? 'bg-[#5E5C75] border-[#5E5C75]'
                        : 'bg-[#0F1117] border-[#2B3437] group-hover:border-[#5E5C75]'
                    }`}
                  >
                    {newsletterSubscribed && (
                      <span className="material-symbols-outlined text-white text-xs">check</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                  Subscribe to the RWA-Index biweekly newsletter — regulatory updates, new incidents, and module changes. Unsubscribe any time.
                </span>
              </label>

              {/* Review notice */}
              <div className="flex items-start gap-2 bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2.5">
                <span className="material-symbols-outlined text-[#5E5C75] text-base mt-0.5 shrink-0">
                  schedule
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Applications are reviewed within{' '}
                  <strong className="text-slate-300">1–2 business days</strong>.
                  Academic and government email addresses are approved automatically.
                </p>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'register' && !registerReady)}
            className="w-full bg-[#5E5C75] hover:bg-[#4E4C65] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded text-sm transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
                {mode === 'login' ? 'Signing in…' : 'Submitting application…'}
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Submit Application'
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="px-8 pb-6 text-center space-y-2">
          <div>
            <span className="text-slate-500 text-xs">
              {mode === 'login' ? "Don't have access yet? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-[#5E5C75] hover:text-white text-xs transition-colors"
            >
              {mode === 'login' ? 'Apply for access' : 'Sign in'}
            </button>
          </div>
          <div>
            <Link
              to="/terms"
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              Terms of Use & Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
