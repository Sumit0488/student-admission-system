const STYLES = {
  Live:      { dot: 'bg-green-500',  pill: 'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-400'  },
  Completed: { dot: 'bg-blue-500',   pill: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-400'   },
  Previous:  { dot: 'bg-gray-400',   pill: 'bg-gray-100   text-gray-600   dark:bg-gray-700      dark:text-gray-300'   },
  Cancelled: { dot: 'bg-red-500',    pill: 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-400'    },
  Detained:  { dot: 'bg-orange-500', pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  // Admission statuses (from GraphQL/REST backend)
  APPLIED:   { dot: 'bg-yellow-500', pill: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
  APPROVED:  { dot: 'bg-green-500',  pill: 'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-400'  },
  REJECTED:  { dot: 'bg-red-500',    pill: 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-400'    },
  ENROLLED:  { dot: 'bg-blue-500',   pill: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-400'   },
};

export default function StatusBadge({ status, withDot = true }) {
  const s = STYLES[status] ?? { dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.pill}`}>
      {withDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />}
      {status}
    </span>
  );
}
