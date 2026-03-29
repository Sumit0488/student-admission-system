import { Routes, Route, Navigate } from 'react-router-dom';
import Layout            from './components/Layout';
import AdmissionsLayout  from './components/AdmissionsLayout';
import DashboardPage     from './pages/DashboardPage';
import StudentsPage      from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import EnquiryPage          from './pages/admissions/EnquiryPage';
import ScheduleDetailPage   from './pages/admissions/ScheduleDetailPage';
import SchedulesPage        from './pages/admissions/SchedulesPage';
import ApprovalsPage        from './pages/admissions/ApprovalsPage';
import CertificatesPage     from './pages/admissions/CertificatesPage';
import TemplateEditorPage   from './pages/admissions/TemplateEditorPage';
import CertificateRequestPage from './pages/student/CertificateRequestPage';

// Placeholder for routes not yet built
const Placeholder = ({ name }) => (
  <div className="p-8 text-center text-gray-400 dark:text-slate-500">
    <p className="text-4xl mb-3">🚧</p>
    <p className="text-lg font-semibold">{name}</p>
    <p className="text-sm mt-1">This page is coming soon.</p>
  </div>
);

export default function App() {
  return (
    <Routes>

      {/* ── All pages share the sidebar Layout ───────────────────────────────── */}
      <Route element={<Layout />}>
        <Route path="/"                              element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"               element={<DashboardPage />} />
        <Route path="/admin/admissions/students"     element={<StudentsPage />} />
        <Route path="/admin/admissions/students/:id" element={<StudentProfilePage />} />
        {/* Legacy redirects */}
        <Route path="/admin/students"                element={<Navigate to="/admin/admissions/students" replace />} />
        <Route path="/admin/students/:id"            element={<Navigate to="/admin/admissions/students" replace />} />
        {/* Certificates */}
        <Route path="/admin/certificates"                 element={<CertificatesPage />} />
        <Route path="/admin/certificates/templates/:id"  element={<TemplateEditorPage />} />
        {/* Other sidebar pages */}
        <Route path="/admin/finance"        element={<Placeholder name="Finance" />} />
        <Route path="/admin/forms"          element={<Placeholder name="Forms" />} />
        <Route path="/admin/reports"        element={<Placeholder name="Reports" />} />
        <Route path="/admin/logs"           element={<Placeholder name="Activity Logs" />} />
        <Route path="/admin/promote"        element={<Placeholder name="Promote Students" />} />
        <Route path="/admin/fee/tracker"    element={<Placeholder name="Fee Tracker" />} />
        <Route path="/admin/fee/collect"    element={<Placeholder name="Collect Fee" />} />
        <Route path="/admin/fee/transactions" element={<Placeholder name="Transactions" />} />

        {/* ── Admissions sub-section: sidebar + tab strip ──────────────────── */}
        <Route element={<AdmissionsLayout />}>
          <Route path="/admin/admissions/enquiry"             element={<EnquiryPage />} />
          <Route path="/admin/admissions/enquiry/:scheduleId" element={<ScheduleDetailPage />} />
          <Route path="/admin/admissions/schedules"           element={<SchedulesPage />} />
          <Route path="/admin/admissions/schedules/:id"       element={<ScheduleDetailPage />} />
          <Route path="/admin/admissions/approvals"           element={<ApprovalsPage />} />
          {/* Redirect old cert paths */}
          <Route path="/admin/admissions/certificates"                   element={<Navigate to="/admin/certificates" replace />} />
          <Route path="/admin/admissions/certificates/templates/new"     element={<Navigate to="/admin/certificates/templates/new" replace />} />
          <Route path="/admin/admissions/certificates/templates/:id"     element={<Navigate to="/admin/certificates" replace />} />
        </Route>
      </Route>

      {/* ── Student self-service (no sidebar) ────────────────────────────── */}
      <Route path="/student/certificates" element={<CertificateRequestPage />} />

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />

    </Routes>
  );
}
