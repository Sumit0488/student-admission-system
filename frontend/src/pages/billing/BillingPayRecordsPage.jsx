import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Eye, Pencil, Printer, Trash2, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { getBillingPayRecords, createBillingPayRecord, deleteBillingPayRecord } from '../../services/billingApi';
import QuickViewDrawer from '../../components/common/QuickViewDrawer';

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
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

const STATUS_STYLE = {
  generated: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  captured: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

const METHODS = ['Cash', 'Cheque', 'DD', 'NEFT', 'RTGS', 'Online'];
const FIN_YEARS = ['2024-2025', '2025-2026', '2026-2027'];
const STATUSES = ['All', 'generated', 'captured', 'completed'];
const EMPTY_FORM = { name: '', bank_name: '', ref_no: '', transaction_date: '', transaction_amount: '', description: '', method: 'Cash' };

function AddModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, transaction_amount: parseFloat(form.transaction_amount) || 0 });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add Pay Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {[
            { k: 'name', l: 'Received From', req: true },
            { k: 'bank_name', l: 'Bank Name' },
            { k: 'ref_no', l: 'Reference No' },
          ].map(({ k, l, req }) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">{l}{req ? ' *' : ''}</label>
              <input required={req} value={form[k]} onChange={(e) => set(k, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Transaction Date</label>
              <input type="date" value={form.transaction_date} onChange={(e) => set('transaction_date', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Amount (₹) *</label>
              <input required type="number" min="0" value={form.transaction_amount} onChange={(e) => set('transaction_amount', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Method</label>
            <select value={form.method} onChange={(e) => set('method', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save Record'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLS = ['REC ID', 'Reference No', 'Received From', 'Transaction Date', 'Amount (₹)', 'Status', 'Actions'];

export default function BillingPayRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [finYear, setFinYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { toasts, toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (finYear) params.financial_year = finYear;
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await getBillingPayRecords(params);
      setRecords(data.data || []);
    } catch {
      toast('Failed to load pay records', 'error');
    } finally {
      setLoading(false);
    }
  }, [finYear, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (payload) => {
    try {
      const { data } = await createBillingPayRecord(payload);
      setRecords((p) => [data.data, ...p]);
      toast('Pay record created');
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed', 'error');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pay record?')) return;
    try {
      await deleteBillingPayRecord(id);
      setRecords((p) => p.filter((r) => r._id !== id));
      toast('Pay record deleted');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  };
  const fmtAmt = (n) => (n != null ? `₹ ${Number(n).toLocaleString('en-IN')}` : '—');

  return (
    <>
      <Toasts toasts={toasts} />
      {quickView && <QuickViewDrawer entityType="pay-records" entityId={quickView} onClose={() => setQuickView(null)} title="Pay Record" />}
      {showModal && <AddModal onClose={() => setShowModal(false)} onSave={handleCreate} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pay Records</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Billing offline payment records</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Download size={15} /> Export
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select value={finYear} onChange={(e) => setFinYear(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">All Years</option>
            {FIN_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50">
                  {COLS.map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <tr key={i}>{COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>)
                ) : records.length === 0 ? (
                  <tr><td colSpan={COLS.length} className="px-6 py-16 text-center">
                    <FileText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">No pay records found</p>
                  </td></tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{r.record_id}</td>
                      <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-mono text-xs">{r.ref_no || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{fmtDate(r.transaction_date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmtAmt(r.transaction_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[r.status] || STATUS_STYLE.captured}`}>
                          {r.status || 'captured'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setQuickView(r._id)} title="Quick View" className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Eye size={13} /></button>
                          <button onClick={() => {}} title="Edit" className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => window.print()} title="Print" className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"><Printer size={13} /></button>
                          <button onClick={() => handleDelete(r._id)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
