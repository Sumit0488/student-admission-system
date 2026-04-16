import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Download, FileText, TrendingUp, Home, Users } from 'lucide-react';
import { getFeeTransactions } from '../../services/feeApi';
import { getHostelStudents } from '../../services/hostelApi';

function fmtAmt(n) { return n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0'; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

export default function HostelReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txnRes, resRes] = await Promise.all([
        getFeeTransactions({ module_name: 'Hostel', limit: 1000, start: startDate, end: endDate }),
        getHostelStudents({ limit: 1000 }),
      ]);
      setTransactions(txnRes.data.data || []);
      setResidents(resRes.data.data || []);
    } catch { }
    finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalCollected = transactions.filter(t => t.pay_status === 'captured').reduce((s, t) => s + (t.pay_amount || 0), 0);
  const totalRefunded = transactions.filter(t => t.pay_status === 'refunded').reduce((s, t) => s + (t.pay_amount || 0), 0);
  const byCategory = transactions.reduce((acc, t) => {
    const cat = t.fee_category || 'Other';
    acc[cat] = (acc[cat] || 0) + (t.pay_amount || 0);
    return acc;
  }, {});
  const byDate = transactions.reduce((acc, t) => {
    const d = new Date(t.captured_date || t.created_at).toLocaleDateString('en-IN');
    acc[d] = (acc[d] || 0) + (t.pay_amount || 0);
    return acc;
  }, {});

  // Hostel-wise breakdown
  const byHostel = residents.reduce((acc, r) => {
    const h = r.hostel_name || 'Unassigned';
    if (!acc[h]) acc[h] = { total: 0, active: 0 };
    acc[h].total += 1;
    if (r.status === 'Active') acc[h].active += 1;
    return acc;
  }, {});

  const downloadCSV = (rows, filename) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = filename + '.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 size={22} className="text-blue-600" /> Hostel Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Hostel fee collection reports and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Residents', value: residents.length, color: 'bg-blue-600', icon: Users },
          { label: 'Active Residents', value: residents.filter(r => r.status === 'Active').length, color: 'bg-green-600', icon: Home },
          { label: 'Total Collected', value: fmtAmt(totalCollected), color: 'bg-blue-700', icon: BarChart2 },
          { label: 'Total Refunded', value: fmtAmt(totalRefunded), color: 'bg-orange-500', icon: TrendingUp },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Category Breakdown</h3>
            <button onClick={() => downloadCSV(Object.entries(byCategory).map(([cat, amt]) => ({ Category: cat, Amount: amt })), 'hostel-category-report')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Download size={12} /> CSV
            </button>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />)
            ) : Object.keys(byCategory).length === 0 ? (
              <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">No data for selected period</p>
            ) : Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-slate-300">{cat}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmtAmt(amt)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full">
                    <div className="h-1.5 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, totalCollected ? (amt / totalCollected) * 100 : 0)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hostel-wise Occupancy */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Hostel Occupancy</h3>
            <button onClick={() => downloadCSV(Object.entries(byHostel).map(([h, v]) => ({ Hostel: h, Total: v.total, Active: v.active })), 'hostel-occupancy')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Download size={12} /> CSV
            </button>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />)
            ) : Object.keys(byHostel).length === 0 ? (
              <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">No hostel data</p>
            ) : Object.entries(byHostel).sort((a, b) => b[1].total - a[1].total).map(([hostel, data]) => (
              <div key={hostel} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{hostel}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">{data.active}/{data.total} active</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full">
                  <div className="h-1.5 rounded-full bg-blue-500"
                    style={{ width: `${data.total ? (data.active / data.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day Book */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Day Book Report</h3>
            <button onClick={() => downloadCSV(
              Object.entries(byDate).map(([date, amt]) => ({ Date: date, 'Amount Collected': amt })),
              'hostel-daybook'
            )}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Download size={12} /> CSV
            </button>
          </div>
          <div className="overflow-y-auto max-h-72">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-24" /></td><td className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-16 ml-auto" /></td></tr>
                )) : Object.keys(byDate).length === 0 ? (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-400">No data</td></tr>
                ) : Object.entries(byDate).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, amt]) => (
                  <tr key={date} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{date}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmtAmt(amt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">All Transactions ({transactions.length})</h3>
          <button onClick={() => downloadCSV(transactions.map(t => ({
            'Payment ID': t.payment_id, 'USN': t.usn, 'Student': t.student_name,
            'Amount': t.pay_amount, 'Category': t.fee_category, 'Method': t.method,
            'Date': fmtDate(t.captured_date || t.created_at), 'Status': t.pay_status,
          })), 'hostel-transactions')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={12} /> Export CSV
          </button>
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
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
              )) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <FileText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-400">No transactions found for selected period</p>
                </td></tr>
              ) : transactions.slice(0, 50).map(t => (
                <tr key={t._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{t.usn || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.student_name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{fmtAmt(t.pay_amount)}</td>
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
