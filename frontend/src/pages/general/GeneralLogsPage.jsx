import ModuleLogsPage from '../../components/common/ModuleLogsPage';

const ACTION_FILTERS = [
  { key: 'student_created',     label: 'Student Created'     },
  { key: 'student_updated',     label: 'Student Updated'     },
  { key: 'student_deleted',     label: 'Student Deleted'     },
  { key: 'scholarship_created', label: 'Scholarship Created' },
  { key: 'scholarship_updated', label: 'Scholarship Updated' },
  { key: 'loan_created',        label: 'Loan Created'        },
  { key: 'loan_updated',        label: 'Loan Updated'        },
  { key: 'bulk_upload',         label: 'Bulk Upload'         },
];

export default function GeneralLogsPage() {
  return (
    <ModuleLogsPage
      module="General"
      title="General Audit Logs"
      subtitle="All activities — students, scholarships, bank loans"
      accentColor="focus:ring-slate-400"
      actionFilters={ACTION_FILTERS}
    />
  );
}
