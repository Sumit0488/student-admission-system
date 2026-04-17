import ModuleLogsPage from '../../components/common/ModuleLogsPage';

const ACTION_FILTERS = [
  { key: 'alumni_added',   label: 'Alumni Added'   },
  { key: 'alumni_updated', label: 'Alumni Updated' },
  { key: 'alumni_deleted', label: 'Alumni Deleted' },
];

export default function AlumniLogsPage() {
  return (
    <ModuleLogsPage
      module="Alumni"
      title="Alumni Audit Logs"
      subtitle="All alumni activities — add, update, delete"
      accentColor="focus:ring-purple-400"
      actionFilters={ACTION_FILTERS}
    />
  );
}
