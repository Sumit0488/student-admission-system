import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Eye, Pencil, Printer, Trash2, FileText, Mail, MessageCircle } from 'lucide-react';
import { getPayRecords, createPayRecord, deletePayRecord } from '../../services/feeApi';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Received From *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Bank Name</label>
            <input value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Reference No</label>
            <input value={form.ref_no} onChange={(e) => set('ref_no', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLS = ['REC ID', 'Reference No', 'Received From', 'Transaction Date', 'Amount (₹)', 'Status', 'Actions'];

export default function PayRecordsPage() {
  const [urlParams, setUrlParams] = useUrlFilters({ status: 'All', financial_year: '' });
  const statusFilter = urlParams.status;
  const finYear      = urlParams.financial_year;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { toasts, toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (finYear) params.financial_year = finYear;
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await getPayRecords(params);
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
      const { data } = await createPayRecord(payload);
      setRecords((p) => [data.data, ...p]);
      toast('Pay record created');
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create record', 'error');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pay record?')) return;
    try {
      await deletePayRecord(id);
      setRecords((p) => p.filter((r) => r._id !== id));
      toast('Record deleted');
    } catch {
      toast('Failed to delete record', 'error');
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  };

  const fmtAmount = (n) => {
    if (!n && n !== 0) return '—';
    return `₹ ${Number(n).toLocaleString('en-IN')}`;
  };

  return (
    <>
      <Toasts toasts={toasts} />
      {showModal && <AddModal onClose={() => setShowModal(false)} onSave={handleCreate} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pay Records</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Offline payment records and bank deposits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Download size={15} />
              Export
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Filter + Actions bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex-wrap">
            <select value={finYear} onChange={(e) => setUrlParams({ financial_year: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All Years</option>
              {FIN_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setUrlParams({ status: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
              {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
              <span className="font-semibold text-gray-700 dark:text-slate-300">{records.length.toLocaleString()}</span> records
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" title="Send Email" className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Mail size={15} /></button>
              <button type="button" title="Send WhatsApp" className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><MessageCircle size={15} /></button>
              <button type="button" title="Download" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><Download size={15} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50">
                  {COLS.map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{COLS.map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                    ))}</tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length} className="px-6 py-16 text-center">
                      <FileText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                      <p className="text-sm text-gray-400 dark:text-slate-500">No pay records found</p>
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{r.record_id}</td>
                      <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-mono text-xs">{r.ref_no || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{fmtDate(r.transaction_date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmtAmount(r.transaction_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[r.status] || STATUS_STYLE.captured}`}>
                          {r.status || 'captured'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Eye size={13} /></button>
                          <button className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><Pencil size={13} /></button>
                          <button className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"><Printer size={13} /></button>
                          <button onClick={() => handleDelete(r._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && records.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Showing <span className="font-semibold text-gray-600 dark:text-slate-300">{records.length}</span> record{records.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
