import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow } from '../../components/Eyebrow';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface FormValues {
  name: string;
  email: string;
  affiliation: string;
  role: string;
  inquiry_type: string;
  message: string;
}

const INQUIRY_TYPES = [
  'Press inquiry',
  'Research collaboration',
  'Data access',
  'Speaking engagement',
  'Other',
];

const INITIAL: FormValues = {
  name: '',
  email: '',
  affiliation: '',
  role: '',
  inquiry_type: '',
  message: '',
};

const LABEL_CLASS =
  'block text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted mb-2';

const INPUT_CLASS =
  'w-full border border-ed-hairline bg-ed-surface px-4 py-3 text-ed-body text-ed-ink ' +
  'placeholder:text-ed-text-faint focus:outline-none focus:border-ed-ink transition-colors';

export default function ContactForm() {
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setValues(v => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const fd = new FormData();
    fd.append('access_key', import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? '');
    fd.append('subject', `[RWAscope Contact] ${values.inquiry_type} — ${values.name}`);
    fd.append('from_name', values.name);
    fd.append('email', values.email);
    fd.append('name', values.name);
    fd.append('affiliation', values.affiliation);
    fd.append('role', values.role);
    fd.append('inquiry_type', values.inquiry_type);
    fd.append('message', values.message);
    fd.append('botcheck', '');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
      } else {
        setErrorMsg(json.message ?? 'Submission failed. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="py-ed-section-lg">
        <Eyebrow>Received</Eyebrow>
        <h3 className="text-ed-block-h3 text-ed-ink mt-ed-section-sm">
          Thank you, we'll be in touch.
        </h3>
        <p className="text-ed-body text-ed-text-secondary mt-4 max-w-[480px]">
          Your message has been received. Expect a response within 3 business days.
        </p>
        <button
          type="button"
          onClick={() => { setValues(INITIAL); setStatus('idle'); }}
          className="mt-ed-section text-ed-body text-ed-text-secondary border-b border-ed-hairline hover:text-ed-ink hover:border-ed-ink transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Honeypot — hidden from real users, catches bots */}
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} />

      {status === 'error' && (
        <div className="border-l-2 border-[#9e3f4e] pl-4 py-2 mb-ed-section-sm">
          <p className="text-ed-body text-[#9e3f4e]">
            {errorMsg || 'Something went wrong. Please try again.'}
          </p>
        </div>
      )}

      <div className="space-y-ed-section-sm">

        <div className="grid grid-cols-2 gap-ed-section-sm">
          <div>
            <label htmlFor="cf-name" className={LABEL_CLASS}>Name *</label>
            <input
              id="cf-name"
              type="text"
              required
              value={values.name}
              onChange={set('name')}
              placeholder="Full name"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="cf-email" className={LABEL_CLASS}>Email *</label>
            <input
              id="cf-email"
              type="email"
              required
              value={values.email}
              onChange={set('email')}
              placeholder="you@institution.edu"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-ed-section-sm">
          <div>
            <label htmlFor="cf-affiliation" className={LABEL_CLASS}>Institution or company *</label>
            <input
              id="cf-affiliation"
              type="text"
              required
              value={values.affiliation}
              onChange={set('affiliation')}
              placeholder="HKUST, Blackrock, MAS…"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="cf-role" className={LABEL_CLASS}>Role / Title</label>
            <input
              id="cf-role"
              type="text"
              value={values.role}
              onChange={set('role')}
              placeholder="PhD Researcher, Policy Analyst…"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cf-inquiry" className={LABEL_CLASS}>Inquiry type *</label>
          <select
            id="cf-inquiry"
            required
            value={values.inquiry_type}
            onChange={set('inquiry_type')}
            className={INPUT_CLASS + ' cursor-pointer'}
          >
            <option value="" disabled>Select inquiry type</option>
            {INQUIRY_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cf-message" className={LABEL_CLASS}>
            Message *
          </label>
          <textarea
            id="cf-message"
            required
            rows={6}
            value={values.message}
            onChange={set('message')}
            placeholder="Tell us about your inquiry…"
            className={INPUT_CLASS + ' resize-none'}
          />
        </div>

        <div className="pt-2 flex items-center gap-6">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="bg-ed-ink text-white px-8 py-3 text-ed-body hover:bg-ed-ink-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Sending…' : 'Send message'}
          </button>
          <p className="text-ed-meta text-ed-text-muted">
            We respond within 3 business days.
          </p>
        </div>

      </div>

      <p className="text-ed-meta text-ed-text-faint mt-ed-section-sm">
        Prefer email? Write directly to{' '}
        <Link to="/press" className="underline hover:text-ed-text-secondary transition-colors">
          ywenap@connect.ust.hk
        </Link>
        .
      </p>

    </form>
  );
}
