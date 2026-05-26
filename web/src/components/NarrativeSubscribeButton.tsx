import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { intelligenceApi } from '../api/client';

interface Props {
  narrativeSlug: string;
  /** Compact mode — just the bell icon, no text label */
  compact?: boolean;
}

export default function NarrativeSubscribeButton({ narrativeSlug, compact = false }: Props) {
  const { user, accessToken: token } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  // On mount, check if already subscribed
  useEffect(() => {
    if (!user || !token) { setChecked(true); return; }
    intelligenceApi.subscribedNarratives(token)
      .then(res => { setSubscribed(res.subscribed_slugs.includes(narrativeSlug)); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [user, token, narrativeSlug]);

  // Not logged in — render nothing (or a login prompt)
  if (!user) return null;
  if (!checked) return null;

  async function toggle() {
    if (!token || loading) return;
    setLoading(true);
    try {
      if (subscribed) {
        await intelligenceApi.unsubscribeNarrative(narrativeSlug, token);
        setSubscribed(false);
      } else {
        await intelligenceApi.subscribeNarrative(narrativeSlug, token);
        setSubscribed(true);
      }
    } catch {
      // silently ignore — state stays unchanged
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        title={subscribed ? 'Unsubscribe from this narrative' : 'Subscribe to this narrative'}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full border transition-colors disabled:opacity-50"
        style={subscribed
          ? { background: '#5E5C75', borderColor: '#5E5C75', color: 'white' }
          : { background: 'white', borderColor: '#DBE4E7', color: '#737C7F' }
        }
      >
        <span className="material-symbols-outlined text-[15px]">
          {subscribed ? 'notifications_active' : 'notifications'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50"
      style={subscribed
        ? { background: '#5E5C75', borderColor: '#5E5C75', color: 'white' }
        : { background: 'white', borderColor: '#DBE4E7', color: '#5E5C75' }
      }
    >
      <span className="material-symbols-outlined text-[14px]">
        {subscribed ? 'notifications_active' : 'notifications'}
      </span>
      {loading ? '…' : subscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  );
}
