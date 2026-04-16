import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertCircle, Download,
  Search, ChevronDown, Upload,
} from 'lucide-react';
import {
  getFeeScheduleById,
  getFeeScheduleStats,
  patchFeeScheduleStatus,
  getFeeOrdersBySchedule,
  getFeeStructuresBySchedule,
  getFeeTransactionsByOrderIds,
  createOrdersFromFeeStructure,
} from '../../services/feeApi';

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, toast: add };
}

function Toasts({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto
            ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {t.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return '₹ 0';
  return '₹ ' + Number(n).toLocaleString('en-IN');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Info Card ─────────────────────────────────────────────────────────────────
function InfoCard({ bg, label, value }) {
  return (
    <div className={`${bg} rounded-2xl p-5 flex items-start gap-4`}>
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <CheckCircle size={20} className="text-white" />
      </div>
      <div>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-bold text-base leading-tight">{value || '—'}</p>
      </div>
    </div>
  );
}

// ── Stat Cell ─────────────────────────────────────────────────────────────────
function StatCell({ label, value }) {
  return (
    <div className="flex flex-col items-center justify-center py-4 px-2 text-center border-r border-gray-100 dark:border-slate-700 last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-800 dark:text-white">{value ?? '—'}</p>
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder = 'All' }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ── Statistics Tab ────────────────────────────────────────────────────────────
function StatisticsTab({ stats }) {
  const programs = stats?.programs || [];
  const overall = stats?.overall || {};

  const totalAmt = overall.total_amount || 0;
  const paidAmt  = overall.paid_amount  || 0;
  const dueAmt   = totalAmt - paidAmt;
  const collPct  = totalAmt > 0 ? ((paidAmt / totalAmt) * 100).toFixed(1) : '0.0';

  const KPI = [
    { label: 'Total Orders',       value: overall.total ?? 0,          sub: null,                        color: 'bg-[#002250]',    text: 'text-white' },
    { label: 'Total Amount',       value: fmt(totalAmt),               sub: null,                        color: 'bg-blue-600',     text: 'text-white' },
    { label: 'Amount Collected',   value: fmt(paidAmt),                sub: `${collPct}% collected`,     color: 'bg-green-600',    text: 'text-white' },
    { label: 'Pending Amount',     value: fmt(dueAmt),                 sub: `${(100 - parseFloat(collPct)).toFixed(1)}% pending`, color: 'bg-orange-500', text: 'text-white' },
    { label: 'Not Paid',           value: overall.not_paid ?? 0,       sub: 'orders',                    color: 'bg-red-500',      text: 'text-white' },
    { label: 'Partially Paid',     value: overall.partial ?? 0,        sub: 'orders',                    color: 'bg-yellow-500',   text: 'text-white' },
    { label: 'Fully Paid',         value: overall.paid_full ?? 0,      sub: 'orders',                    color: 'bg-emerald-600',  text: 'text-white' },
    { label: 'Collection %',       value: `${collPct}%`,               sub: 'of total demand',           color: 'bg-purple-600',   text: 'text-white' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {KPI.map((k) => (
          <div key={k.label} className={`${k.color} rounded-xl p-4 flex flex-col gap-1`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{k.label}</p>
            <p className="text-xl font-bold text-white leading-tight">{k.value}</p>
            {k.sub && <p className="text-[10px] text-white/60">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Collection progress bar */}
      <div className="bg-gray-50 dark:bg-slate-900/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-400">Fee Collection Progress</p>
          <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{collPct}%</p>
        </div>
        <div className="w-full h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, parseFloat(collPct))}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 dark:text-slate-500">
          <span>Collected: {fmt(paidAmt)}</span>
          <span>Pending: {fmt(dueAmt)}</span>
        </div>
      </div>

      {/* Program-wise breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Program-wise Breakdown</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={12} /> Export
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['PROGRAM', 'TOTAL ORDERS', 'NOT PAID', 'PARTIALLY PAID', 'FULLY PAID', 'TOTAL AMOUNT', 'PAID AMOUNT', 'BALANCE'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 py-3 px-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 dark:text-slate-500 text-sm">
                    No orders created yet. Use &ldquo;Create Order from Fee Structure&rdquo; to generate orders.
                  </td>
                </tr>
              ) : (
                programs.map((p, i) => {
                  const balance = (p.total_amount || 0) - (p.paid_amount || 0);
                  return (
                    <tr key={i} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-slate-200 max-w-[200px] truncate">{p.program}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-400 font-medium">{p.total}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{p.not_paid}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">{p.partial}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{p.paid_full}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-slate-200">{fmt(p.total_amount)}</td>
                      <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">{fmt(p.paid_amount)}</td>
                      <td className="py-3 px-4 font-medium text-orange-600 dark:text-orange-400">{fmt(balance)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {programs.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-slate-900/50 border-t-2 border-gray-200 dark:border-slate-600">
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-800 dark:text-white text-xs uppercase tracking-wide">Total</td>
                  <td className="py-3 px-4 font-bold text-gray-800 dark:text-white">{overall.total ?? 0}</td>
                  <td className="py-3 px-4 font-bold text-red-700 dark:text-red-400">{overall.not_paid ?? 0}</td>
                  <td className="py-3 px-4 font-bold text-yellow-700 dark:text-yellow-400">{overall.partial ?? 0}</td>
                  <td className="py-3 px-4 font-bold text-green-700 dark:text-green-400">{overall.paid_full ?? 0}</td>
                  <td className="py-3 px-4 font-bold text-gray-800 dark:text-white">{fmt(totalAmt)}</td>
                  <td className="py-3 px-4 font-bold text-green-700 dark:text-green-400">{fmt(paidAmt)}</td>
                  <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400">{fmt(dueAmt)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
function PaymentsTab({ transactions, loadingTxns }) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const methods = [...new Set(transactions.map((t) => t.method).filter(Boolean))];

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.student_name?.toLowerCase().includes(q) || t.usn?.toLowerCase().includes(q);
    const matchMethod = !methodFilter || t.method === methodFilter;
    return matchSearch && matchMethod;
  });

  const totalCollected = filtered.reduce((s, t) => s + (t.pay_amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or USN..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {methods.length > 0 && (
          <Select value={methodFilter} onChange={setMethodFilter} options={methods} placeholder="Method: All" />
        )}
        <div className="ml-auto flex items-center gap-3">
          {filtered.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Total Collected: <span className="font-bold text-green-600 dark:text-green-400">{fmt(totalCollected)}</span>
            </span>
          )}
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50">
              {['Student Name', 'USN', 'Payment ID', 'Amount (₹)', 'Method', 'Reference', 'Date', 'Status'].map((h) => (
                <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 py-3 px-4 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingTxns ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">
                  No payment transactions found for this schedule
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t._id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-800 dark:text-slate-200">{t.student_name || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{t.usn || '—'}</td>
                  <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-mono text-xs">{t.payment_id || '—'}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800 dark:text-slate-200">{fmt(t.pay_amount)}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-slate-300">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      {t.method || 'Cash'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-slate-400 text-xs">{t.offline_ref || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-slate-500 text-xs whitespace-nowrap">{fmtDate(t.captured_date || t.created_at)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                      ${t.pay_status === 'captured' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : t.pay_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      {t.pay_status || 'captured'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Fee Details Tab ───────────────────────────────────────────────────────────
function FeeDetailsTab({ structures }) {
  const [batch, setBatch] = useState('');
  const [quota, setQuota] = useState('');
  const [program, setProgram] = useState('');
  const [expanded, setExpanded] = useState(null);

  const batches  = [...new Set(structures.map((s) => s.batch).filter(Boolean))];
  const quotas   = [...new Set(structures.map((s) => s.quota).filter(Boolean))];
  const programs = [...new Set(structures.map((s) => s.program).filter(Boolean))];

  const filtered = structures.filter((s) => {
    if (batch   && s.batch   !== batch)   return false;
    if (quota   && s.quota   !== quota)   return false;
    if (program && s.program !== program) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={batch}   onChange={setBatch}   options={batches}   placeholder="Batch: All" />
        <Select value={quota}   onChange={setQuota}   options={quotas}    placeholder="Quota: All" />
        <Select value={program} onChange={setProgram} options={programs}  placeholder="Program: All" />
        <button className="ml-auto flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download size={12} /> Export
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400 dark:text-slate-500">
          No fee structures linked to this category. Add structures in Fee Configuration.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, i) => {
            const isOpen = expanded === i;
            const heads = s.fee_structure || [];
            return (
              <div key={i} className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.program || '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.fee_struct_name}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                      {s.batch && <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">{s.batch}</span>}
                      {s.quota && <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">{s.quota}</span>}
                      {s.stream && <span className="text-gray-400">{s.stream}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-base font-bold text-gray-900 dark:text-white">{fmt(s.fee_total_amount)}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded fee heads */}
                {isOpen && heads.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20 px-5 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">Fee Heads Breakdown</p>
                    <div className="space-y-1.5">
                      {heads.map((h, hi) => (
                        <div key={hi} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {hi + 1}
                            </span>
                            <span className="text-sm text-gray-700 dark:text-slate-300">{h.fee_head || '—'}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{fmt(h.fee_head_amount)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 mt-1">
                        <span className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wide">Total</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(s.fee_total_amount)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {isOpen && heads.length === 0 && (
                  <div className="border-t border-gray-100 dark:border-slate-700 px-5 py-4 text-xs text-gray-400 dark:text-slate-500">
                    No fee heads defined for this structure.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab({ orders, scheduleId }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('');

  const programs = [...new Set(orders.map((o) => o.program).filter(Boolean))];

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    if (q && !(o.student_name?.toLowerCase().includes(q) || o.usn?.toLowerCase().includes(q))) return false;
    if (program && o.program !== program) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Student..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <Select value={program} onChange={setProgram} options={programs} placeholder="Program: All" />
        <button
          onClick={() => navigate(`/admin/fee/tracker/${scheduleId}/bulk-upload-orders`)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Upload size={14} /> BULK UPLOAD
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download size={14} /> EXPORT
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700">
              {['Name', 'USN', 'Program', 'Order Id', 'Amount (₹)', 'Paid (₹)', 'Due (₹)', 'Status'].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 py-3 px-4 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400 dark:text-slate-500">No orders found</td></tr>
            ) : (
              filtered.map((o) => (
                <tr key={o._id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-800 dark:text-slate-200">{o.student_name || '—'}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-slate-400 font-mono text-xs">{o.usn || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-slate-400 text-xs max-w-[140px] truncate">{o.program || '—'}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-slate-400 font-mono text-xs">{o.order_id || '—'}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800 dark:text-slate-200">{fmt(o.fee_order_amount)}</td>
                  <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">{fmt(o.fee_paid_amount || 0)}</td>
                  <td className="py-3 px-4 font-medium text-orange-700 dark:text-orange-400">{fmt(o.fee_due_amount || 0)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                      ${o.order_status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : o.order_status === 'partial' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                    >
                      {o.order_status || 'created'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Create Orders Modal ────────────────────────────────────────────────────────
function CreateOrdersModal({ onClose, onConfirm, creating }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Create Orders</h3>
        </div>
        <div className="px-6 py-6">
          <p className="text-gray-700 dark:text-slate-300 text-sm text-center">
            Are you sure you want to create order from fee structure for all students
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onConfirm}
            disabled={creating}
            className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ['Statistics', 'Payments', 'Fee Details', 'Orders'];

export default function FeeScheduleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, toast } = useToast();

  const [schedule, setSchedule] = useState(null);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [structures, setStructures] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Statistics');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showCreateOrdersModal, setShowCreateOrdersModal] = useState(false);
  const [creatingOrders, setCreatingOrders] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, statsRes, ordersRes, structRes] = await Promise.allSettled([
        getFeeScheduleById(id),
        getFeeScheduleStats(id),
        getFeeOrdersBySchedule(id),
        getFeeStructuresBySchedule(id),
      ]);
      if (schedRes.status === 'fulfilled') setSchedule(schedRes.value.data?.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data);
      if (ordersRes.status === 'fulfilled') {
        const loadedOrders = ordersRes.value.data?.data || [];
        setOrders(loadedOrders);
        // Fetch transactions for these orders
        if (loadedOrders.length > 0) {
          setLoadingTxns(true);
          const orderIds = loadedOrders.map((o) => o._id);
          getFeeTransactionsByOrderIds(orderIds)
            .then(({ data }) => setTransactions(data.data || []))
            .catch(() => {})
            .finally(() => setLoadingTxns(false));
        }
      }
      if (structRes.status === 'fulfilled') setStructures(structRes.value.data?.data || []);
    } catch {
      toast('Failed to load schedule details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateOrders = async () => {
    setCreatingOrders(true);
    try {
      const res = await createOrdersFromFeeStructure(id);
      const { created, skipped } = res.data?.data || {};
      toast(`Created ${created} orders (${skipped} skipped)`);
      setShowCreateOrdersModal(false);
      // Refresh orders and stats
      const [statsRes, ordersRes] = await Promise.allSettled([
        getFeeScheduleStats(id),
        getFeeOrdersBySchedule(id),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data);
      if (ordersRes.status === 'fulfilled') {
        const refreshedOrders = ordersRes.value.data?.data || [];
        setOrders(refreshedOrders);
        if (refreshedOrders.length > 0) {
          const ids = refreshedOrders.map((o) => o._id);
          getFeeTransactionsByOrderIds(ids).then(({ data }) => setTransactions(data.data || [])).catch(() => {});
        }
      }
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create orders', 'error');
    } finally {
      setCreatingOrders(false);
    }
  };

  const handleDeactivate = async () => {
    if (!schedule) return;
    const newStatus = schedule.fee_sched_status === 'active' ? 'inactive' : 'active';
    setStatusUpdating(true);
    try {
      const res = await patchFeeScheduleStatus(id, newStatus);
      setSchedule(res.data?.data);
      toast(`Schedule ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch {
      toast('Failed to update status', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-xl w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-slate-700" />)}
        </div>
        <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
        <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-600 dark:text-slate-400 font-medium">Schedule not found</p>
        <button
          onClick={() => navigate('/admin/fee/tracker')}
          className="mt-4 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Fee Tracker
        </button>
      </div>
    );
  }

  const status = schedule.fee_sched_status || 'draft';
  const isActive = status === 'active';
  const overall = stats?.overall || {};

  const STATUS_BADGE = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    inactive: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    draft: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  return (
    <>
      <Toasts toasts={toasts} />
      {showCreateOrdersModal && (
        <CreateOrdersModal
          onClose={() => setShowCreateOrdersModal(false)}
          onConfirm={handleCreateOrders}
          creating={creatingOrders}
        />
      )}

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => navigate('/admin/fee/tracker')}
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex-shrink-0"
            >
              <ArrowLeft size={15} /> Schedule Fees
            </button>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[status]}`}>
              {status.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDeactivate}
              disabled={statusUpdating}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
            >
              {statusUpdating ? 'Updating...' : isActive ? 'REQUEST FOR DE-ACTIVATE' : 'REQUEST FOR ACTIVATE'}
            </button>
            <button
              onClick={() => setActiveTab('Payments')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download size={13} /> TRANSACTIONS
            </button>
            <button
              onClick={() => setActiveTab('Orders')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download size={13} /> ORDERS
            </button>
            <button
              onClick={() => setShowCreateOrdersModal(true)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
            >
              CREATE ORDER FROM FEE STRUCTURE
            </button>
          </div>
        </div>

        {/* ── Info Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard
            bg="bg-gradient-to-br from-yellow-400 to-yellow-600"
            label="CATEGORY / SEMESTER"
            value={`${schedule.fee_category || '—'} / ${schedule.term ? schedule.term + ' Sem' : '—'}`}
          />
          <InfoCard
            bg="bg-gradient-to-br from-green-500 to-green-700"
            label="ACADEMIC YEAR"
            value={schedule.academic_year}
          />
          <InfoCard
            bg="bg-gradient-to-br from-slate-700 to-slate-900"
            label="TOTAL AMOUNT"
            value={fmt(overall.total_amount)}
          />
          <InfoCard
            bg="bg-gradient-to-br from-red-500 to-red-700"
            label="PAID AMOUNT"
            value={fmt(overall.paid_amount)}
          />
        </div>

        {/* ── Stats Bar ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-4 lg:grid-cols-8">
            <StatCell label="START DATE" value={fmtDate(schedule.start_date)} />
            <StatCell label="END DATE" value={fmtDate(schedule.end_date)} />
            <StatCell label="PAYMENT" value={schedule.fee_collection_mode?.toUpperCase() || 'BOTH'} />
            <StatCell label="MIN AMOUNT" value={fmt(0)} />
            <StatCell label="TOTAL" value={overall.total ?? 0} />
            <StatCell label="NOT PAID" value={overall.not_paid ?? 0} />
            <StatCell label="PARTIAL" value={overall.partial ?? 0} />
            <StatCell label="PAID FULL" value={overall.paid_full ?? 0} />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-gray-200 dark:border-slate-700">
          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors
                  ${activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          {activeTab === 'Statistics' && <StatisticsTab stats={stats} />}
          {activeTab === 'Payments' && <PaymentsTab transactions={transactions} loadingTxns={loadingTxns} />}
          {activeTab === 'Fee Details' && <FeeDetailsTab structures={structures} />}
          {activeTab === 'Orders' && <OrdersTab orders={orders} scheduleId={id} />}
        </div>
      </div>
    </>
  );
}
