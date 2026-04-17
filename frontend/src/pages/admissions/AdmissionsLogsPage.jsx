import ModuleLogsPage from '../../components/common/ModuleLogsPage';

const ACTION_FILTERS = [
  { key: 'student_created',        label: 'Student Created'       },
  { key: 'student_updated',        label: 'Student Updated'       },
  { key: 'student_deleted',        label: 'Student Deleted'       },
  { key: 'student_status_changed', label: 'Status Changed'        },
];

export default function AdmissionsLogsPage() {
  return (
    <ModuleLogsPage
      module="Admissions"
      title="Admissions Audit Logs"
      subtitle="All admission activities — student create, update, delete, status changes"
      accentColor="focus:ring-blue-400"
      actionFilters={ACTION_FILTERS}
    />
  );
}
