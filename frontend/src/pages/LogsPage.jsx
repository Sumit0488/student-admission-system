import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, Search, Trash2, UserPlus, UserMinus, Edit2, AlertTriangle,
  BookOpen, Home, UserSquare2, ShoppingCart, CreditCard, Users, X,
} from 'lucide-react';
import { getActivityLogs, deleteActivityLog } from '../services/activityLogApi';
import { useToast } from '../hooks/useToast';
import Toasts from '../components/Toasts';

const MODULES = ['All', 'Library', 'Hostel', 'Alumni', 'Billing', 'Fee', 'General'];

const MODULE_ICON = {
  Library: BookOpen,
  Hostel: Home,
  Alumni: UserSquare2,
  Billing: ShoppingCart,
  Fee: CreditCard,
  General: Users,
};

const MODULE_COLOR = {
  Library:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  Hostel:   'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  Alumni:   'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  Billing:  'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  Fee:      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  General:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-slate-400',
};

const ACTION_ICON = {
  member_added:    { icon: UserPlus,     color: 'text-green-600 dark:text-green-400' },
  member_updated:  { icon: Edit2,        color: 'text-blue-600 dark:text-blue-400' },
  member_deleted:  { icon: UserMinus,    color: 'text-red-600 dark:text-red-400' },
  member_suspended:{ icon: AlertTriangle,color: 'text-orange-500' },
  fine_collected:  { icon: CreditCard,   color: 'text-emerald-600 dark:text-emerald-400' },
  fee_collected:   { icon: CreditCard,   color: 'text-blue-600 dark:text-blue-400' },
  alumni_added:    { icon: UserPlus,     color: 'text-green-600 dark:text-green-400' },
  alumni_updated:  { icon: Edit2,        color: 'text-blue-600 dark:text-blue-400' },
  alumni_deleted:  { icon: UserMinus,    color: 'text-red-600 dark:text-red-400' },
  order_created:   { icon: ShoppingCart, color: 'text-orange-500' },
  order_updated:   { icon: Edit2,        color: 'text-blue-600 dark:text-blue-400' },
  asset_issued:    { icon: UserPlus,     color: 'text-cyan-600 dark:text-cyan-400' },
  asset_returned:  { icon: UserMinus,    color: 'text-gray-500' },
  event_created:   { icon: UserPlus,     color: 'text-purple-600 dark:text-purple-400' },
  device_assigned: { icon: UserPlus,     color: 'text-cyan-600 dark:text-cyan-400' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const LIMIT = 25;

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { toasts, toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (moduleFilter !== 'All') params.module = moduleFilter;
      if (search.trim()) params.q = search.trim();
      if (dateFrom) params.start = dateFrom;
      if (dateTo) params.end = dateTo;
      const { data } = await getActivityLogs(params);
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast('Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, search, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteActivityLog(id);
      setLogs(p => p.filter(l => l._id !== id));
      setTotal(t => t - 1);
      toast('Log entry deleted');
    } catch {
      toast('Failed to delete', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const clearFilters = () => {
    setSearch(''); setModuleFilter('All'); setDateFrom(''); setDateTo(''); setPage(1);
  };
  const hasFilter = moduleFilter !== 'All' || search || dateFrom || dateTo;

  return (
    <>
      <Toasts toasts={toasts} />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">All operations across Library, Hostel, Alumni, Billing &amp; more</p>
          </div>
          {hasFilter && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by student name, USN, performed by..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            {/* Module filter */}
            <div className="flex gap-1 flex-wrap">
              {MODULES.map(m => (
                <button key={m} onClick={() => { setModuleFilter(m); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                    ${moduleFilter === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                  {m}
                </button>
              ))}
            </div>

            {/* Date range */}
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 dark:border-slate-700/50">
            <span className="text-xs text-gray-500 dark:text-slate-400">
              <span className="font-semibold text-gray-700 dark:text-slate-300">{total.toLocaleString()}</span> log entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50">
                  {['Action', 'Module', 'Student / Entity', 'Details', 'Amount', 'Performed By', 'Date & Time', ''].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <ScrollText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                      <p className="text-sm text-gray-400 dark:text-slate-500">No log entries found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const actionDef = ACTION_ICON[log.action] || { icon: ScrollText, color: 'text-gray-400' };
                    const ActionIcon = actionDef.icon;
                    const ModIcon = MODULE_ICON[log.module] || ScrollText;

                    return (
                      <tr key={log._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ActionIcon size={14} className={actionDef.color} />
                            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                              {log.action_label || log.action}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${MODULE_COLOR[log.module] || MODULE_COLOR.General}`}>
                            <ModIcon size={10} />
                            {log.module}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px]">{log.student_name || log.entity_label || '—'}</p>
                          {log.usn && <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{log.usn}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 max-w-[180px] truncate">{log.details || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300">
                          {log.amount ? `₹${Number(log.amount).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{log.performed_by || 'Admin'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{fmtDate(log.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(log._id)}
                            disabled={deleting === log._id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && total > LIMIT && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Page <span className="font-semibold text-gray-600 dark:text-slate-300">{page}</span> · {total} total
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
