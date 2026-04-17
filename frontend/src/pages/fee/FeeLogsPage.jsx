import ModuleLogsPage from '../../components/common/ModuleLogsPage';

const ACTION_FILTERS = [
  { key: 'fee_collected',  label: 'Fee Collected'  },
  { key: 'order_created',  label: 'Order Created'  },
  { key: 'order_updated',  label: 'Order Updated'  },
  { key: 'bulk_upload',    label: 'Bulk Upload'    },
];

export default function FeeLogsPage() {
  return (
    <ModuleLogsPage
      module="Fee"
      title="Fee Audit Logs"
      subtitle="All fee management activities — collections, orders, bulk uploads"
      accentColor="focus:ring-blue-400"
      actionFilters={ACTION_FILTERS}
    />
  );
}
