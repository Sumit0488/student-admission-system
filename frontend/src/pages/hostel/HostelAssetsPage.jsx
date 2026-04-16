import { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { getHostelAssets, createHostelAsset, updateHostelAsset, deleteHostelAsset, returnHostelAsset } from '../../services/hostelApi';

const CATEGORIES = ['Furniture', 'Electronics', 'Linen', 'Kitchen', 'Sports', 'Other'];
const CONDITIONS = ['Good', 'Fair', 'Poor'];
const STATUS_TABS = ['All', 'Issued', 'Returned', 'Overdue', 'Lost'];

const STATUS_STYLE = {
  Issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Returned: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Lost: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
};

const EMPTY_FORM = {
  student_name: '', usn: '', room_number: '', hostel_name: '',
  item_name: '', item_category: 'Furniture', quantity: 1,
  issue_date: new Date().toISOString().split('T')[0],
  expected_return_date: '', condition_at_issue: 'Good',
  status: 'Issued', remarks: '',
};

function AssetModal({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        ...EMPTY_FORM, ...initial,
        issue_date: initial.issue_date ? initial.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
        expected_return_date: initial.expected_return_date ? initial.expected_return_date.split('T')[0] : '',
      } : EMPTY_FORM);
      setErr('');
    }
  }, [open, initial]);

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.item_name.trim() || !form.student_name.trim()) return setErr('Item name and student name are required');
    setSaving(true); setErr('');
    try {
      if (initial?._id) await updateHostelAsset(initial._id, form);
      else await createHostelAsset(form);
      onSaved();
    } catch (e) { setErr(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-slate-100";
  const lbl = "block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{initial ? 'Edit Asset Issue' : 'Issue Asset'}</h2>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {err && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{err}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lbl}>Item Name *</label>
              <input className={inp} value={form.item_name} onChange={e => set('item_name', e.target.value)} placeholder="e.g. Study Table" required />
            </div>
            <div>
              <label className={lbl}>Category</label>
              <select className={inp} value={form.item_category} onChange={e => set('item_category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Quantity</label>
              <input className={inp} type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Student Name *</label>
              <input className={inp} value={form.student_name} onChange={e => set('student_name', e.target.value)} placeholder="Student full name" required />
            </div>
            <div>
              <label className={lbl}>USN</label>
              <input className={inp} value={form.usn} onChange={e => set('usn', e.target.value)} placeholder="Roll number" />
            </div>
            <div>
              <label className={lbl}>Room Number</label>
              <input className={inp} value={form.room_number} onChange={e => set('room_number', e.target.value)} placeholder="e.g. 101" />
            </div>
            <div>
              <label className={lbl}>Hostel Name</label>
              <input className={inp} value={form.hostel_name} onChange={e => set('hostel_name', e.target.value)} placeholder="Hostel name" />
            </div>
            <div>
              <label className={lbl}>Condition at Issue</label>
              <select className={inp} value={form.condition_at_issue} onChange={e => set('condition_at_issue', e.target.value)}>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Issue Date</label>
              <input className={inp} type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Expected Return</label>
              <input className={inp} type="date" value={form.expected_return_date} onChange={e => set('expected_return_date', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                {['Issued', 'Returned', 'Overdue', 'Lost'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={lbl}>Remarks</label>
              <textarea className={inp} rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional remarks…" />
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReturnModal({ open, asset, onClose, onSaved }) {
  const [condition, setCondition] = useState('Good');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setCondition('Good'); setRemarks(''); } }, [open]);
  if (!open || !asset) return null;

  const handleReturn = async () => {
    setSaving(true);
    try {
      await returnHostelAsset(asset._id, { condition, remarks });
      onSaved();
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Mark as Returned</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{asset.item_name} — {asset.student_name}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Condition on Return</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none">
              {['Good', 'Fair', 'Damaged', 'Lost'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Remarks</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none" placeholder="Optional…" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300">Cancel</button>
          <button onClick={handleReturn} disabled={saving}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-60">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RotateCcw size={13} />}
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HostelAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [returnAsset, setReturnAsset] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);
  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.q = search;
      if (statusTab !== 'All') params.status = statusTab;
      const res = await getHostelAssets(params);
      setAssets(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search, statusTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = v => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const issued = assets.filter(a => a.status === 'Issued').length;
  const overdue = assets.filter(a => a.status === 'Overdue').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package size={22} className="text-blue-600" /> Hostel Assets
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Track items issued to hostel residents</p>
        </div>
        <button onClick={() => { setEditTarget(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> Issue Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: total, color: 'bg-blue-600' },
          { label: 'Currently Issued', value: issued, color: 'bg-orange-500' },
          { label: 'Overdue', value: overdue, color: 'bg-red-500' },
          { label: 'Returned', value: assets.filter(a => a.status === 'Returned').length, color: 'bg-green-600' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${c.color} flex items-center justify-center`}>
              <Package size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{c.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{loading ? '—' : c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue warning */}
      {!loading && overdue > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} /> {overdue} asset(s) are overdue and not yet returned.
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search item, student, USN…" onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-slate-100" />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => { setStatusTab(t); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${statusTab === t ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Issue ID', 'Item', 'Category', 'Student / Room', 'Issue Date', 'Expected Return', 'Condition', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-16" /></td>)}</tr>
              )) : assets.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-16 text-center">
                  <Package size={36} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-400">No asset records found</p>
                  <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="mt-2 text-xs text-blue-600 hover:underline">Issue first asset</button>
                </td></tr>
              ) : assets.map(a => {
                const isOverdue = a.status === 'Issued' && a.expected_return_date && new Date(a.expected_return_date) < new Date();
                return (
                  <tr key={a._id} className={`hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors ${isOverdue ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{a.issue_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{a.item_name}</div>
                      <div className="text-xs text-gray-400">Qty: {a.quantity}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300">{a.item_category}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-slate-200 text-sm">{a.student_name}</div>
                      <div className="text-xs text-gray-400">{a.usn && `${a.usn} · `}Room {a.room_number || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300">
                      {a.issue_date ? new Date(a.issue_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600 dark:text-slate-300'}`}>
                      {a.expected_return_date ? new Date(a.expected_return_date).toLocaleDateString('en-IN') : '—'}
                      {isOverdue && ' ⚠'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{a.condition_at_issue || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {a.status === 'Issued' && (
                          <button onClick={() => setReturnAsset(a)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors" title="Mark Returned">
                            <RotateCcw size={13} />
                          </button>
                        )}
                        <button onClick={() => { setEditTarget(a); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteId(a._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / LIMIT) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-500 dark:text-slate-400">Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}</span>
            <div className="flex gap-1">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">Prev</button>
              <button disabled={page===Math.ceil(total/LIMIT)} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">Next</button>
            </div>
          </div>
        )}
      </div>

      <AssetModal open={modalOpen} initial={editTarget} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchData(); }} />
      <ReturnModal open={!!returnAsset} asset={returnAsset} onClose={() => setReturnAsset(null)} onSaved={() => { setReturnAsset(null); fetchData(); }} />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Delete Asset Record?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300">Cancel</button>
              <button onClick={async () => { await deleteHostelAsset(deleteId); setDeleteId(null); fetchData(); }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
