import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import Layout from './components/Layout';

// ── Route-level code splitting via React.lazy ──
// Each `import()` creates a separate JS chunk loaded on-demand.

// Auth / onboarding
const Login = lazy(() => import('./screens/Login'));
const VerifyEmailSent = lazy(() => import('./screens/VerifyEmailSent'));
const VerifyEmail = lazy(() => import('./screens/VerifyEmail'));
const AccountPending = lazy(() => import('./screens/AccountPending'));
const ForgotPassword = lazy(() => import('./screens/ForgotPassword'));
const ResetPassword = lazy(() => import('./screens/ResetPassword'));

// Admin
const AdminLayout = lazy(() => import('./screens/Admin/AdminLayout'));
const AdminOverview = lazy(() => import('./screens/Admin/Overview'));
const AdminUserList = lazy(() => import('./screens/Admin/UserList'));
const AdminUserDetail = lazy(() => import('./screens/Admin/UserDetail'));
const AdminAssessmentStats = lazy(() => import('./screens/Admin/AssessmentStats'));
const AdminAuditLog = lazy(() => import('./screens/Admin/AuditLog'));
const AdminExport = lazy(() => import('./screens/Admin/Export'));

// Market & public pages
const MarketDashboard = lazy(() => import('./screens/MarketDashboard'));

// Intelligence module (v2)
const IntelligenceHome = lazy(() => import('./screens/Intelligence/index'));
const HKObservation = lazy(() => import('./screens/Intelligence/HKObservation'));
const IntelligenceAdminReview = lazy(() => import('./screens/Intelligence/AdminReview'));
const NarrativeTimelineView = lazy(() => import('./screens/Intelligence/NarrativeTimelineView'));

// Homepage (v2)
const Home = lazy(() => import('./screens/Home/index'));

// Glossary
const Glossary = lazy(() => import('./screens/Glossary/index'));

// Enforcement Tracker
const EnforcementTracker = lazy(() => import('./screens/Enforcement/index'));

// Issuer Disclosures Tracker
const DisclosuresTracker = lazy(() => import('./screens/Disclosures/index'));

// Stablecoin Reserve Monitor
const ReserveMonitor = lazy(() => import('./screens/Reserves/index'));

// Projects module (v2)
const ProjectsList = lazy(() => import('./screens/Projects/index'));
const ProjectDetail = lazy(() => import('./screens/Projects/ProjectDetail'));
const Methodology = lazy(() => import('./screens/Methodology'));
const TermsOfService = lazy(() => import('./screens/TermsOfService'));
const About = lazy(() => import('./screens/About'));

// Module 1 — Licenses
const LicensesOverview = lazy(() => import('./screens/Licenses/index'));
const IssuerProfile = lazy(() => import('./screens/Licenses/IssuerProfile'));
const LicensesMethodology = lazy(() => import('./screens/Licenses/Methodology'));

// Module 6 — Incidents
const IncidentsOverview = lazy(() => import('./screens/Incidents/index'));
const IncidentDetail = lazy(() => import('./screens/Incidents/IncidentDetail'));
const IncidentsMethodology = lazy(() => import('./screens/Incidents/Methodology'));

// Module 3 — Tokenized Assets
const AssetsOverview = lazy(() => import('./screens/Assets/index'));
const AssetProfile = lazy(() => import('./screens/Assets/AssetProfile'));
const AssetsMethodology = lazy(() => import('./screens/Assets/Methodology'));

// Module 7 — Reports
const ReportsLibrary = lazy(() => import('./screens/Reports/index'));
const ReportReader = lazy(() => import('./screens/Reports/ReportReader'));
const ReportsMethodology = lazy(() => import('./screens/Reports/Methodology'));

// Module 4 — Compliance Map
const ComplianceMap = lazy(() => import('./screens/Compliance/index'));
const CellDetail = lazy(() => import('./screens/Compliance/CellDetail'));
const ComplianceMethodology = lazy(() => import('./screens/Compliance/Methodology'));

// Module 8 — HK Ecosystem Map
const EcosystemMap = lazy(() => import('./screens/Ecosystem/index'));

// Module 2 — Ensemble
const EnsembleOverview = lazy(() => import('./screens/Ensemble/index'));
const EnsembleTimeline = lazy(() => import('./screens/Ensemble/Timeline'));
const EnsembleUseCases = lazy(() => import('./screens/Ensemble/UseCases'));
const EnsembleInstitutions = lazy(() => import('./screens/Ensemble/Institutions'));
const InstitutionDetail = lazy(() => import('./screens/Ensemble/InstitutionDetail'));
const EnsembleMethodology = lazy(() => import('./screens/Ensemble/Methodology'));

// Due Diligence workbooks
const ScoreForm = lazy(() => import('./screens/RWAScore/Form'));
const AIReview = lazy(() => import('./screens/RWAScore/AIReview'));
const RWAScoreReport = lazy(() => import('./screens/RWAScore/Report'));
const History = lazy(() => import('./screens/RWAScore/History'));

// ── Loading fallback shared across all lazy routes ──
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#5E5C75] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Auth / onboarding (no layout shell) ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/account-pending" element={<AccountPending />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Admin console (separate shell, requires is_admin=true) ── */}
            <Route path="/admin" element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUserList />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="assessments" element={<AdminAssessmentStats />} />
                <Route path="audit-log" element={<AdminAuditLog />} />
                <Route path="export" element={<AdminExport />} />
              </Route>
            </Route>

            {/* ── Main app shell ── */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="market" element={<MarketDashboard />} />
              <Route path="intelligence" element={<IntelligenceHome />} />
              <Route path="intelligence/hk" element={<HKObservation />} />
              <Route path="intelligence/narrative/:slug" element={<NarrativeTimelineView />} />
              <Route path="intelligence/admin" element={<RequireAdmin />}>
                <Route index element={<IntelligenceAdminReview />} />
              </Route>
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/:slug" element={<ProjectDetail />} />
              <Route path="policy" element={<Navigate to="/intelligence" replace />} />
              <Route path="licenses" element={<LicensesOverview />} />
              <Route path="licenses/methodology" element={<LicensesMethodology />} />
              <Route path="licenses/:slug" element={<IssuerProfile />} />
              <Route path="incidents" element={<IncidentsOverview />} />
              <Route path="incidents/methodology" element={<IncidentsMethodology />} />
              <Route path="incidents/:slug" element={<IncidentDetail />} />
              <Route path="assets" element={<AssetsOverview />} />
              <Route path="assets/methodology" element={<AssetsMethodology />} />
              <Route path="assets/:slug" element={<AssetProfile />} />
              <Route path="reports" element={<ReportsLibrary />} />
              <Route path="reports/methodology" element={<ReportsMethodology />} />
              <Route path="reports/:slug" element={<ReportReader />} />
              <Route path="compliance" element={<ComplianceMap />} />
              <Route path="compliance/methodology" element={<ComplianceMethodology />} />
              <Route path="compliance/:jurisdiction/:issue" element={<CellDetail />} />
              <Route path="ensemble" element={<EnsembleOverview />} />
              <Route path="ensemble/timeline" element={<EnsembleTimeline />} />
              <Route path="ensemble/use-cases" element={<EnsembleUseCases />} />
              <Route path="ensemble/institutions" element={<EnsembleInstitutions />} />
              <Route path="ensemble/institutions/:slug" element={<InstitutionDetail />} />
              <Route path="ensemble/methodology" element={<EnsembleMethodology />} />
              <Route path="ecosystem" element={<EcosystemMap />} />
              <Route path="methodology" element={<Methodology />} />
              <Route path="glossary" element={<Glossary />} />
              <Route path="enforcement" element={<EnforcementTracker />} />
              <Route path="disclosures" element={<DisclosuresTracker />} />
              <Route path="reserves" element={<ReserveMonitor />} />
              <Route path="self-assessment" element={<Navigate to="/methodology" replace />} />
              <Route path="framework" element={<Navigate to="/methodology?tab=framework" replace />} />
              <Route path="friction" element={<Navigate to="/methodology?tab=friction" replace />} />
              <Route path="protocols" element={<Navigate to="/market?tab=protocols" replace />} />
              <Route path="leaderboard" element={<Navigate to="/market?tab=protocols" replace />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="about" element={<About />} />

              {/* ── Protected: Due Diligence workbooks ── */}
              <Route path="score" element={<RequireAuth />}>
                <Route index element={<ScoreForm />} />
                <Route path="review/:id" element={<AIReview />} />
                <Route path="report/:id" element={<RWAScoreReport />} />
                <Route path="history" element={<History />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
