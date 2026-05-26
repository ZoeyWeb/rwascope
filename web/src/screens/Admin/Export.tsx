import { useState } from 'react';
import { adminApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface ExportCard {
  title: string;
  description: string;
  icon: string;
  type: 'users' | 'assessments' | 'audit-log';
  filename: string;
  note?: string;
}

const EXPORTS: ExportCard[] = [
  {
    title: 'User Data',
    description: 'All user accounts with registration details, status, and compliance fields.',
    icon: 'group',
    type: 'users',
    filename: 'rwa-index-users.csv',
    note: 'Passwords are never exported.',
  },
  {
    title: 'Assessment Metadata',
    description: 'Protocol name, asset class, status, and creation date for all assessments.',
    icon: 'assignment',
    type: 'assessments',
    filename: 'rwa-index-assessments.csv',
    note: 'Assessment content (scores, rationale) is excluded to protect user privacy.',
  },
  {
    title: 'Audit Log',
    description: 'Full audit trail of admin actions, logins, and key platform events.',
    icon: 'policy',
    type: 'audit-log',
    filename: 'rwa-index-audit-log.csv',
  },
];

export default function AdminExport() {
  const { accessToken } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const download = async (type: 'users' | 'assessments' | 'audit-log', filename: string) => {
    if (!accessToken) return;
    setDownloading(type);
    try {
      const res = await fetch(adminApi.exportUrl(type), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setToast(`Downloaded ${filename}`);
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Export failed. Please try again.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#2B3437]">Data Export</h1>
        <p className="text-sm text-[#737C7F] mt-1">
          All exports are logged to the audit trail.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-2xl">
        {EXPORTS.map(ex => (
          <div key={ex.type} className="bg-white rounded-xl border border-[#DBE4E7] p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EAEFF1] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#5E5C75]" style={{ fontSize: 24 }}>{ex.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#2B3437] mb-1">{ex.title}</div>
              <div className="text-sm text-[#737C7F] mb-1">{ex.description}</div>
              {ex.note && (
                <div className="text-xs text-[#5E5C75] italic mb-3">{ex.note}</div>
              )}
              <div className="text-xs text-[#737C7F] font-mono mb-3">{ex.filename}</div>
              <button
                onClick={() => download(ex.type, ex.filename)}
                disabled={downloading === ex.type}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-[#2B3437] text-white hover:bg-[#3a4447] disabled:opacity-50 disabled:cursor-wait"
              >
                {downloading === ex.type ? (
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                )}
                {downloading === ex.type ? 'Preparing…' : 'Download CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#2B3437] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
