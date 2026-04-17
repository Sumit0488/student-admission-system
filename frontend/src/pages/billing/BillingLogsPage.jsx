import ModuleLogsPage from '../../components/common/ModuleLogsPage';

const ACTION_FILTERS = [
  { key: 'order_created',       label: 'Order Created'       },
  { key: 'order_updated',       label: 'Order Updated'       },
  { key: 'payment_collected',   label: 'Payment Collected'   },
  { key: 'customer_created',    label: 'Customer Created'    },
  { key: 'customer_updated',    label: 'Customer Updated'    },
  { key: 'customer_deleted',    label: 'Customer Deleted'    },
  { key: 'pay_record_created',  label: 'Pay Record Created'  },
  { key: 'pay_record_updated',  label: 'Pay Record Updated'  },
  { key: 'pay_record_deleted',  label: 'Pay Record Deleted'  },
  { key: 'transaction_created', label: 'Transaction Created' },
  { key: 'transaction_updated', label: 'Transaction Updated' },
];

export default function BillingLogsPage() {
  return (
    <ModuleLogsPage
      module="Billing"
      title="Billing Audit Logs"
      subtitle="All billing activities — orders, payments, customers, transactions"
      accentColor="focus:ring-orange-400"
      actionFilters={ACTION_FILTERS}
    />
  );
}
