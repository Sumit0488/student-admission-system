import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreVertical, AlertCircle, CheckCircle, X } from 'lucide-react';
import {
  getFeeHeads, createFeeHead,
  getFeeCategories, createFeeCategory,
  getFeeStructures, createFeeStructure,
  getFeeSchedules,
  getAccounts, createAccount, updateAccount, deleteAccount,
} from '../../services/feeApi';
import NewScheduleWizard from '../../components/NewScheduleWizard';

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

const SUB_NAV = ['Accounts', 'Fee Category', 'Fee Head', 'Fee Structure', 'Fee Schedule'];

// ── Fee Head Panel ──────────────────────────────────────────────────────────
function FeeHeadPanel({ toast }) {
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fee_head: '', fee_description: '', fee_category: '', fee_nature: '', fee_head_status: true, module_name: 'Fee' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    getFeeHeads().then(({ data }) => setHeads(data.data || [])).catch(() => toast('Failed to load fee heads', 'error')).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await createFeeHead(form);
      setHeads((p) => [data.data, ...p]);
      toast('Fee head created');
      setShowModal(false);
      setForm({ fee_head: '', fee_description: '', fee_category: '', fee_nature: '', fee_head_status: true, module_name: 'Fee' });
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create fee head', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Fee Head</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Head Name *</label>
                <input required value={form.fee_head} onChange={(e) => set('fee_head', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description</label>
                <input value={form.fee_description} onChange={(e) => set('fee_description', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Category</label>
                <input value={form.fee_category} onChange={(e) => set('fee_category', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Nature</label>
                <input value={form.fee_nature} onChange={(e) => set('fee_nature', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Module</label>
                <select value={form.module_name} onChange={(e) => set('module_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {['Fee', 'Billing', 'Library', 'Hostel', 'Exam', 'Alumni'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="fh-status" checked={form.fee_head_status} onChange={(e) => set('fee_head_status', e.target.checked)} className="rounded" />
                <label htmlFor="fh-status" className="text-sm text-gray-700 dark:text-slate-300">Active</label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Head</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Fee Head
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Fee Head', 'Description', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{[1,2,3,4].map((j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-24" /></td>)}</tr>
                ))
              ) : heads.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No fee heads yet. Click "+ Fee Head" to add one.</td></tr>
              ) : (
                heads.map((h) => (
                  <tr key={h._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{h.fee_head}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{h.fee_description || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${h.fee_head_status ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {h.fee_head_status ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                        <MoreVertical size={14} />
                      </button>
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

const EMPTY_CAT = { fee_category: '', account_type: '', module_name: [], fee_type: 'GENERAL', invoice_prefix: '', receipt_prefix: '', status: 'active' };
const MODULE_OPTIONS = ['FEE', 'Billing', 'Library', 'Hostel', 'Exam', 'Alumni'];
const MODULE_COLORS = {
  FEE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Billing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Library: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Hostel: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Exam: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Alumni: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

// ── Fee Category Panel ───────────────────────────────────────────────────────
function FeeCategoryPanel({ toast }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_CAT);
  const [feeTypes, setFeeTypes] = useState(['GENERAL', 'EXAM', 'REVAL']);
  const [saving, setSaving] = useState(false);
  const [accountFilter, setAccountFilter] = useState(''); // filter state
  const [accounts, setAccounts] = useState([]); // account dropdown data
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleModule = (m) => setForm((p) => ({
    ...p,
    module_name: p.module_name.includes(m) ? p.module_name.filter((x) => x !== m) : [...p.module_name, m],
  }));

  const loadCategories = useCallback((accountType = '') => {
    setLoading(true);
    const params = accountType ? { account_type: accountType } : {};
    getFeeCategories(params).then(({ data }) => setCats(data.data || [])).catch(() => toast('Failed to load categories', 'error')).finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    loadCategories(accountFilter);
    // Fetch accounts for dropdown
    getAccounts().then(({ data }) => setAccounts(data.data || [])).catch(() => {});
    // Fetch distinct fee_type values from existing categories to populate dropdown
    getFeeCategories().then(({ data }) => {
      const types = [...new Set((data.data || []).map((c) => c.fee_type).filter(Boolean))];
      if (types.length) setFeeTypes([...new Set(['GENERAL', 'EXAM', 'REVAL', ...types])]);
    }).catch(() => {});
  }, [accountFilter, loadCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await createFeeCategory(form);
      setCats((p) => [data.data, ...p]);
      toast('Fee category created');
      setShowModal(false);
      setForm(EMPTY_CAT);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';
  const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1';

  return (
    <div className="space-y-4">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Fee Category</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Fee Category Name */}
              <div>
                <label className={labelCls}>Fee Category Name *</label>
                <input required value={form.fee_category} onChange={(e) => set('fee_category', e.target.value)} className={inputCls} placeholder="e.g. Tuition Fee" />
              </div>

              {/* Fee Category Account */}
              <div>
                <label className={labelCls}>Fee Category Account</label>
                <select value={form.account_type} onChange={(e) => set('account_type', e.target.value)} className={inputCls}>
                  <option value="">— Select account —</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a.account_name}>{a.account_name}</option>
                  ))}
                </select>
              </div>

              {/* Module Name — checkboxes */}
              <div>
                <label className={labelCls}>Module Name</label>
                <div className="flex gap-5 mt-1">
                  {MODULE_OPTIONS.map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={form.module_name.includes(m)} onChange={() => toggleModule(m)} className="rounded" />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              {/* Fee Type — from backend */}
              <div>
                <label className={labelCls}>Fee Type</label>
                <select value={form.fee_type} onChange={(e) => set('fee_type', e.target.value)} className={inputCls}>
                  {feeTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Invoice Prefix & Receipt Prefix */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Invoice Prefix</label>
                  <input value={form.invoice_prefix} onChange={(e) => set('invoice_prefix', e.target.value)} className={inputCls} placeholder="e.g. INV-" />
                </div>
                <div>
                  <label className={labelCls}>Receipt Prefix</label>
                  <input value={form.receipt_prefix} onChange={(e) => set('receipt_prefix', e.target.value)} className={inputCls} placeholder="e.g. RCP-" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_CAT); }} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Add Fee Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Category</h2>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a._id} value={a.account_type}>{a.account_name}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Fee Category
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-slate-900/50">
              {['Fee Category', 'Account', 'Modules', 'Fee Type', 'Invoice Prefix', 'Receipt Prefix', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}>{[1,2,3,4,5,6,7,8].map((j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-16" /></td>)}</tr>)
                : cats.length === 0 ? <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No categories yet.</td></tr>
                : cats.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.fee_category}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{c.account_type || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.module_name || []).length === 0 ? <span className="text-xs text-gray-400">—</span> :
                          (c.module_name || []).map(m => (
                            <span key={m} className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${MODULE_COLORS[m] || 'bg-gray-100 text-gray-600'}`}>{m}</span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.fee_type}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 font-mono text-xs">{c.invoice_prefix || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 font-mono text-xs">{c.receipt_prefix || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>{c.status?.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3"><button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"><MoreVertical size={14} /></button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Fee Structure Panel ──────────────────────────────────────────────────────
function FeeStructurePanel({ toast }) {
  const [structs, setStructs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fee_struct_name: '', stream: '', program: '', batch: '', quota: '', fee_category: '', fee_total_amount: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    getFeeStructures().then(({ data }) => setStructs(data.data || [])).catch(() => toast('Failed to load structures', 'error')).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await createFeeStructure({ ...form, fee_total_amount: parseFloat(form.fee_total_amount) || 0 });
      setStructs((p) => [data.data, ...p]);
      toast('Fee structure created');
      setShowModal(false);
      setForm({ fee_struct_name: '', stream: '', program: '', batch: '', quota: '', fee_category: '', fee_total_amount: '' });
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Fee Structure</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-5 py-4 space-y-3">
              {[
                { key: 'fee_struct_name', label: 'Structure Name', req: true },
                { key: 'stream', label: 'Stream', req: true },
                { key: 'program', label: 'Program', req: true },
                { key: 'batch', label: 'Batch', req: true },
                { key: 'quota', label: 'Quota', req: true },
                { key: 'fee_category', label: 'Fee Category', req: true },
                { key: 'fee_total_amount', label: 'Total Amount (₹)', req: true, type: 'number' },
              ].map(({ key, label, req, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">{label}{req ? ' *' : ''}</label>
                  <input required={req} type={type || 'text'} value={form[key]} onChange={(e) => set(key, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Structure</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Fee Structure
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-slate-900/50">
              {['Structure Name', 'Stream', 'Program', 'Batch', 'Total Amount', 'Actions'].map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}>{[1,2,3,4,5,6].map((j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>)
                : structs.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No fee structures yet.</td></tr>
                : structs.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.fee_struct_name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.stream}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.program}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.batch}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">₹ {Number(s.fee_total_amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"><MoreVertical size={14} /></button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Accounts Panel ──────────────────────────────────────────────────────────
const EMPTY_ACC = { account_name: '', account_type: 'Purchase' };

function AccountsPanel({ toast }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // account object being edited
  const [deleteTarget, setDeleteTarget] = useState(null); // account object to delete
  const [form, setForm] = useState(EMPTY_ACC);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // _id of row with open menu
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    getAccounts().then(({ data }) => setAccounts(data.data || [])).catch(() => toast('Failed to load accounts', 'error')).finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // close menu on outside click
  useEffect(() => {
    const handler = () => setOpenMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const openEdit = (acc) => { setEditTarget(acc); setForm({ account_name: acc.account_name, account_type: acc.account_type }); setOpenMenu(null); };
  const openDelete = (acc) => { setDeleteTarget(acc); setOpenMenu(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await updateAccount(editTarget._id, form);
        setAccounts((p) => p.map((a) => a._id === editTarget._id ? data.data : a));
        toast('Account updated');
        setEditTarget(null);
      } else {
        const { data } = await createAccount(form);
        setAccounts((p) => [data.data, ...p]);
        toast('Account created');
        setShowAdd(false);
      }
      setForm(EMPTY_ACC);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount(deleteTarget._id);
      setAccounts((p) => p.filter((a) => a._id !== deleteTarget._id));
      toast('Account deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';
  const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1';

  const AccountModal = ({ title, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
          <div>
            <label className={labelCls}>Account Name *</label>
            <input required value={form.account_name} onChange={(e) => set('account_name', e.target.value)} className={inputCls} placeholder="e.g. Main Cash Account" />
          </div>
          <div>
            <label className={labelCls}>Select Type</label>
            <select value={form.account_type} onChange={(e) => set('account_type', e.target.value)} className={inputCls}>
              <option value="Purchase">Purchase</option>
              <option value="Sell">Sell</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add modal */}
      {showAdd && <AccountModal title="Add Account" onClose={() => { setShowAdd(false); setForm(EMPTY_ACC); }} />}
      {/* Edit modal */}
      {editTarget && <AccountModal title="Edit Account" onClose={() => { setEditTarget(null); setForm(EMPTY_ACC); }} />}
      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Delete Account</h3>
            <p className="text-sm text-gray-600 dark:text-slate-300">Are you sure you want to delete <span className="font-semibold">{deleteTarget.account_name}</span>? This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Accounts</h2>
        <button onClick={() => { setForm(EMPTY_ACC); setShowAdd(true); }} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add Account
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-slate-900/50">
              {['Name', 'ID', 'Type', 'Actions'].map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}>{[1,2,3,4].map((j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-24" /></td>)}</tr>)
                : accounts.length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No accounts yet. Click "+ Add Account" to create one.</td></tr>
                : accounts.map((acc) => (
                  <tr key={acc._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{acc.account_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{acc.account_id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        acc.account_type === 'Purchase' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>{acc.account_type}</span>
                    </td>
                    <td className="px-4 py-3 relative">
                      <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === acc._id ? null : acc._id); }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                        <MoreVertical size={14} />
                      </button>
                      {openMenu === acc._id && (
                        <div className="absolute right-4 top-8 z-20 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl py-1 w-32" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEdit(acc)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Edit</button>
                          <button onClick={() => openDelete(acc)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FeeScheduleConfigPanel({ toast }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const loadSchedules = useCallback(() => {
    setLoading(true);
    getFeeSchedules().then(({ data }) => setSchedules(data.data || [])).catch(() => toast('Failed to load schedules', 'error')).finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  return (
    <div className="space-y-4">
      {showWizard && (
        <NewScheduleWizard
          onClose={() => setShowWizard(false)}
          onCreated={(s) => { setSchedules((p) => [s, ...p]); setShowWizard(false); toast('Fee schedule created'); }}
          toast={toast}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Schedule</h2>
        <button onClick={() => setShowWizard(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> New Schedule
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-slate-900/50">
              {['Fee ID', 'Category', 'Academic Year', 'Semester', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}>{[1,2,3,4,5,6].map((j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>)
                : schedules.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No schedules yet. Click "+ New Schedule" to create one.</td></tr>
                : schedules.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{s.fee_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.fee_category}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.academic_year}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.semester || '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.fee_sched_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{s.fee_sched_status?.toUpperCase()}</span></td>
                    <td className="px-4 py-3"><button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"><MoreVertical size={14} /></button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function FeeConfigPage() {
  const [activePanel, setActivePanel] = useState('Fee Head');
  const { toasts, toast } = useToast();

  const renderPanel = () => {
    switch (activePanel) {
      case 'Fee Head': return <FeeHeadPanel toast={toast} />;
      case 'Fee Category': return <FeeCategoryPanel toast={toast} />;
      case 'Fee Structure': return <FeeStructurePanel toast={toast} />;
      case 'Fee Schedule': return <FeeScheduleConfigPanel toast={toast} />;
      default: return <AccountsPanel toast={toast} />;
    }
  };

  return (
    <>
      <Toasts toasts={toasts} />
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fee Configuration</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Configure fee categories, heads, structures, and schedules</p>
        </div>

        <div className="flex gap-6">
          {/* Left sub-nav */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">Configure Fee</p>
              </div>
              <ul className="p-2 space-y-0.5">
                {SUB_NAV.map((item) => (
                  <li key={item}>
                    <button onClick={() => setActivePanel(item)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        ${activePanel === item ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {renderPanel()}
          </div>
        </div>
      </div>
    </>
  );
}
