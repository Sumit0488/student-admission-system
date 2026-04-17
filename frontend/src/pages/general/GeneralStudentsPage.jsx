import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, X, SlidersHorizontal, Mail, MessageCircle, Download, Upload, Eye } from 'lucide-react';
import { getGeneralStudents, createGeneralStudent, bulkUploadGeneralStudents } from '../../services/generalApi';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';
import BulkUploadModal from '../../components/common/BulkUploadModal';
import EntityDropdown from '../../components/common/EntityDropdown';
import QuickViewDrawer from '../../components/common/QuickViewDrawer';

const STUDENT_SAMPLE_HEADERS = ['name', 'mobile_number', 'email', 'stream', 'program', 'batch'];
const STUDENT_REQUIRED_COLS = ['name'];

const STATUS_STYLE = {
  Active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

const COLS = ['ID', 'Name', 'Mobile Number', 'Email', 'Stream', 'Program', 'Status', ''];

const EMPTY_FORM = { name: '', mobile_number: '', email: '', stream: '', program: '', batch: '' };

function AddModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handlePhone = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    set('mobile_number', digits);
    setPhoneError(digits && digits.length !== 10 ? 'Mobile number must be 10 digits' : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.mobile_number && !/^\d{10}$/.test(form.mobile_number)) {
      setPhoneError('Mobile number must be 10 digits');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add Student</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Full Name *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Mobile Number</label>
            <input
              type="tel" value={form.mobile_number}
              onChange={(e) => handlePhone(e.target.value)}
              maxLength={10} inputMode="numeric"
              className={`${inp} ${phoneError ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="10-digit number"
            />
            {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Stream</label>
            <EntityDropdown
              url="/api/config/stream"
              value={form.stream}
              onChange={(val) => set('stream', val)}
              blankLabel="— Select Stream —"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Program</label>
            <EntityDropdown
              url="/api/config/program"
              value={form.program}
              onChange={(val) => set('program', val)}
              blankLabel="— Select Program —"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Batch</label>
            <EntityDropdown
              url="/api/config/batch"
              value={form.batch}
              onChange={(val) => set('batch', val)}
              blankLabel="— Select Batch —"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !!phoneError} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Add Student'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const LIMIT = 20;

export default function GeneralStudentsPage() {
  const [urlParams, setUrlParams] = useUrlFilters({ tab: 'Active', q: '', page: '1' });
  const tab    = urlParams.tab;
  const search = urlParams.q;
  const page   = Number(urlParams.page) || 1;
  const debouncedSearch = useDebounce(search, 350);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selected, setSelected] = useState([]);
  const [quickView, setQuickView] = useState(null);
  const { toasts, toast } = useToast();

  const allChecked = students.length > 0 && students.every((s) => selected.includes(s._id));
  const someChecked = students.some((s) => selected.includes(s._id)) && !allChecked;
  const toggleAll = () => setSelected(allChecked ? [] : students.map((s) => s._id));
  const toggleOne = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: tab, page, limit: LIMIT };
      if (debouncedSearch) params.q = debouncedSearch;
      const { data } = await getGeneralStudents(params);
      setStudents(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab, page, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (payload) => {
    try {
      const { data } = await createGeneralStudent(payload);
      setStudents((p) => [data.data, ...p]);
      toast('Student added');
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to add student', 'error');
      throw err;
    }
  };

  return (
    <>
      <Toasts toasts={toasts} />
      {showModal && <AddModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
      {quickView && <QuickViewDrawer entityType="general-students" entityId={quickView} onClose={() => setQuickView(null)} title="Student" />}
      {showBulkModal && (
        <BulkUploadModal
          title="Bulk Upload Students"
          uploadFn={bulkUploadGeneralStudents}
          sampleHeaders={STUDENT_SAMPLE_HEADERS}
          sampleFilename="students_template.csv"
          requiredColumns={STUDENT_REQUIRED_COLS}
          notes={['name is required. mobile_number, email, stream, program, batch are optional.']}
          errorKey="name"
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => fetchData()}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">General student registry</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Upload size={15} />
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Student
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Status tabs */}
          <div className="flex items-center px-5 border-b border-gray-100 dark:border-slate-700 gap-0">
            {['Active', 'Inactive'].map((t) => (
              <button key={t} onClick={() => setUrlParams({ tab: t }, { replace: false })}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${tab === t ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Search + Actions bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex-wrap">
            <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0" />
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setUrlParams({ q: e.target.value })}
                placeholder="Search by name, email..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
              from <span className="font-semibold text-gray-700 dark:text-slate-300">{total.toLocaleString()}</span> Students
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" title="Send Email" className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Mail size={15} /></button>
              <button type="button" title="Send WhatsApp" className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><MessageCircle size={15} /></button>
              <button type="button" title="Download" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><Download size={15} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50">
                  <th className="w-10 px-4 py-3.5">
                    <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  {COLS.map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <tr key={i}><td className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-4" /></td>{COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>)
                ) : students.length === 0 ? (
                  <tr><td colSpan={COLS.length + 1} className="px-6 py-16 text-center">
                    <Users size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">No students found</p>
                  </td></tr>
                ) : (
                  students.map((s) => (
                    <tr key={s._id} className={`hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors ${selected.includes(s._id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.includes(s._id)} onChange={() => toggleOne(s._id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{s.student_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.mobile_number || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{s.email || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.stream || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.program || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setQuickView(s._id)} title="Quick View" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Eye size={13} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && total > LIMIT && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Page <span className="font-semibold text-gray-600 dark:text-slate-300">{page}</span> · {total} total
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setUrlParams({ page: String(Math.max(1, page - 1)) }, { resetPage: false })} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Prev</button>
                <button onClick={() => setUrlParams({ page: String(page + 1) }, { resetPage: false })} disabled={page * LIMIT >= total}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
