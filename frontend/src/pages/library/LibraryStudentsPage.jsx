import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, X, Mail, MessageCircle, Download, BookOpen, Banknote, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { getLibraryMembers, createLibraryMember, updateLibraryMember, deleteLibraryMember, collectLibraryFee } from '../../services/libraryApi';
import { useFeeCategories } from '../../hooks/useFeeCategories';
import { useAcademicConfig } from '../../hooks/useAcademicConfig';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';

const STATUS_STYLE = {
  Active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Suspended: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  Expired: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  Inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

const EMPTY_FORM = {
  name: '', usn: '', mobile_number: '', email: '', program: '', batch: '',
  department: '', membership_type: 'Student', membership_start: '', membership_end: '',
  barcode: '', status: 'Active', notes: '',
};

const COLLECT_FORM = { amount: '', method: 'Cash', reference: '', date: '', description: '', fee_category: '' };
const METHODS = ['Cash', 'DD', 'Cheque', 'RTGS / NEFT', 'Book Adjustment'];
const DEFAULT_CATEGORIES = ['Library Fine', 'Membership Fee', 'Damage Fine', 'Late Return Fine', 'Lost Book Fine', 'Other'];
const MEMBER_TYPES = ['Student', 'Faculty', 'Staff', 'Guest'];
const LIMIT = 20;

function AddEditModal({ member, onClose, onSave }) {
  const [form, setForm] = useState(member ? { ...member } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const { programs, batches } = useAcademicConfig();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">{member ? 'Edit Member' : 'Add Library Member'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'name', l: 'Full Name', req: true, span: 2 },
              { k: 'usn', l: 'USN / ID' },
              { k: 'mobile_number', l: 'Mobile' },
              { k: 'email', l: 'Email', type: 'email', span: 2 },
              { k: 'department', l: 'Department' },
              { k: 'barcode', l: 'Barcode / Card No' },
              { k: 'membership_start', l: 'Membership Start', type: 'date' },
              { k: 'membership_end', l: 'Membership End', type: 'date' },
            ].map(({ k, l, req, type, span }) => (
              <div key={k} className={span === 2 ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">{l}{req ? ' *' : ''}</label>
                <input required={!!req} type={type || 'text'} value={form[k] || ''} onChange={e => set(k, e.target.value)}
                  className={inp} />
              </div>
            ))}
            {/* Program dropdown from Settings */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Program</label>
              <select value={form.program || ''} onChange={e => set('program', e.target.value)} className={inp}>
                <option value="">Select Program</option>
                {programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {/* Batch dropdown from Settings */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Batch</label>
              <select value={form.batch || ''} onChange={e => set('batch', e.target.value)} className={inp}>
                <option value="">Select Batch</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Membership Type</label>
              <select value={form.membership_type} onChange={e => set('membership_type', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                {MEMBER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                {['Active', 'Suspended', 'Expired', 'Inactive'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200 resize-none" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : member ? 'Update' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CollectModal({ member, onClose, onDone }) {
  const { categories: configCategories, loading: catLoading } = useFeeCategories('Library', DEFAULT_CATEGORIES);
  const [form, setForm] = useState({ ...COLLECT_FORM });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Set default category once categories load
  useEffect(() => {
    if (!form.fee_category && configCategories.length > 0) {
      setForm(f => ({ ...f, fee_category: configCategories[0] }));
    }
  }, [configCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await collectLibraryFee(member._id, form);
      setSuccess(data.data);
      onDone();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to collect');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Collect Library Fee</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{member.name} · {member.usn || member.member_id}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <BookOpen size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">Payment Recorded!</p>
            <p className="text-sm text-gray-500">₹{success.transaction?.pay_amount?.toLocaleString('en-IN')} collected successfully</p>
            <p className="text-xs text-gray-400">Payment ID: {success.transaction?.payment_id}</p>
            <button onClick={onClose} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Category</label>
                <select value={form.fee_category} onChange={e => set('fee_category', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                  {catLoading ? <option>Loading…</option> : configCategories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Amount (₹) *</label>
                <input required type="number" min="1" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Payment Method</label>
                <select value={form.method} onChange={e => set('method', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
              </div>
              {form.method !== 'Cash' && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Reference / DD No</label>
                  <input type="text" value={form.reference} onChange={e => set('reference', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="e.g. Late return fine for book XYZ"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Processing...' : 'Collect Fee'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LibraryStudentsPage() {
  const [urlParams, setUrlParams] = useUrlFilters({ tab: 'Active', q: '', page: '1' });
  const tab = urlParams.tab;
  const search = urlParams.q;
  const page = Number(urlParams.page) || 1;
  const debouncedSearch = useDebounce(search, 350);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [collectMember, setCollectMember] = useState(null);
  const { toasts, toast } = useToast();

  const allChecked = members.length > 0 && members.every(m => selected.includes(m._id));
  const someChecked = members.some(m => selected.includes(m._id)) && !allChecked;
  const toggleAll = () => setSelected(allChecked ? [] : members.map(m => m._id));
  const toggleOne = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: tab, page, limit: LIMIT };
      if (debouncedSearch) params.q = debouncedSearch;
      const { data } = await getLibraryMembers(params);
      setMembers(data.data || []);
      setTotal(data.total || 0);
    } catch { toast('Failed to load members', 'error'); }
    finally { setLoading(false); }
  }, [tab, page, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (payload) => {
    try {
      if (editMember) {
        const { data } = await updateLibraryMember(editMember._id, payload);
        setMembers(p => p.map(m => m._id === editMember._id ? data.data : m));
        toast('Member updated');
      } else {
        const { data } = await createLibraryMember(payload);
        setMembers(p => [data.data, ...p]);
        toast('Member added');
      }
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed', 'error');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    try {
      await deleteLibraryMember(id);
      setMembers(p => p.filter(m => m._id !== id));
      toast('Member deleted');
    } catch { toast('Failed to delete', 'error'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <Toasts toasts={toasts} />
      {(showAdd || editMember) && (
        <AddEditModal member={editMember} onClose={() => { setShowAdd(false); setEditMember(null); }} onSave={handleSave} />
      )}
      {collectMember && (
        <CollectModal member={collectMember} onClose={() => setCollectMember(null)} onDone={() => { fetchData(); setCollectMember(null); }} />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen size={22} className="text-emerald-600" /> Library Members
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage library members and fee collection</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus size={16} /> Add Member
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: total, color: 'text-blue-600' },
            { label: 'Active', value: members.filter(m => m.status === 'Active').length, color: 'text-green-600' },
            { label: 'Suspended', value: members.filter(m => m.status === 'Suspended').length, color: 'text-red-600' },
            { label: 'Fine Due', value: '₹' + members.reduce((s, m) => s + (m.fine_due || 0), 0).toLocaleString('en-IN'), color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Status tabs */}
          <div className="flex items-center px-5 border-b border-gray-100 dark:border-slate-700 gap-0">
            {['Active', 'Suspended', 'Expired', 'Inactive'].map(t => (
              <button key={t} onClick={() => setUrlParams({ tab: t })}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${tab === t ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Search + bulk actions */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex-wrap">
            <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setUrlParams({ q: e.target.value })}
                placeholder="Search by name, USN, member ID..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-700 dark:text-slate-200 placeholder-gray-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
              <span className="font-semibold text-gray-700 dark:text-slate-300">{total}</span> members
            </span>
            {selected.length > 0 && (
              <span className="ml-2 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">
                {selected.length} selected
              </span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button title="Send Email" className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Mail size={15} /></button>
              <button title="WhatsApp" className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"><MessageCircle size={15} /></button>
              <button title="Export" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><Download size={15} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50">
                  <th className="w-10 px-4 py-3.5">
                    <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                  </th>
                  {['Member ID', 'Name', 'USN', 'Program/Batch', 'Mobile', 'Type', 'Books Issued', 'Fine Due', 'Member Since', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td className="px-4 py-3"><div className="h-3 w-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                      {Array.from({ length: 11 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr><td colSpan={12} className="px-6 py-20 text-center">
                    <BookOpen size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No library members found</p>
                    <button onClick={() => setShowAdd(true)} className="mt-2 text-sm text-emerald-600 hover:underline">Add first member →</button>
                  </td></tr>
                ) : members.map(m => (
                  <tr key={m._id} className={`hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors ${selected.includes(m._id) ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(m._id)} onChange={() => toggleOne(m._id)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-600 dark:text-emerald-400">{m.member_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{m.name}</div>
                      {m.email && <div className="text-xs text-gray-400 dark:text-slate-500">{m.email}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{m.usn || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                      <div>{m.program || '—'}</div>
                      {m.batch && <div className="text-xs text-gray-400">{m.batch}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{m.mobile_number || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{m.membership_type}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-slate-300 font-medium">{m.books_issued || 0}</td>
                    <td className="px-4 py-3 font-medium text-orange-600 dark:text-orange-400">
                      {m.fine_due > 0 ? `₹${m.fine_due.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{fmtDate(m.membership_start)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[m.status] || STATUS_STYLE.Active}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCollectMember(m)} title="Collect Fee"
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          <Banknote size={14} />
                        </button>
                        <button onClick={() => setEditMember(m)} title="Edit"
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(m._id)} title="Delete"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && total > LIMIT && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-slate-500">Page <span className="font-semibold text-gray-600">{page}</span> · {total} total</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setUrlParams({ page: String(Math.max(1, page - 1)) }, { resetPage: false })} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">Prev</button>
                <button onClick={() => setUrlParams({ page: String(page + 1) }, { resetPage: false })} disabled={page * LIMIT >= total}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
