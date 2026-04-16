import { ScrollText } from 'lucide-react';

export default function GeneralLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          General module activity and audit trail
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Date & Time', 'Name & Email', 'Operation', 'Description', 'Entity'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <ScrollText size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No audit logs yet</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">General module activities will be recorded here</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
