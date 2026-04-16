import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, Mail, MessageCircle, Download, Building2, Banknote, Edit2, Trash2 } from 'lucide-react';
import { getHostelStudents, createHostelStudent, updateHostelStudent, deleteHostelStudent, collectHostelFee } from '../../services/hostelApi';
import { useFeeCategories } from '../../hooks/useFeeCategories';
import { useAcademicConfig } from '../../hooks/useAcademicConfig';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';

const STATUS_STYLE = {
  Active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Vacated: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  Pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

const EMPTY_FORM = {
  name: '', usn: '', mobile_number: '', email: '', program: '', batch: '', gender: '',
  hostel_name: '', room_number: '', room_type: '', block: '', floor: '',
  admission_date: '', fee_due: '', guardian_name: '', guardian_mobile: '', notes: '', status: 'Active',
};

const COLLECT_FORM = { amount: '', method: 'Cash', reference: '', date: '', description: '', fee_category: '' };
const METHODS = ['Cash', 'DD', 'Cheque', 'RTGS / NEFT'];
const DEFAULT_HOSTEL_CATS = ['Hostel Fee', 'Mess Fee', 'Maintenance Fee', 'Electricity Fee', 'Security Deposit', 'Other'];
const ROOM_TYPES = ['Single', 'Double', 'Triple', 'Dormitory'];
const LIMIT = 20;

function AddEditModal({ resident, onClose, onSave }) {
  const [form, setForm] = useState(resident ? { ...resident, admission_date: resident.admission_date ? new Date(resident.admission_date).toISOString().split('T')[0] : '' } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const { programs, batches } = useAcademicConfig();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">{resident ? 'Edit Resident' : 'Add Hostel Resident'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <p className="col-span-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-1">Student Info</p>
            {[
              { k: 'name', l: 'Full Name', req: true, span: 2 },
              { k: 'usn', l: 'USN' },
              { k: 'mobile_number', l: 'Mobile' },
              { k: 'email', l: 'Email', type: 'email', span: 2 },
            ].map(({ k, l, req, type, span }) => (
              <div key={k} className={span === 2 ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">{l}{req ? ' *' : ''}</label>
                <input required={!!req} type={type || 'text'} value={form[k] || ''} onChange={e => set(k, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
              </div>
            ))}
            {/* Program dropdown from Settings */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Program</label>
              <select value={form.program || ''} onChange={e => set('program', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                <option value="">Select Program</option>
                {programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {/* Batch dropdown from Settings */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Batch</label>
              <select value={form.batch || ''} onChange={e => set('batch', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                <option value="">Select Batch</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Gender</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                <option value="">Select</option>
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Admission Date</label>
              <input type="date" value={form.admission_date} onChange={e => set('admission_date', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
            </div>

            <p className="col-span-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-2">Room Details</p>
            {[
              { k: 'hostel_name', l: 'Hostel Name' },
              { k: 'room_number', l: 'Room Number' },
              { k: 'block', l: 'Block' },
              { k: 'floor', l: 'Floor' },
            ].map(({ k, l }) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">{l}</label>
                <input type="text" value={form[k] || ''} onChange={e => set(k, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Room Type</label>
              <select value={form.room_type} onChange={e => set('room_type', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                <option value="">Select</option>
                {ROOM_TYPES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200">
                {['Active', 'Vacated', 'Pending'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <p className="col-span-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-2">Guardian</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Guardian Name</label>
              <input type="text" value={form.guardian_name || ''} onChange={e => set('guardian_name', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Guardian Mobile</label>
              <input type="text" value={form.guardian_mobile || ''} onChange={e => set('guardian_mobile', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200 resize-none" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : resident ? 'Update' : 'Add Resident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CollectModal({ resident, onClose, onDone }) {
  const { categories: configCategories, loading: catLoading } = useFeeCategories('Hostel', DEFAULT_HOSTEL_CATS);
  const [form, setForm] = useState({ ...COLLECT_FORM });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!form.fee_category && configCategories.length > 0) {
      setForm(f => ({ ...f, fee_category: configCategories[0] }));
    }
  }, [configCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await collectHostelFee(resident._id, form);
      setSuccess(data.data);
      onDone();
    } catch (err) { alert(err?.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Collect Hostel Fee</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{resident.name} · Room {resident.room_number || '—'}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {success ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <Building2 size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">Payment Recorded!</p>
            <p className="text-sm text-gray-500">₹{success.transaction?.pay_amount?.toLocaleString('en-IN')} collected</p>
            <p className="text-xs text-gray-400">ID: {success.transaction?.payment_id}</p>
            <button onClick={onClose} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Done</button>
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
                  placeholder="0.00" className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Method</label>
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
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Reference No</label>
                  <input type="text" value={form.reference} onChange={e => set('reference', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="e.g. Hostel fee for January 2025"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Processing...' : 'Collect Fee'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function HostelStudentsPage() {
  const [urlParams, setUrlParams] = useUrlFilters({ tab: 'Active', q: '', page: '1' });
  const tab = urlParams.tab;
  const search = urlParams.q;
  const page = Number(urlParams.page) || 1;
  const debouncedSearch = useDebounce(search, 350);

  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editResident, setEditResident] = useState(null);
  const [collectResident, setCollectResident] = useState(null);
  const { toasts, toast } = useToast();

  const allChecked = residents.length > 0 && residents.every(r => selected.includes(r._id));
  const someChecked = residents.some(r => selected.includes(r._id)) && !allChecked;
  const toggleAll = () => setSelected(allChecked ? [] : residents.map(r => r._id));
  const toggleOne = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: tab, page, limit: LIMIT };
      if (debouncedSearch) params.q = debouncedSearch;
      const { data } = await getHostelStudents(params);
      setResidents(data.data || []);
      setTotal(data.total || 0);
    } catch { toast('Failed to load residents', 'error'); }
    finally { setLoading(false); }
  }, [tab, page, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (payload) => {
    try {
      if (editResident) {
        const { data } = await updateHostelStudent(editResident._id, payload);
        setResidents(p => p.map(r => r._id === editResident._id ? data.data : r));
        toast('Resident updated');
      } else {
        const { data } = await createHostelStudent(payload);
        setResidents(p => [data.data, ...p]);
        toast('Resident added');
      }
    } catch (err) { toast(err?.response?.data?.error || 'Failed', 'error'); throw err; }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this resident?')) return;
    try {
      await deleteHostelStudent(id);
      setResidents(p => p.filter(r => r._id !== id));
      toast('Resident removed');
    } catch { toast('Failed to delete', 'error'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <Toasts toasts={toasts} />
      {(showAdd || editResident) && (
        <AddEditModal resident={editResident} onClose={() => { setShowAdd(false); setEditResident(null); }} onSave={handleSave} />
      )}
      {collectResident && (
        <CollectModal resident={collectResident} onClose={() => setCollectResident(null)} onDone={() => { fetchData(); setCollectResident(null); }} />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={22} className="text-blue-600" /> Hostel Residents
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage hostel residents and fee collection</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Add Resident
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Residents', value: total, color: 'text-blue-600' },
            { label: 'Active', value: residents.filter(r => r.status === 'Active').length, color: 'text-green-600' },
            { label: 'Vacated', value: residents.filter(r => r.status === 'Vacated').length, color: 'text-gray-600' },
            { label: 'Fee Collected', value: '₹' + residents.reduce((s, r) => s + (r.fee_paid || 0), 0).toLocaleString('en-IN'), color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Status tabs */}
          <div className="flex items-center px-5 border-b border-gray-100 dark:border-slate-700">
            {['Active', 'Vacated', 'Pending'].map(t => (
              <button key={t} onClick={() => setUrlParams({ tab: t })}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex-wrap">
            <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setUrlParams({ q: e.target.value })}
                placeholder="Search by name, USN, room..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200 placeholder-gray-400" />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap"><span className="font-semibold text-gray-700 dark:text-slate-300">{total}</span> residents</span>
            {selected.length > 0 && (
              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 rounded-full text-xs font-semibold">{selected.length} selected</span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Mail size={15} /></button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"><MessageCircle size={15} /></button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><Download size={15} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50">
                  <th className="w-10 px-4 py-3.5">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                  </th>
                  {['Hostel ID', 'Name', 'USN', 'Hostel / Room', 'Program', 'Mobile', 'Fee Paid', 'Admission Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td className="px-4 py-3"><div className="h-3 w-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                      {Array.from({ length: 10 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}
                    </tr>
                  ))
                ) : residents.length === 0 ? (
                  <tr><td colSpan={11} className="px-6 py-20 text-center">
                    <Building2 size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No residents found</p>
                    <button onClick={() => setShowAdd(true)} className="mt-2 text-sm text-blue-600 hover:underline">Add first resident →</button>
                  </td></tr>
                ) : residents.map(r => (
                  <tr key={r._id} className={`hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors ${selected.includes(r._id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(r._id)} onChange={() => toggleOne(r._id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{r.hostel_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{r.name}</div>
                      {r.email && <div className="text-xs text-gray-400">{r.email}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{r.usn || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 dark:text-slate-300">{r.hostel_name || '—'}</div>
                      {r.room_number && <div className="text-xs text-gray-400">Room {r.room_number} {r.block ? `· ${r.block}` : ''}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                      <div>{r.program || '—'}</div>
                      {r.batch && <div className="text-xs text-gray-400">{r.batch}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{r.mobile_number || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">
                      {r.fee_paid > 0 ? `₹${r.fee_paid.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{fmtDate(r.admission_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[r.status] || STATUS_STYLE.Active}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCollectResident(r)} title="Collect Fee"
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><Banknote size={14} /></button>
                        <button onClick={() => setEditResident(r)} title="Edit"
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(r._id)} title="Delete"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && total > LIMIT && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-gray-400">Page <span className="font-semibold">{page}</span> · {total} total</p>
              <div className="flex gap-2">
                <button onClick={() => setUrlParams({ page: String(Math.max(1, page - 1)) }, { resetPage: false })} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <button onClick={() => setUrlParams({ page: String(page + 1) }, { resetPage: false })} disabled={page * LIMIT >= total}
                  className="px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
