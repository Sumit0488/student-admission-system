import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, X, ArrowRight, Users, CheckCircle, AlertCircle, Pencil, Loader2,
} from 'lucide-react';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../services/admissionsApi';


const YEARS = ['2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];

const EMPTY_SCHEDULE = {
  scheduleName: '', academicYear: '',
  regPrefix: '', applicantPrefix: '', maxSeats: 60,
  programs: '',
  admissionType: {
    regular: { enabled: false, allowedTerms: [] },
    lateral: { enabled: false, allowedTerms: [] },
  },
};

// ── Toast ──────────────────────────────────────────────────────────────────────
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
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto
          ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Admission type card (strict: Regular=Term1/Year1, Lateral=Term3/Year2) ─────
const ADMISSION_TYPE_META = {
  regular: { label: 'Regular Admission', term: 1, year: 1, desc: '1st Year Entry', color: 'blue' },
  lateral: { label: 'Lateral Admission', term: 3, year: 2, desc: '2nd Year Direct Entry', color: 'purple' },
};
function AdmissionTypeCard({ category, config, onToggle }) {
  const meta = ADMISSION_TYPE_META[category];
  const c    = meta.color;
  return (
    <button type="button" onClick={onToggle}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all
        ${config.enabled
          ? `border-${c}-500 bg-${c}-50 dark:bg-${c}-900/20 dark:border-${c}-500`
          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
          ${config.enabled ? `border-${c}-500 bg-${c}-500` : 'border-gray-300 dark:border-slate-500'}`}>
          {config.enabled && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${config.enabled ? `text-${c}-700 dark:text-${c}-400` : 'text-gray-700 dark:text-slate-300'}`}>
            {meta.label}
          </p>
          <p className={`text-xs mt-0.5 ${config.enabled ? `text-${c}-500 dark:text-${c}-400` : 'text-gray-400 dark:text-slate-500'}`}>
            Term {meta.term} · Year {meta.year} · {meta.desc}
          </p>
        </div>
        {config.enabled && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-${c}-100 dark:bg-${c}-900/40 text-${c}-700 dark:text-${c}-400 shrink-0`}>
            T{meta.term}
          </span>
        )}
      </div>
    </button>
  );
}


export default function EnquiryPage() {
  const navigate          = useNavigate();
  const { toasts, toast } = useToast();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch]       = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(EMPTY_SCHEDULE);
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);

  // Edit modal
  const [showEdit, setShowEdit]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]     = useState(EMPTY_SCHEDULE);
  const [editErrors, setEditErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await getSchedules();
      const list = data?.data;
      if (!Array.isArray(list)) throw new Error('Unexpected response format');
      setSchedules(list);
    } catch (err) {
      console.error('[EnquiryPage] fetchSchedules failed:', err?.response?.data || err?.message);
      setLoadError(true);
      toast('Failed to load schedules — check that the backend server is running', 'error');
    } finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── Create form handlers ──────────────────────────────────────────────────
  const set = (f) => (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((p) => ({ ...p, [f]: val }));
    setErrors((p) => ({ ...p, [f]: '' }));
  };

  const toggleAdmType = (cat) =>
    setForm((p) => ({ ...p, admissionType: { ...p.admissionType, [cat]: { ...p.admissionType[cat], enabled: !p.admissionType[cat].enabled } } }));

  const validate = () => {
    const e = {};
    if (!form.scheduleName.trim())    e.scheduleName    = 'Required';
    if (!form.academicYear)           e.academicYear    = 'Required';
    if (!form.regPrefix.trim())       e.regPrefix       = 'Required';
    if (!form.applicantPrefix.trim()) e.applicantPrefix = 'Required';
    if (!form.maxSeats || form.maxSeats < 1) e.maxSeats = 'Must be ≥ 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        stream:   form.scheduleName,
        degree:   '',
        branch:   '',
        programs: form.programs.split('\n').map((s) => s.trim()).filter(Boolean),
      };
      const { data } = await createSchedule(payload);
      setSchedules((p) => [data.data, ...p]);
      toast('Schedule created');
      setShowCreate(false);
      setForm(EMPTY_SCHEDULE);
      navigate(`/admin/admissions/enquiry/${data.data._id}`);
    } catch (err) {
      toast(err.response?.data?.error || 'Create failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id);
      setSchedules((p) => p.filter((s) => s._id !== id));
      toast('Schedule deleted');
    } catch { toast('Delete failed', 'error'); }
    finally { setDeleteId(null); }
  };

  // ── Edit form handlers ────────────────────────────────────────────────────
  const openEdit = (s) => {
    setEditTarget(s);
    setEditForm({
      scheduleName:    s.scheduleName,
      academicYear:    s.academicYear,
      regPrefix:       s.regPrefix,
      applicantPrefix: s.applicantPrefix,
      maxSeats:        s.maxSeats,
      programs:        Array.isArray(s.programs) ? s.programs.join('\n') : (s.programs || ''),
      admissionType:   s.admissionType || EMPTY_SCHEDULE.admissionType,
    });
    setEditErrors({});
    setShowEdit(true);
  };

  const setEdit = (f) => (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setEditForm((p) => ({ ...p, [f]: val }));
    setEditErrors((p) => ({ ...p, [f]: '' }));
  };

  const toggleEditAdmType = (cat) =>
    setEditForm((p) => ({ ...p, admissionType: { ...p.admissionType, [cat]: { ...p.admissionType[cat], enabled: !p.admissionType[cat].enabled } } }));

  const validateEdit = () => {
    const e = {};
    if (!editForm.scheduleName.trim())    e.scheduleName    = 'Required';
    if (!editForm.academicYear)           e.academicYear    = 'Required';
    if (!editForm.regPrefix.trim())       e.regPrefix       = 'Required';
    if (!editForm.applicantPrefix.trim()) e.applicantPrefix = 'Required';
    if (!editForm.maxSeats || editForm.maxSeats < 1) e.maxSeats = 'Must be ≥ 1';
    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = async (ev) => {
    ev.preventDefault();
    if (!validateEdit()) return;
    setEditSaving(true);
    try {
      const payload = {
        ...editForm,
        stream:   editForm.scheduleName,
        degree:   '',   // clear legacy field
        branch:   '',   // clear legacy field
        programs: editForm.programs.split('\n').map((s) => s.trim()).filter(Boolean),
      };
      const { data } = await updateSchedule(editTarget._id, payload);
      setSchedules((p) => p.map((s) => s._id === editTarget._id ? data.data : s));
      toast('Schedule updated');
      setShowEdit(false);
    } catch (err) {
      toast(err.response?.data?.error || 'Update failed', 'error');
    } finally { setEditSaving(false); }
  };

  const inp = (err) =>
    `w-full px-3 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-slate-700 dark:text-white
     focus:outline-none focus:ring-2 focus:ring-blue-500
     ${err ? 'border-red-400' : 'border-gray-300 dark:border-slate-600'}`;

  const lbl = (text, req) => (
    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
      {text}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const filtered = schedules.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.scheduleName.toLowerCase().includes(q) ||
      (s.academicYear || '').toLowerCase().includes(q);
  });

  return (
    <>
      <Toasts toasts={toasts} />

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-80 shadow-2xl">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Delete schedule?</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">All enquiries linked to this schedule will lose their schedule reference.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Create Admission Schedule</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><X size={17} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                {lbl('Schedule Name', true)}
                <input value={form.scheduleName} onChange={set('scheduleName')} placeholder="e.g. UG Engineering 2025" className={inp(errors.scheduleName)} />
                {errors.scheduleName && <p className="text-xs text-red-500 mt-1">{errors.scheduleName}</p>}
              </div>
              <div>
                {lbl('Academic Year', true)}
                <select value={form.academicYear} onChange={set('academicYear')} className={inp(errors.academicYear)}>
                  <option value="">— Select —</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.academicYear && <p className="text-xs text-red-500 mt-1">{errors.academicYear}</p>}
              </div>
              <div>
                {lbl('Max Seats', true)}
                <input type="number" min={1} value={form.maxSeats} onChange={set('maxSeats')} className={inp(errors.maxSeats)} />
                {errors.maxSeats && <p className="text-xs text-red-500 mt-1">{errors.maxSeats}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  {lbl('Reg Prefix', true)}
                  <input value={form.regPrefix} onChange={set('regPrefix')} placeholder="REG25" className={inp(errors.regPrefix)} />
                  {errors.regPrefix && <p className="text-xs text-red-500 mt-1">{errors.regPrefix}</p>}
                </div>
                <div>
                  {lbl('Applicant Prefix', true)}
                  <input value={form.applicantPrefix} onChange={set('applicantPrefix')} placeholder="APP25" className={inp(errors.applicantPrefix)} />
                  {errors.applicantPrefix && <p className="text-xs text-red-500 mt-1">{errors.applicantPrefix}</p>}
                </div>
              </div>
              <div>
                {lbl('Programs (one per line)')}
                <textarea value={form.programs} onChange={set('programs')} rows={3}
                  placeholder={'B.E Core\nData Science Specialization\nAI/ML'}
                  className={`${inp(false)} resize-none font-mono text-xs`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-2">Admission Types</p>
                <div className="space-y-2">
                  <AdmissionTypeCard category="regular" config={form.admissionType.regular} onToggle={() => toggleAdmType('regular')} />
                  <AdmissionTypeCard category="lateral" config={form.admissionType.lateral} onToggle={() => toggleAdmType('lateral')} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create & Open'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Schedule</h2>
              <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><X size={17} /></button>
            </div>
            <form onSubmit={handleUpdate} className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                {lbl('Schedule Name', true)}
                <input value={editForm.scheduleName} onChange={setEdit('scheduleName')} placeholder="e.g. UG Engineering 2025" className={inp(editErrors.scheduleName)} />
                {editErrors.scheduleName && <p className="text-xs text-red-500 mt-1">{editErrors.scheduleName}</p>}
              </div>
              <div>
                {lbl('Academic Year', true)}
                <select value={editForm.academicYear} onChange={setEdit('academicYear')} className={inp(editErrors.academicYear)}>
                  <option value="">— Select —</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                {editErrors.academicYear && <p className="text-xs text-red-500 mt-1">{editErrors.academicYear}</p>}
              </div>
              <div>
                {lbl('Max Seats', true)}
                <input type="number" min={1} value={editForm.maxSeats} onChange={setEdit('maxSeats')} className={inp(editErrors.maxSeats)} />
                {editErrors.maxSeats && <p className="text-xs text-red-500 mt-1">{editErrors.maxSeats}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  {lbl('Reg Prefix', true)}
                  <input value={editForm.regPrefix} onChange={setEdit('regPrefix')} placeholder="REG25" className={inp(editErrors.regPrefix)} />
                  {editErrors.regPrefix && <p className="text-xs text-red-500 mt-1">{editErrors.regPrefix}</p>}
                </div>
                <div>
                  {lbl('Applicant Prefix', true)}
                  <input value={editForm.applicantPrefix} onChange={setEdit('applicantPrefix')} placeholder="APP25" className={inp(editErrors.applicantPrefix)} />
                  {editErrors.applicantPrefix && <p className="text-xs text-red-500 mt-1">{editErrors.applicantPrefix}</p>}
                </div>
              </div>
              <div>
                {lbl('Programs (one per line)')}
                <textarea value={editForm.programs} onChange={setEdit('programs')} rows={3}
                  placeholder={'B.E Core\nData Science Specialization\nAI/ML'}
                  className={`${inp(false)} resize-none font-mono text-xs`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-2">Admission Types</p>
                <div className="space-y-2">
                  <AdmissionTypeCard category="regular" config={editForm.admissionType.regular} onToggle={() => toggleEditAdmType('regular')} />
                  <AdmissionTypeCard category="lateral" config={editForm.admissionType.lateral} onToggle={() => toggleEditAdmType('lateral')} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                  {editSaving
                    ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving…</span>
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Page ──────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admission Schedules</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Select a schedule to manage its student pipeline</p>
          </div>
          <button onClick={() => { setForm(EMPTY_SCHEDULE); setErrors({}); setShowCreate(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors">
            <Plus size={15} /> New Schedule
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schedules..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl placeholder-gray-400 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        {/* Schedule Cards Grid */}
        {loadError && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800">
            <AlertCircle size={32} className="text-red-400 mb-3" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Could not load schedules</p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-1 mb-4">Make sure the backend server is running on port 4000</p>
            <button onClick={fetchSchedules}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
              Retry
            </button>
          </div>
        )}
        {!loadError && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-3">
                {[60, 40, 80, 40].map((w, j) => (
                  <div key={j} className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4">
              <Users size={28} className="text-gray-400 dark:text-slate-500" />
            </div>
            <p className="text-base font-medium text-gray-500 dark:text-slate-400">
              {search ? 'No schedules match your search' : 'No schedules yet'}
            </p>
            {!search && (
              <button onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                <Plus size={14} /> Create your first schedule
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((s) => {
              const seatPct   = s.maxSeats > 0 ? Math.round((s.filledSeats / s.maxSeats) * 100) : 0;
              const seatsFull = s.filledSeats >= s.maxSeats;
              return (
                <div key={s._id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col">

                  {/* Card top bar */}
                  <div className="h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 to-indigo-500" />

                  <div className="p-5 flex-1 space-y-4">
                    {/* Title */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{s.scheduleName}</h3>
                    </div>

                    {/* Year + Prefixes */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium">
                        {s.academicYear}
                      </span>
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                        {s.regPrefix}
                      </span>
                      <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                        {s.applicantPrefix}
                      </span>
                    </div>

                    {/* Admission types */}
                    <div className="flex gap-1.5 flex-wrap">
                      {s.admissionType?.regular?.enabled && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          Regular · T{(s.admissionType.regular.allowedTerms || []).join(',')}
                        </span>
                      )}
                      {s.admissionType?.lateral?.enabled && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          Lateral · T{(s.admissionType.lateral.allowedTerms || []).join(',')}
                        </span>
                      )}
                    </div>

                    {/* Seat progress */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-slate-400">Seats filled</span>
                        <span className={`font-semibold ${seatsFull ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-300'}`}>
                          {s.filledSeats}/{s.maxSeats}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${seatsFull ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(seatPct, 100)}%` }} />
                      </div>
                    </div>

                    {/* Applicant count */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                      <Users size={12} />
                      <span>{s.applicantCount || 0} applicant{s.applicantCount !== 1 ? 's' : ''} registered</span>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="px-5 py-4 border-t border-gray-50 dark:border-slate-700 flex items-center justify-between">
                    <button onClick={() => setDeleteId(s._id)}
                      className="p-1.5 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-semibold transition-colors">
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button onClick={() => navigate(`/admin/admissions/enquiry/${s._id}`)}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group">
                        Open Schedule
                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
