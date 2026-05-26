/**
 * Session-persistent disclaimer banner.
 *
 * Shown to every visitor on first page load of a session.
 * Dismissed state is stored in sessionStorage (resets on tab close).
 * Bilingual: English + Chinese.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SESSION_KEY = 'rwa_disclaimer_dismissed';

export default function Disclaimer() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Disclaimer"
    >
      <div className="w-full max-w-2xl bg-[#1A1A2E] border border-[#2B3437] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2B3437] bg-[#0F1117]">
          <span className="material-symbols-outlined text-yellow-400">warning</span>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            Important Disclaimer / 重要聲明
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto thin-scrollbar">
          {/* English */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">English</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              RWA-Index is an <strong className="text-white">academic research tool</strong> that
              provides the RARM (RWA Asset Risk Matrix) methodology framework for structured due
              diligence on tokenized real-world asset protocols. It does{' '}
              <strong className="text-white">not</strong> provide credit ratings, investment advice,
              or any regulated financial service.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Any scores produced through this platform reflect the{' '}
              <strong className="text-white">user's own professional judgment</strong> using the
              RARM framework and are stored privately. They are not ratings, recommendations, or
              endorsements by RWA-Index. Past analysis does not guarantee future accuracy.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              RWA-Index does not hold a Type 10 (Providing Credit Rating Services) licence from the
              Hong Kong SFC, nor an equivalent licence in any other jurisdiction, and does not
              purport to do so.
            </p>
          </div>

          <div className="border-t border-[#2B3437]" />

          {/* Chinese */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">中文</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              RWA-Index 是一個<strong className="text-white">學術研究工具</strong>，提供 RARM（RWA
              資產風險矩陣）方法論框架，用於對代幣化實體資產協議進行結構化盡職調查。本平台
              <strong className="text-white">不</strong>
              提供信貸評級、投資建議或任何受監管的金融服務。
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              通過本平台產生的任何評分均反映
              <strong className="text-white">用戶自身的專業判斷</strong>
              ，使用 RARM 框架進行評估，並以私密方式存儲。這些評分並非 RWA-Index
              的評級、建議或認可。過往分析結果不保證未來準確性。
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              RWA-Index 未持有香港證監會第 10 類（提供信貸評級服務）牌照，亦未持有其他司法管轄區的同等牌照。
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-[#2B3437] bg-[#0F1117]">
          <button
            onClick={() => navigate('/terms')}
            className="text-xs text-[#5E5C75] hover:text-white transition-colors underline"
          >
            Read full Terms of Use
          </button>
          <button
            onClick={dismiss}
            className="px-6 py-2 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold rounded transition-colors"
          >
            I Understand / 我明白
          </button>
        </div>
      </div>
    </div>
  );
}
