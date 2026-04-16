import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreVertical, Settings, AlertCircle, CheckCircle, X } from 'lucide-react';
import {
  getFeeHeads, createFeeHead,
  getFeeCategories, createFeeCategory,
  getFeeStructures, createFeeStructure,
  getFeeSchedules, createFeeSchedule,
} from '../../services/feeApi';

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
  const [form, setForm] = useState({ fee_head: '', fee_description: '', fee_category: '', fee_nature: '', fee_head_status: true });
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
      setForm({ fee_head: '', fee_description: '', fee_category: '', fee_nature: '', fee_head_status: true });
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

// ── Fee Category Panel ───────────────────────────────────────────────────────
function FeeCategoryPanel({ toast }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fee_category: '', stream_id: '', status: 'active', fee_type: 'GENERAL' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    getFeeCategories().then(({ data }) => setCats(data.data || [])).catch(() => toast('Failed to load categories', 'error')).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await createFeeCategory(form);
      setCats((p) => [data.data, ...p]);
      toast('Fee category created');
      setShowModal(false);
      setForm({ fee_category: '', stream_id: '', status: 'active', fee_type: 'GENERAL' });
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
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Fee Category</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Category Name *</label>
                <input required value={form.fee_category} onChange={(e) => set('fee_category', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Stream ID</label>
                <input value={form.stream_id} onChange={(e) => set('stream_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Type</label>
                <select value={form.fee_type} onChange={(e) => set('fee_type', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {['GENERAL', 'EXAM', 'REVAL'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Category</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Fee Category
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-slate-900/50">
              {['Fee Category', 'Stream', 'Fee Type', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}>{[1,2,3,4,5].map((j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>)
                : cats.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No categories yet.</td></tr>
                : cats.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.fee_category}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.stream_id || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.fee_type}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{c.status?.toUpperCase()}</span></td>
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

function AccountsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Accounts</h2>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 text-center">
        <Settings size={36} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
        <p className="text-sm text-gray-500 dark:text-slate-400">Accounts configuration coming soon</p>
      </div>
    </div>
  );
}

function FeeScheduleConfigPanel({ toast }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeeSchedules().then(({ data }) => setSchedules(data.data || [])).catch(() => toast('Failed to load schedules', 'error')).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Schedule</h2>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-slate-900/50">
              {['Fee ID', 'Name', 'Academic Year', 'Status', 'Type', 'Actions'].map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}>{[1,2,3,4,5,6].map((j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>)
                : schedules.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No schedules yet.</td></tr>
                : schedules.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{s.fee_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.fee_sched_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.academic_year}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{s.fee_sched_status?.toUpperCase()}</span></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.fee_type}</td>
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
      default: return <AccountsPanel />;
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
