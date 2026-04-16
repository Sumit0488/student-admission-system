import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollText, Search, Trash2, RefreshCw, User, IndianRupee, UserX, UserCheck, UserPlus } from 'lucide-react';
import { getActivityLogs, deleteActivityLog } from '../../services/activityLogApi';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ACTION_ICON = {
  member_added:     { icon: UserPlus,  color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  member_updated:   { icon: UserCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  member_deleted:   { icon: UserX,     color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  member_suspended: { icon: UserX,     color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
  fine_collected:   { icon: IndianRupee, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const ACTION_FILTERS = [
  { key: '', label: 'All Activities' },
  { key: 'member_added', label: 'Member Added' },
  { key: 'member_updated', label: 'Member Updated' },
  { key: 'member_deleted', label: 'Member Deleted' },
  { key: 'member_suspended', label: 'Suspended' },
  { key: 'fine_collected', label: 'Fine Collected' },
];

export default function LibraryLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const searchTimer = useRef(null);
  const LIMIT = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { module: 'Library', page, limit: LIMIT };
      if (search) params.q = search;
      if (actionFilter) params.action = actionFilter;
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      const res = await getActivityLogs(params);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { }
    finally { setLoading(false); }
  }, [page, search, actionFilter, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = v => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this log entry?')) return;
    await deleteActivityLog(id);
    fetchLogs();
  };

  const totalPages = Math.ceil(total / LIMIT);

  const getActionDisplay = (log) => {
    const cfg = ACTION_ICON[log.action];
    const Icon = cfg?.icon || ScrollText;
    const color = cfg?.color || 'text-gray-600 bg-gray-100 dark:bg-slate-700 dark:text-slate-400';
    return { Icon, color };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScrollText size={22} className="text-emerald-600" /> Library Activity Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">All activities performed in the library module</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ACTION_FILTERS.slice(1).map(f => {
          const cfg = ACTION_ICON[f.key];
          const Icon = cfg?.icon || ScrollText;
          return (
            <button key={f.key} onClick={() => { setActionFilter(actionFilter === f.key ? '' : f.key); setPage(1); }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${actionFilter === f.key ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg?.color || 'bg-gray-100 text-gray-600'}`}>
                <Icon size={14} />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search member name, USN, details…"
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 dark:text-slate-100" />
          </div>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-700 dark:text-slate-200" />
          <span className="text-gray-400 text-xs">to</span>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-700 dark:text-slate-200" />
          {(search || actionFilter || startDate || endDate) && (
            <button onClick={() => { setSearch(''); setActionFilter(''); setStartDate(''); setEndDate(''); setPage(1); }}
              className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-slate-400">{total} log entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Action', 'Member / Student', 'Details', 'Amount', 'Performed By', 'Date & Time'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <ScrollText size={36} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-400">No activity logs found</p>
                </td></tr>
              ) : logs.map(log => {
                const { Icon, color } = getActionDisplay(log);
                return (
                  <tr key={log._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                          <Icon size={13} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{log.action_label || log.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{log.student_name || log.entity_label || '—'}</div>
                      {log.usn && <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">{log.usn}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {log.amount ? `₹${Number(log.amount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                        <User size={11} /> {log.performed_by || 'Admin'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(log._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-500 dark:text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
