import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Download, FileText, AlertCircle, Users, IndianRupee } from 'lucide-react';
import { getFeeTransactions } from '../../services/feeApi';
import { getLibraryMembers } from '../../services/libraryApi';

function fmtAmt(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

export default function LibraryFineReportPage() {
  const [fines, setFines] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txnRes, memRes] = await Promise.all([
        getFeeTransactions({ module_name: 'Library', limit: 2000, start: startDate, end: endDate }),
        getLibraryMembers({ limit: 2000 }),
      ]);
      // Filter only fine-related transactions
      const allTxn = txnRes.data.data || [];
      const fineTxn = allTxn.filter(t =>
        t.fee_category?.toLowerCase().includes('fine') ||
        t.fee_category?.toLowerCase().includes('late') ||
        t.fee_category?.toLowerCase().includes('overdue') ||
        t.fee_category?.toLowerCase().includes('damage') ||
        t.fee_category?.toLowerCase().includes('lost')
      );
      setFines(fineTxn.length ? fineTxn : allTxn); // fallback to all if no fine-specific
      setMembers(memRes.data.data || []);
    } catch { }
    finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalFine = fines.filter(t => t.pay_status === 'captured').reduce((s, t) => s + (t.pay_amount || 0), 0);
  const pendingFine = members.reduce((s, m) => s + ((m.fine_due || 0) - (m.fine_paid || 0)), 0);
  const membersWithFine = members.filter(m => (m.fine_due || 0) > (m.fine_paid || 0));

  const filtered = fines.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (t.student_name || '').toLowerCase().includes(s) || (t.usn || '').toLowerCase().includes(s);
  });

  const downloadCSV = (rows, filename) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = filename + '.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={22} className="text-red-500" /> Library Fine Report
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Fine collection details and outstanding dues</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-700 dark:text-slate-200" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-700 dark:text-slate-200" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Fine Collected', value: fmtAmt(totalFine), color: 'bg-green-600', icon: IndianRupee },
          { label: 'Pending Fine', value: fmtAmt(pendingFine), color: 'bg-red-500', icon: AlertCircle },
          { label: 'Members w/ Due', value: membersWithFine.length, color: 'bg-orange-500', icon: Users },
          { label: 'Fine Records', value: filtered.length, color: 'bg-emerald-600', icon: FileText },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{c.label}</p>
              <div className={`w-7 h-7 rounded-lg ${c.color} flex items-center justify-center`}>
                <c.icon size={14} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /> : c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Members with Outstanding Fine */}
      {membersWithFine.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
            <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={15} /> Members with Outstanding Fine ({membersWithFine.length})
            </h3>
            <button onClick={() => downloadCSV(membersWithFine.map(m => ({
              'Member ID': m.member_id, 'Name': m.name, 'USN': m.usn, 'Program': m.program,
              'Fine Due': m.fine_due, 'Fine Paid': m.fine_paid, 'Outstanding': (m.fine_due || 0) - (m.fine_paid || 0),
            })), 'fine-outstanding')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20">
              <Download size={12} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50/50 dark:bg-red-900/10">
                <tr>
                  {['Member ID', 'Name', 'USN', 'Program', 'Fine Due', 'Fine Paid', 'Outstanding'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 dark:divide-red-900/20">
                {membersWithFine.slice(0, 20).map(m => {
                  const outstanding = (m.fine_due || 0) - (m.fine_paid || 0);
                  return (
                    <tr key={m._id} className="hover:bg-red-50/40 dark:hover:bg-red-900/10">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{m.member_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{m.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{m.usn || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{m.program || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{fmtAmt(m.fine_due)}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">{fmtAmt(m.fine_paid)}</td>
                      <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{fmtAmt(outstanding)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fine Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Fine Collection Transactions ({filtered.length})</h3>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search name / USN…" value={search} onChange={e => setSearch(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none w-40" />
            <button onClick={() => downloadCSV(filtered.map(t => ({
              'Payment ID': t.payment_id, 'USN': t.usn, 'Student': t.student_name,
              'Amount': t.pay_amount, 'Category': t.fee_category, 'Method': t.method,
              'Date': fmtDate(t.captured_date || t.created_at), 'Status': t.pay_status,
            })), 'library-fines')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              <Download size={12} /> CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['USN', 'Student Name', 'Amount', 'Category', 'Method', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <TrendingUp size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-400">No fine records found for selected period</p>
                </td></tr>
              ) : filtered.slice(0, 100).map(t => (
                <tr key={t._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{t.usn || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.student_name || '—'}</td>
                  <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{fmtAmt(t.pay_amount)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{t.fee_category || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{t.method || 'Cash'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{fmtDate(t.captured_date || t.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase
                      ${t.pay_status === 'captured' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {t.pay_status}
                    </span>
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
