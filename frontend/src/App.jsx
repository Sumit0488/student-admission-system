import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdmissionsLayout from './components/AdmissionsLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import EnquiryPage from './pages/admissions/EnquiryPage';
import ScheduleDetailPage from './pages/admissions/ScheduleDetailPage';
import SchedulesPage from './pages/admissions/SchedulesPage';
import ApprovalsPage from './pages/admissions/ApprovalsPage';
import CertificatesPage from './pages/admissions/CertificatesPage';
import TemplateEditorPage from './pages/admissions/TemplateEditorPage';
import CertificateRequestPage from './pages/student/CertificateRequestPage';

// Fee Management pages
import FeeTrackerPage from './pages/fee/FeeTrackerPage';
import FeeScheduleDetailPage from './pages/fee/FeeScheduleDetailPage';
import CollectFeePage from './pages/fee/CollectFeePage';
import PayRecordsPage from './pages/fee/PayRecordsPage';
import TransactionsPage from './pages/fee/TransactionsPage';
import FeeReportsPage from './pages/fee/FeeReportsPage';
import FeeConfigPage from './pages/fee/FeeConfigPage';
import FeeLogsPage from './pages/fee/FeeLogsPage';
import BulkUploadOrdersPage from './pages/fee/BulkUploadOrdersPage';
import BulkUploadPaymentsPage from './pages/fee/BulkUploadPaymentsPage';

// General pages
import GeneralStudentsPage from './pages/general/GeneralStudentsPage';
import ScholarshipPage from './pages/general/ScholarshipPage';
import BankLoanPage from './pages/general/BankLoanPage';
import GeneralReportsPage from './pages/general/GeneralReportsPage';
import GeneralLogsPage from './pages/general/GeneralLogsPage';

// Config pages
import ConfigurationPage from './pages/config/ConfigurationPage';
import StreamPage from './pages/config/StreamPage';
import UserManagementPage from './pages/config/UserManagementPage';
import AcademicSettingsPage from './pages/config/AcademicSettingsPage';

// Super Admin pages
import SuperAdminPage from './pages/superadmin/SuperAdminPage';

// Billing pages
import BillingCustomersPage from './pages/billing/BillingCustomersPage';
import BillingOrdersPage from './pages/billing/BillingOrdersPage';
import BillingTransactionsPage from './pages/billing/BillingTransactionsPage';
import BillingPayRecordsPage from './pages/billing/BillingPayRecordsPage';
import BillingReportsPage from './pages/billing/BillingReportsPage';
import BillingLogsPage from './pages/billing/BillingLogsPage';

// Library pages
import LibraryStudentsPage from './pages/library/LibraryStudentsPage';
import LibraryTransactionsPage from './pages/library/LibraryTransactionsPage';
import LibraryFineReportPage from './pages/library/LibraryFineReportPage';
import LibraryReportsPage from './pages/library/LibraryReportsPage';
import LibraryLogsPage from './pages/library/LibraryLogsPage';

// Hostel pages
import HostelStudentsPage from './pages/hostel/HostelStudentsPage';
import HostelAssetsPage from './pages/hostel/HostelAssetsPage';
import HostelEventsPage from './pages/hostel/HostelEventsPage';
import HostelTimesheetPage from './pages/hostel/HostelTimesheetPage';
import HostelDevicePage from './pages/hostel/HostelDevicePage';
import HostelTransactionsPage from './pages/hostel/HostelTransactionsPage';
import HostelReportsPage from './pages/hostel/HostelReportsPage';

// Alumni pages
import AlumniListPage from './pages/alumni/AlumniListPage';
import AlumniReportsPage from './pages/alumni/AlumniReportsPage';

// Main menu pages
import ReportsPage from './pages/ReportsPage';
import LogsPage from './pages/LogsPage';
import PromoteStudentsPage from './pages/PromoteStudentsPage';

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
      <Route path="/login" element={<LoginPage />} />

      {/* ── All pages share the sidebar Layout ───────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/admissions/students" element={<StudentsPage />} />
        <Route path="/admin/admissions/students/:id" element={<StudentProfilePage />} />
        {/* Legacy redirects */}
        <Route
          path="/admin/students"
          element={<Navigate to="/admin/admissions/students" replace />}
        />
        <Route
          path="/admin/students/:id"
          element={<Navigate to="/admin/admissions/students" replace />}
        />
        {/* Certificates */}
        <Route path="/admin/certificates" element={<CertificatesPage />} />
        <Route path="/admin/certificates/templates/:id" element={<TemplateEditorPage />} />
        {/* Other sidebar pages */}
        <Route path="/admin/finance" element={<Placeholder name="Finance" />} />
        <Route path="/admin/forms" element={<Placeholder name="Forms" />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/logs" element={<LogsPage />} />
        <Route path="/admin/promote" element={<PromoteStudentsPage />} />

        {/* ── Fee Management ────────────────────────────────────────────────── */}
        <Route path="/admin/fee/tracker" element={<FeeTrackerPage />} />
        <Route path="/admin/fee/tracker/:id" element={<FeeScheduleDetailPage />} />
        <Route path="/admin/fee/tracker/:id/bulk-upload-orders" element={<BulkUploadOrdersPage />} />
        <Route path="/admin/fee/bulk-upload-payments" element={<BulkUploadPaymentsPage />} />
        <Route path="/admin/fee/collect" element={<CollectFeePage />} />
        <Route path="/admin/fee/pay-records" element={<PayRecordsPage />} />
        <Route path="/admin/fee/transactions" element={<TransactionsPage />} />
        <Route path="/admin/fee/reports" element={<FeeReportsPage />} />
        <Route path="/admin/fee/configuration" element={<FeeConfigPage />} />
        <Route path="/admin/fee/logs" element={<FeeLogsPage />} />

        {/* ── Configuration ────────────────────────────────────────────────── */}
        <Route path="/admin/config" element={<Navigate to="/admin/config/general" replace />} />
        <Route path="/admin/config/general"      element={<ConfigurationPage section="general"      />} />
        <Route path="/admin/config/academic"        element={<AcademicSettingsPage />} />
        <Route path="/admin/config/academic/streams" element={<StreamPage />} />
        <Route path="/admin/config/onboarding"   element={<ConfigurationPage section="onboarding"   />} />
        <Route path="/admin/config/admission"    element={<ConfigurationPage section="admission"    />} />
        <Route path="/admin/config/fee-template" element={<ConfigurationPage section="fee-template" />} />
        <Route path="/admin/config/users"        element={<UserManagementPage />} />
        <Route path="/admin/config/data"         element={<ConfigurationPage section="data"         />} />
        <Route path="/admin/config/integration"  element={<ConfigurationPage section="integration"  />} />

        {/* ── General ──────────────────────────────────────────────────────── */}
        <Route path="/admin/general/students" element={<GeneralStudentsPage />} />
        <Route path="/admin/general/scholarship" element={<ScholarshipPage />} />
        <Route path="/admin/general/bank-loan" element={<BankLoanPage />} />
        <Route path="/admin/general/reports" element={<GeneralReportsPage />} />
        <Route path="/admin/general/logs" element={<GeneralLogsPage />} />

        {/* ── Billing ──────────────────────────────────────────────────────── */}
        <Route path="/admin/billing/customers" element={<BillingCustomersPage />} />
        <Route path="/admin/billing/orders" element={<BillingOrdersPage />} />
        <Route path="/admin/billing/transactions" element={<BillingTransactionsPage />} />
        <Route path="/admin/billing/pay-records" element={<BillingPayRecordsPage />} />
        <Route path="/admin/billing/reports" element={<BillingReportsPage />} />
        <Route path="/admin/billing/logs" element={<BillingLogsPage />} />

        {/* ── Library ──────────────────────────────────────────────────────── */}
        <Route path="/admin/library/members" element={<LibraryStudentsPage />} />
        <Route path="/admin/library/transactions" element={<LibraryTransactionsPage />} />
        <Route path="/admin/library/fine-report" element={<LibraryFineReportPage />} />
        <Route path="/admin/library/reports" element={<LibraryReportsPage />} />
        <Route path="/admin/library/logs" element={<LibraryLogsPage />} />

        {/* ── Hostel ───────────────────────────────────────────────────────── */}
        <Route path="/admin/hostel/students" element={<HostelStudentsPage />} />
        <Route path="/admin/hostel/assets" element={<HostelAssetsPage />} />
        <Route path="/admin/hostel/events" element={<HostelEventsPage />} />
        <Route path="/admin/hostel/timesheet" element={<HostelTimesheetPage />} />
        <Route path="/admin/hostel/devices" element={<HostelDevicePage />} />
        <Route path="/admin/hostel/transactions" element={<HostelTransactionsPage />} />
        <Route path="/admin/hostel/reports" element={<HostelReportsPage />} />

        {/* ── Super Admin ──────────────────────────────────────────────────── */}
        <Route path="/admin/super-admin" element={<SuperAdminPage />} />

        {/* ── Alumni ───────────────────────────────────────────────────────── */}
        <Route path="/admin/alumni/list" element={<AlumniListPage />} />
        <Route path="/admin/alumni/reports" element={<AlumniReportsPage />} />

        {/* ── Admissions sub-section: sidebar + tab strip ──────────────────── */}
        <Route element={<AdmissionsLayout />}>
          <Route path="/admin/admissions/enquiry" element={<EnquiryPage />} />
          <Route path="/admin/admissions/enquiry/:scheduleId" element={<ScheduleDetailPage />} />
          <Route path="/admin/admissions/schedules" element={<SchedulesPage />} />
          <Route path="/admin/admissions/schedules/:id" element={<ScheduleDetailPage />} />
          <Route path="/admin/admissions/approvals" element={<ApprovalsPage />} />
          {/* Redirect old cert paths */}
          <Route
            path="/admin/admissions/certificates"
            element={<Navigate to="/admin/certificates" replace />}
          />
          <Route
            path="/admin/admissions/certificates/templates/new"
            element={<Navigate to="/admin/certificates/templates/new" replace />}
          />
          <Route
            path="/admin/admissions/certificates/templates/:id"
            element={<Navigate to="/admin/certificates" replace />}
          />
        </Route>
      </Route>

      {/* ── Student self-service (no sidebar) ────────────────────────────── */}
      <Route path="/student/certificates" element={<CertificateRequestPage />} />

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}
