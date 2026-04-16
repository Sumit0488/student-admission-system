import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, FileText } from 'lucide-react';
import { getBillingTransactions } from '../../services/billingApi';

const COLS = ['Customer ID', 'Customer Name', 'Entity', 'Order ID', 'Payment ID', 'Captured At', 'Receipt No', 'Fee Category', 'Amount'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtAmt(n) {
  if (!n && n !== 0) return '—';
  return `₹ ${Number(n).toLocaleString('en-IN')}`;
}

export default function BillingTransactionsPage() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getBillingTransactions();
      setTxns(data.data || []);
    } catch {
      setTxns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Billing payment transactions</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {COLS.map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <tr key={i}>{COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>)
              ) : txns.length === 0 ? (
                <tr><td colSpan={COLS.length} className="px-6 py-20 text-center">
                  <ArrowLeftRight size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No transactions found</p>
                </td></tr>
              ) : (
                txns.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{t.customer_id || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.customer_name || t.student_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{t.entity}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{t.order_custom_id || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{t.payment_id}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{fmtDate(t.captured_date || t.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{t.receipt_no || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{t.fee_category || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmtAmt(t.pay_amount)}</td>
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
