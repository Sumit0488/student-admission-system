import { useState, useEffect, useCallback } from 'react';
import { Search, Wallet, FileText, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFeeTransactions, getFeeOrders, getFeeRefunds } from '../../services/feeApi';

const TOP_TABS = ['Payments', 'Orders', 'Refunds'];
const PAY_SUB_TABS = ['All', 'Captured', 'Failed', 'Cancelled', 'Refunded'];
const FEE_CATEGORIES = ['All', 'Admission', 'General fee', 'Misc'];

const STATUS_STYLE = {
  captured: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  refunded: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  created: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

const PAY_COLS = ['USN', 'Student Name', 'Receipt No', 'Payment Id', 'Order Id', 'Amount (₹)', 'Created At', 'Status'];
const ORD_COLS = ['Customer ID', 'Customer Name', 'Entity', 'Order ID', 'Fee Category', 'Amount (₹)', 'Attempts', 'Created At', 'Status'];
const REF_COLS = ['Refund ID', 'Student Name', 'USN', 'Amount (₹)', 'Status', 'Method', 'Created At'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtAmt(n) {
  if (!n && n !== 0) return '—';
  return `₹ ${Number(n).toLocaleString('en-IN')}`;
}

function PaymentsTab() {
  const [subTab, setSubTab] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('All');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (subTab !== 'All') params.pay_status = subTab.toLowerCase();
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      if (category !== 'All') params.fee_category = category;
      const { data } = await getFeeTransactions(params);
      setTransactions(data.data || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [subTab, startDate, endDate, category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = transactions.filter((t) =>
    !search ||
    t.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.usn?.toLowerCase().includes(search.toLowerCase()) ||
    t.payment_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {PAY_SUB_TABS.map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${subTab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search USN, name, ID..."
            className="pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 w-52" />
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start date"
          className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
          placeholder="End date"
          className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
          {FEE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {PAY_COLS.map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{PAY_COLS.map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={PAY_COLS.length} className="px-6 py-20 text-center">
                    <Wallet size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No payments have been done until now.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{t.usn || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.student_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{t.receipt_no || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{t.payment_id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{t.order_custom_id || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmtAmt(t.pay_amount)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{fmtDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[t.pay_status] || STATUS_STYLE.captured}`}>
                        {t.pay_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeeOrders().then(({ data }) => setOrders(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50">
              {ORD_COLS.map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{ORD_COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={ORD_COLS.length} className="px-6 py-16 text-center">
                <FileText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="text-sm text-gray-400 dark:text-slate-500">No orders found</p>
              </td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{o.usn || o.customer_crm_id || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{o.student_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{o.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{o.order_id}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{o.fee_category}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmtAmt(o.fee_order_amount)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{o.attempts}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{fmtDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[o.order_status] || STATUS_STYLE.created}`}>
                      {o.order_status}
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

function RefundsTab() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeeRefunds().then(({ data }) => setRefunds(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50">
              {REF_COLS.map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{REF_COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
              ))
            ) : refunds.length === 0 ? (
              <tr><td colSpan={REF_COLS.length} className="px-6 py-16 text-center">
                <FileText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="text-sm text-gray-400 dark:text-slate-500">No refunds found</p>
              </td></tr>
            ) : (
              refunds.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{r.refund_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.student_name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{r.usn || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmtAmt(r.refund_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[r.refund_status] || STATUS_STYLE.pending}`}>
                      {r.refund_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{r.method || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{fmtDate(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [topTab, setTopTab] = useState('Payments');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">View payments, orders, and refunds</p>
        </div>
        <button
          onClick={() => navigate('/admin/fee/bulk-upload-payments')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Upload size={14} /> Bulk Upload Payments
        </button>
      </div>

      {/* Top tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-slate-700">
        {TOP_TABS.map((t) => (
          <button key={t} onClick={() => setTopTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px
              ${topTab === t
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {topTab === 'Payments' && <PaymentsTab />}
      {topTab === 'Orders' && <OrdersTab />}
      {topTab === 'Refunds' && <RefundsTab />}
    </div>
  );
}
