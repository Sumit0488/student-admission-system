import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollText, Search, Trash2, RefreshCw, User,
  UserPlus, UserMinus, Edit2, CreditCard, ShoppingCart,
  AlertTriangle, CheckCircle, XCircle,
} from 'lucide-react';
import { getActivityLogs, deleteActivityLog } from '../../services/activityLogApi';

const fmtDate = (d) => d
  ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const DEFAULT_ACTION_ICON = {
  // Generic create/update/delete
  student_created:      { icon: UserPlus,     bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-600 dark:text-green-400' },
  student_updated:      { icon: Edit2,        bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  student_deleted:      { icon: UserMinus,    bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400' },
  customer_created:     { icon: UserPlus,     bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  customer_updated:     { icon: Edit2,        bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  customer_deleted:     { icon: UserMinus,    bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400' },
  order_created:        { icon: ShoppingCart, bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  order_updated:        { icon: Edit2,        bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  payment_collected:    { icon: CreditCard,   bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  scholarship_created:  { icon: CheckCircle,  bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  scholarship_updated:  { icon: Edit2,        bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  scholarship_deleted:  { icon: XCircle,      bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400' },
  loan_created:         { icon: CheckCircle,  bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  loan_updated:         { icon: Edit2,        bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  loan_deleted:         { icon: XCircle,      bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400' },
  bulk_upload:          { icon: UserPlus,     bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  // Library
  member_added:         { icon: UserPlus,     bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  member_updated:       { icon: Edit2,        bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  member_deleted:       { icon: UserMinus,    bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400' },
  member_suspended:     { icon: AlertTriangle,bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  fine_collected:       { icon: CreditCard,   bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  fee_collected:        { icon: CreditCard,   bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
};

const FALLBACK_ACTION = { icon: ScrollText, bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-500 dark:text-slate-400' };

const LIMIT = 50;

/**
 * Reusable logs page for any module.
 *
 * Props:
 *   module      — API filter value e.g. 'Billing', 'General', 'Fee'
 *   title       — page heading e.g. 'Billing Audit Logs'
 *   subtitle    — page subtitle
 *   accentColor — tailwind ring color for search focus e.g. 'focus:ring-blue-400'
 *   actionFilters — optional array of { key, label } quick-filter buttons; defaults to empty
 */
export default function ModuleLogsPage({
  module: moduleName,
  title,
  subtitle,
  accentColor = 'focus:ring-blue-400',
  actionFilters = [],
}) {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [deleting, setDeleting]       = useState(null);
  const searchTimer = useRef(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { module: moduleName, page, limit: LIMIT };
      if (search)       params.q      = search;
      if (actionFilter) params.action = actionFilter;
      if (startDate)    params.start  = startDate;
      if (endDate)      params.end    = endDate;
      const res = await getActivityLogs(params);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [moduleName, page, search, actionFilter, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = (v) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this log entry?')) return;
    setDeleting(id);
    try {
      await deleteActivityLog(id);
      setLogs(p => p.filter(l => l._id !== id));
      setTotal(t => t - 1);
    } catch {}
    finally { setDeleting(null); }
  };

  const clearFilters = () => {
    setSearch(''); setActionFilter(''); setStartDate(''); setEndDate(''); setPage(1);
  };
  const hasFilter = search || actionFilter || startDate || endDate;
  const totalPages = Math.ceil(total / LIMIT);

  const inp = `w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 ${accentColor}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScrollText size={20} className="text-gray-500 dark:text-slate-400" />
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <button onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Action quick-filters */}
      {actionFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actionFilters.map(f => {
            const cfg = DEFAULT_ACTION_ICON[f.key] || FALLBACK_ACTION;
            const Icon = cfg.icon;
            return (
              <button key={f.key}
                onClick={() => { setActionFilter(actionFilter === f.key ? '' : f.key); setPage(1); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  actionFilter === f.key
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-gray-300'
                }`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center ${cfg.bg} ${cfg.text}`}>
                  <Icon size={11} />
                </div>
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name, details, entity…"
              onChange={e => handleSearch(e.target.value)}
              className={`pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 ${accentColor} w-full`} />
          </div>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className={inp} style={{ width: 'auto' }} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className={inp} style={{ width: 'auto' }} />
          {hasFilter && (
            <button onClick={clearFilters}
              className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-slate-400">
            <span className="font-semibold text-gray-700 dark:text-slate-300">{total.toLocaleString()}</span> log {total === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Action', 'Name / Entity', 'Details', 'Amount', 'Performed By', 'Date & Time', ''].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                  ))}</tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <ScrollText size={36} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No activity logs yet</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      Actions in the {moduleName} module will be recorded here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map(logEntry => {
                  const cfg  = DEFAULT_ACTION_ICON[logEntry.action] || FALLBACK_ACTION;
                  const Icon = cfg.icon;
                  return (
                    <tr key={logEntry._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                            <Icon size={13} />
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">
                            {logEntry.action_label || logEntry.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                          {logEntry.student_name || logEntry.entity_label || '—'}
                        </p>
                        {logEntry.entity_id && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono truncate max-w-[140px]">{logEntry.entity_id}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 max-w-[200px] truncate">
                        {logEntry.details || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        {logEntry.amount ? `₹${Number(logEntry.amount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                          <User size={11} /> {logEntry.performed_by || 'Admin'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                        {fmtDate(logEntry.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(logEntry._id)}
                          disabled={deleting === logEntry._id}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-500 dark:text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Prev
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
