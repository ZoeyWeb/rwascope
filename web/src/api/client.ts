/**
 * Thin API client for the RWA-Index backend.
 * Base URL is driven by VITE_API_BASE_URL (default: /api for same-origin Nginx proxy).
 *
 * COMPLIANCE NOTE: Types here intentionally do NOT include any AI-generated numeric
 * scores or ratings. The AI produces a due diligence checklist only. All numeric
 * scores are the exclusive judgment of the registered user.
 */

import type {
  IntelligenceItem,
  IntelligenceMeta,
  IntelligenceWeeklyBrief,
  NarrativeThread,
  EditorNote,
  DashboardData,
} from '../types/intelligence';
import type { Project } from '../types/projects';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  organization?: string | null;
  status: string;
  is_admin: boolean;
  created_at: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  organization: string;
  use_case?: string;
  newsletter_subscribed?: boolean;
  terms_accepted: true;
  methodology_acknowledged: true;
  not_rating_service_acknowledged: true;
  turnstile_token?: string;
}

export interface PlatformStats {
  registered_users: number;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface VerifyEmailResponse {
  message: string;
  status: 'active' | 'pending_review';
  auto_approved: boolean;
}

export interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  organization: string | null;
  use_case: string | null;
  registration_ip: string | null;
  created_at: string;
  email_verified_at: string | null;
}

export interface SubScoreOut {
  indicator_key: string;
  indicator_label: string;
  layer_number: number;
  user_score: number;
  final_score: number | null;
  rationale: string | null;   // user's own evidence / reasoning note
}

/** One layer of the AI-generated due diligence checklist. No scores. */
export interface ChecklistLayer {
  layer_number: number;
  layer_name: string;
  questions_to_verify: string[];
  public_data_sources: string[];
  red_flags_to_consider: string[];
}

export interface AIChecklistOut {
  id: string;
  assessment_id: string;
  checklist: ChecklistLayer[];
  overall_notes: string;
  suggested_public_sources: string[];
  model_used: string;
  created_at: string;
}

export interface AssessmentOut {
  id: string;
  protocol_name: string;
  asset_class: string;
  description: string | null;
  chains: string | null;
  status: 'draft' | 'checklist_generated' | 'finalized';
  rarm_score: number | null;   // user's own private RARM framework score (0–10)
  rarm_total: number | null;
  created_at: string;
  updated_at: string;
  sub_scores: SubScoreOut[];
  ai_checklist: AIChecklistOut | null;
}

export interface AssessmentListItem {
  id: string;
  protocol_name: string;
  asset_class: string;
  status: string;
  rarm_score: number | null;
  created_at: string;
}

export interface SubScoreInput {
  indicator_key: string;
  user_score: number;
  rationale?: string;
}

export interface LayerInput {
  layer_number: number;
  scores: SubScoreInput[];
}

export interface CreateAssessmentRequest {
  protocol_name: string;
  asset_class: string;
  description?: string;
  chains?: string;
  layers: LayerInput[];
}

export interface IndicatorDef {
  key: string;
  label: string;
  description: string;
}

export interface LayerDef {
  id: number;
  name: string;
  description: string;
  weight_by_class: Record<string, number>;
  indicators: IndicatorDef[];
}

// ── Request helper ────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (token: string) =>
    request<VerifyEmailResponse>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  resendVerification: (email: string) =>
    request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refresh_token: string) =>
    request<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    }),

  me: (token: string) =>
    request<UserOut>('/auth/me', { token }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),
};

// ── Public API ────────────────────────────────────────────────────────────────

export interface NewsletterSubscribeResponse {
  message: 'subscribed' | 'resubscribed' | 'already_subscribed';
}

export const publicApi = {
  stats: () => request<PlatformStats>('/stats'),
  subscribeNewsletter: (email: string) =>
    request<NewsletterSubscribeResponse>('/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
};

// ── Admin types ───────────────────────────────────────────────────────────────

export interface AdminUserOut {
  id: string;
  email: string;
  full_name: string;
  organization: string | null;
  status: string;
  is_admin: boolean;
  auto_approved: boolean;
  registration_ip: string | null;
  created_at: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  reviewed_at: string | null;
  assessment_count: number;
}

export interface AdminUserDetail extends AdminUserOut {
  use_case: string | null;
  terms_version: string;
  rejection_reason: string | null;
  deleted_at: string | null;
  assessments: AssessmentMeta[];
  recent_logins: AuditLogEntry[];
}

export interface AssessmentMeta {
  id: string;
  protocol_name: string;
  asset_class: string;
  status: string;
  created_at: string;
}

export interface UserListResponse {
  users: AdminUserOut[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface DailyCount { date: string; count: number; }

export interface OverviewStats {
  users: {
    total: number; active: number; pending_verification: number;
    pending_review: number; suspended: number; rejected: number;
    deleted: number; new_today: number; active_last_7d: number;
  };
  total_assessments: number;
  daily_registrations: DailyCount[];
  daily_assessments: DailyCount[];
}

export interface AssessmentStats {
  total: number;
  by_asset_class: { asset_class: string; count: number }[];
  by_status: { status: string; count: number }[];
  daily_trend: DailyCount[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action_type: string;
  target_user_id: string | null;
  target_email: string | null;
  ip_address: string | null;
  details: Record<string, unknown> | null;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: (token: string) =>
    request<OverviewStats>('/admin/stats', { token }),

  listUsers: (token: string, params: { search?: string; status?: string; page?: number; per_page?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.status) q.set('status', params.status);
    if (params.page) q.set('page', String(params.page));
    if (params.per_page) q.set('per_page', String(params.per_page));
    return request<UserListResponse>(`/admin/users?${q}`, { token });
  },

  listPending: (token: string) =>
    request<PendingUser[]>('/admin/users/pending', { token }),

  getUser: (token: string, userId: string) =>
    request<AdminUserDetail>(`/admin/users/${userId}`, { token }),

  approve: (token: string, userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}/approve`, {
      method: 'POST', token, body: JSON.stringify({}),
    }),

  reject: (token: string, userId: string, rejection_reason?: string) =>
    request<{ message: string }>(`/admin/users/${userId}/reject`, {
      method: 'POST', token, body: JSON.stringify({ rejection_reason }),
    }),

  suspend: (token: string, userId: string, reason?: string) =>
    request<{ message: string }>(`/admin/users/${userId}/suspend`, {
      method: 'POST', token, body: JSON.stringify({ reason }),
    }),

  unsuspend: (token: string, userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}/unsuspend`, {
      method: 'POST', token, body: JSON.stringify({}),
    }),

  deleteUser: (token: string, userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE', token,
    }),

  resetPassword: (token: string, userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}/reset-password`, {
      method: 'POST', token, body: JSON.stringify({}),
    }),

  makeAdmin: (token: string, userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}/make-admin`, {
      method: 'POST', token, body: JSON.stringify({ confirm: true }),
    }),

  assessmentStats: (token: string) =>
    request<AssessmentStats>('/admin/assessments/stats', { token }),

  auditLog: (token: string, page = 1, per_page = 50, action?: string) => {
    const q = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (action) q.set('action_filter', action);
    return request<AuditLogResponse>(`/admin/audit-log?${q}`, { token });
  },

  exportUrl: (type: 'users' | 'assessments' | 'audit-log') =>
    `${BASE}/admin/export/${type}`,
};

// ── Assessments ───────────────────────────────────────────────────────────────

export const assessmentApi = {
  layers: () => request<LayerDef[]>('/assessments/layers'),

  list: (token: string) =>
    request<AssessmentListItem[]>('/assessments', { token }),

  create: (token: string, body: CreateAssessmentRequest) =>
    request<AssessmentOut>('/assessments', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  get: (token: string, id: string) =>
    request<AssessmentOut>(`/assessments/${id}`, { token }),

  /** Triggers AI checklist generation (questions/sources/red-flags, no scores). */
  analyze: (token: string, id: string) =>
    request<AssessmentOut>(`/assessments/${id}/analyze`, {
      method: 'POST',
      token,
    }),

  /**
   * Saves the user's confirmed final scores and evidence notes.
   * final_scores: indicator_key → score (0–5), user's own judgment.
   * final_rationale: indicator_key → evidence note (optional).
   */
  finalize: (
    token: string,
    id: string,
    final_scores: Record<string, number>,
    final_rationale: Record<string, string> = {},
  ) =>
    request<AssessmentOut>(`/assessments/${id}/finalize`, {
      method: 'POST',
      token,
      body: JSON.stringify({ final_scores, final_rationale }),
    }),

  remove: (token: string, id: string) =>
    request<void>(`/assessments/${id}`, { method: 'DELETE', token }),

  /** Returns the raw fetch Response so the caller can stream to a file blob. */
  exportJson: (token: string, id: string) =>
    fetch(`${BASE}/assessments/${id}/json`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ── Intelligence (public) ─────────────────────────────────────────────────────

export interface IntelligenceListResponse {
  total: number;
  offset: number;
  limit: number;
  items: IntelligenceItem[];
  meta: IntelligenceMeta;
}

export interface IntelligenceHKResponse {
  total: number;
  items: IntelligenceItem[];
  meta: IntelligenceMeta;
}

export interface IntelligenceNarrativesResponse {
  total: number;
  narratives: NarrativeThread[];
}

export interface IntelligenceNarrativeDetailResponse {
  narrative: NarrativeThread;
  events: IntelligenceItem[];
}

export interface NarrativeTimelineResponse {
  narrative: NarrativeThread;
  past_events: IntelligenceItem[];
  expected_events: import('../types/intelligence').NarrativeExpectedEvent[];
}

export interface EditorNotesListResponse {
  total: number;
  notes: EditorNote[];
}

// ── DB-backed intelligence item (admin) ──────────────────────────────────────

export interface IntelligenceDBItem {
  id: string;
  category: string | null;
  region: string | null;
  title: string;
  event_date: string | null;
  source_url: string | null;
  policy_summary: string | null;
  market_impact: Record<string, unknown> | null;
  rwa_relevant: boolean;
  status: 'pending' | 'published' | 'rejected';
  event_type: string;
  is_data_snapshot: boolean;
  source_entity: string | null;
  data_source: string | null;
  significance: string | null;
  created_at: string;
}

export interface IntelligenceItemUpdatePayload {
  title?: string;
  policy_summary?: string;
  market_impact?: Record<string, unknown>;
  rwa_relevant?: boolean;
  event_date?: string;
  category?: string;
  region?: string;
  significance?: string;
  event_type?: string;
}

export const intelligenceApi = {
  list: (params: {
    category?: string;
    region?: string;
    event_type?: string;
    is_data_snapshot?: boolean;
    narrative_id?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.region) q.set('region', params.region);
    if (params.event_type) q.set('event_type', params.event_type);
    if (params.is_data_snapshot !== undefined) q.set('is_data_snapshot', String(params.is_data_snapshot));
    if (params.narrative_id) q.set('narrative_id', params.narrative_id);
    q.set('limit', String(params.limit ?? 200));
    if (params.offset) q.set('offset', String(params.offset));
    return request<IntelligenceListResponse>(`/intelligence?${q}`);
  },
  hk: () => request<IntelligenceHKResponse>('/intelligence/hk'),
  weekly: () => request<IntelligenceWeeklyBrief>('/intelligence/weekly'),
  dashboard: () => request<DashboardData>('/intelligence/dashboard'),
  narratives: () => request<IntelligenceNarrativesResponse>('/intelligence/narratives'),
  narrativeBySlug: (slug: string) => request<IntelligenceNarrativeDetailResponse>(`/intelligence/narratives/${slug}`),
  narrativeTimeline: (slug: string) => request<NarrativeTimelineResponse>(`/intelligence/narratives/${slug}/timeline`),
  subscribedNarratives: (token: string) =>
    request<{ subscribed_slugs: string[] }>('/intelligence/narratives/subscribed', { token }),
  subscribeNarrative: (slug: string, token: string) =>
    request<unknown>(`/intelligence/narratives/${slug}/subscribe`, { method: 'POST', token }),
  unsubscribeNarrative: (slug: string, token: string) =>
    request<void>(`/intelligence/narratives/${slug}/subscribe`, { method: 'DELETE', token }),
  editorNotes: () => request<EditorNotesListResponse>('/intelligence/editor-notes'),
  dataMilestones: () => request<{ total: number; items: IntelligenceItem[] }>('/intelligence/data-milestones'),
};

// ── Intelligence admin (requires token) ──────────────────────────────────────

export const intelligenceAdminApi = {
  listPending: (token: string) =>
    request<IntelligenceDBItem[]>('/intelligence/pending', { token }),

  approve: (token: string, id: string) =>
    request<IntelligenceDBItem>(`/intelligence/${id}/approve`, { method: 'PUT', token }),

  reject: (token: string, id: string) =>
    request<IntelligenceDBItem>(`/intelligence/${id}/reject`, { method: 'PUT', token }),

  update: (token: string, id: string, payload: IntelligenceItemUpdatePayload) =>
    request<IntelligenceDBItem>(`/intelligence/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }),
};

// ── Projects (public) ─────────────────────────────────────────────────────────

export interface ProjectsListResponse {
  total: number;
  projects: Project[];
}

export const projectsApi = {
  list: (params: { asset_class?: string; region?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.asset_class) q.set('asset_class', params.asset_class);
    if (params.region) q.set('region', params.region);
    if (params.status) q.set('status', params.status);
    const qs = q.toString();
    return request<ProjectsListResponse>(`/projects${qs ? `?${qs}` : ''}`);
  },
  get: (slug: string) => request<Project>(`/projects/${slug}`),
};

// ── Market — tokenized assets ─────────────────────────────────────────────────

import type { MarketSnapshot } from '../types/market';

export const marketApi = {
  tokenizedSnapshot: () => request<MarketSnapshot>('/market/tokenized'),
};

