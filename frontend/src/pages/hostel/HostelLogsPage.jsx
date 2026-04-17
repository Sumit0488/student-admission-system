import ModuleLogsPage from '../../components/common/ModuleLogsPage';

const ACTION_FILTERS = [
  { key: 'member_added',       label: 'Resident Added'    },
  { key: 'member_updated',     label: 'Resident Updated'  },
  { key: 'member_deleted',     label: 'Resident Deleted'  },
  { key: 'fee_collected',      label: 'Fee Collected'     },
  { key: 'event_created',      label: 'Event Created'     },
  { key: 'event_updated',      label: 'Event Updated'     },
  { key: 'event_deleted',      label: 'Event Deleted'     },
  { key: 'asset_issued',       label: 'Asset Issued'      },
  { key: 'asset_returned',     label: 'Asset Returned'    },
  { key: 'asset_deleted',      label: 'Asset Deleted'     },
  { key: 'device_added',       label: 'Device Added'      },
  { key: 'device_assigned',    label: 'Device Assigned'   },
  { key: 'device_returned',    label: 'Device Returned'   },
  { key: 'device_deleted',     label: 'Device Deleted'    },
  { key: 'timesheet_recorded', label: 'Timesheet Recorded'},
];

export default function HostelLogsPage() {
  return (
    <ModuleLogsPage
      module="Hostel"
      title="Hostel Audit Logs"
      subtitle="All hostel activities — residents, fees, events, assets, devices"
      accentColor="focus:ring-green-400"
      actionFilters={ACTION_FILTERS}
    />
  );
}
