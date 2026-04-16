/**
 * Reusable Transactions page for any module (Library, Hostel, Exam, etc.)
 * Pass `moduleName` prop to filter by module_name.
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Wallet, ArrowDownToLine } from 'lucide-react';
import { getFeeTransactions, getFeeOrders, getFeeRefunds } from '../../services/feeApi';

const TOP_TABS = ['Payments', 'Orders', 'Refunds'];

const STATUS_STYLE = {
  captured: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  refunded: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  created: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  partial: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

const PAY_COLS = ['USN', 'Student Name', 'Payment ID', 'Amount (₹)', 'Method', 'Category', 'Date', 'Status'];
const ORD_COLS = ['Order ID', 'USN', 'Student Name', 'Category', 'Amount (₹)', 'Paid (₹)', 'Due (₹)', 'Status'];
const REF_COLS = ['Student Name', 'USN', 'Amount (₹)', 'Status', 'Method', 'Date'];

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function fmtAmt(n) { return n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'; }

function PaymentsTab({ moduleName }) {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subTab, setSubTab] = useState('All');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { module_name: moduleName, limit: 500 };
      if (subTab !== 'All') params.pay_status = subTab.toLowerCase();
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      const { data } = await getFeeTransactions(params);
      setTxns(data.data || []);
    } catch { setTxns([]); }
    finally { setLoading(false); }
  }, [moduleName, subTab, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = txns.filter(t =>
    !search || t.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.usn?.toLowerCase().includes(search.toLowerCase()) ||
    t.payment_id?.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, t) => s + (t.pay_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 flex-wrap">
        {['All', 'Captured', 'Refunded', 'Cancelled'].map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${subTab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search USN, name, ID..."
            className="pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-52 text-gray-700 dark:text-slate-200" />
        </div>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
        {filtered.length > 0 && (
          <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Total Collected:</span>
            <span className="text-sm font-bold text-green-700 dark:text-green-300">{fmtAmt(total)}</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {PAY_COLS.map(h => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{PAY_COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={PAY_COLS.length} className="px-6 py-20 text-center">
                  <Wallet size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No transactions found</p>
                </td></tr>
              ) : filtered.map(t => (
                <tr key={t._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{t.usn || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.student_name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{t.payment_id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{fmtAmt(t.pay_amount)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">{t.method || 'Cash'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{t.fee_category || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{fmtDate(t.captured_date || t.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[t.pay_status] || STATUS_STYLE.captured}`}>{t.pay_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ moduleName }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getFeeOrders({ module_name: moduleName, limit: 500 })
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [moduleName]);

  const filtered = orders.filter(o =>
    !search || o.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.usn?.toLowerCase().includes(search.toLowerCase()) || o.order_id?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="relative w-64">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {ORD_COLS.map(h => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{ORD_COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={ORD_COLS.length} className="px-6 py-16 text-center">
                  <FileText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-400 dark:text-slate-500">No orders found</p>
                </td></tr>
              ) : filtered.map(o => (
                <tr key={o._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{o.order_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{o.usn || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{o.student_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{o.fee_category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{fmtAmt(o.fee_order_amount)}</td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400">{fmtAmt(o.fee_paid_amount)}</td>
                  <td className="px-4 py-3 text-orange-600 dark:text-orange-400">{fmtAmt(o.fee_due_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[o.order_status] || STATUS_STYLE.created}`}>{o.order_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RefundsTab({ moduleName }) {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeeRefunds({ module_name: moduleName }).then(({ data }) => setRefunds(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [moduleName]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50">
              {REF_COLS.map(h => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>{REF_COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
            )) : refunds.length === 0 ? (
              <tr><td colSpan={REF_COLS.length} className="px-6 py-16 text-center">
                <FileText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="text-sm text-gray-400 dark:text-slate-500">No refunds found</p>
              </td></tr>
            ) : refunds.map(r => (
              <tr key={r._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.student_name || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{r.usn || '—'}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{fmtAmt(r.refund_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[r.refund_status] || STATUS_STYLE.pending}`}>{r.refund_status}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{r.method || '—'}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ModuleTransactionsPage({ moduleName, title, description, accentColor = 'blue' }) {
  const [topTab, setTopTab] = useState('Payments');

  const colorMap = {
    blue: { active: 'border-blue-600 text-blue-600 dark:text-blue-400' },
    emerald: { active: 'border-emerald-600 text-emerald-600 dark:text-emerald-400' },
    purple: { active: 'border-purple-600 text-purple-600 dark:text-purple-400' },
    orange: { active: 'border-orange-600 text-orange-600 dark:text-orange-400' },
  };
  const activeStyle = colorMap[accentColor]?.active || colorMap.blue.active;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title || `${moduleName} Transactions`}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{description || `View payments, orders, and refunds for ${moduleName}`}</p>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-slate-700">
        {TOP_TABS.map(t => (
          <button key={t} onClick={() => setTopTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px
              ${topTab === t ? activeStyle + ' border-current' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {topTab === 'Payments' && <PaymentsTab moduleName={moduleName} />}
      {topTab === 'Orders' && <OrdersTab moduleName={moduleName} />}
      {topTab === 'Refunds' && <RefundsTab moduleName={moduleName} />}
    </div>
  );
}
