import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, CheckCircle, AlertCircle, Calendar,
  ArrowLeft, Copy, Users, ChevronRight, Loader2, AlertTriangle,
} from 'lucide-react';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../services/admissionsApi';

const STREAMS = [
  'B.E Computer Science & Engineering', 'B.E Electronics & Communication',
  'B.E Mechanical Engineering', 'B.E Civil Engineering',
  'B.E Artificial Intelligence & ML', 'B.E Information Science',
  'B.E Electrical & Electronics', 'MBA', 'MCA', 'M.Tech',
];
const YEARS = ['2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];

const ADMISSION_TYPE_META = {
  regular: { label: 'Regular Admission', term: 1, year: 1, desc: '1st Year Entry · Term 1', color: 'blue' },
  lateral: { label: 'Lateral Admission',  term: 3, year: 2, desc: '2nd Year Direct Entry · Term 3', color: 'purple' },
};

const PIPELINE_STAGES = [
  { num: 1, name: 'Inquiry',     color: 'bg-slate-700 dark:bg-slate-600' },
  { num: 2, name: 'Application', color: 'bg-blue-700' },
  { num: 3, name: 'Admitted',    color: 'bg-green-700' },
  { num: 4, name: 'Rejected',    color: 'bg-red-600' },
  { num: 5, name: 'Cancelled',   color: 'bg-gray-400 dark:bg-gray-500' },
];

const EMPTY = {
  scheduleName: '', stream: '', academicYear: '',
  regPrefix: '', applicantPrefix: '', maxSeats: 60,
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

// ── Admission-type card ────────────────────────────────────────────────────────
function AdmissionTypeCard({ category, config, onToggle }) {
  const meta = ADMISSION_TYPE_META[category];
  const colors = {
    blue:   { border: 'border-blue-400 dark:border-blue-500',     bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-300',   badge: 'bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300' },
    purple: { border: 'border-purple-400 dark:border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300' },
  }[meta.color];
  return (
    <button type="button" onClick={onToggle}
      className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all
        ${config.enabled ? `${colors.border} ${colors.bg}` : 'border-gray-200 dark:border-slate-600 bg-transparent hover:border-gray-300 dark:hover:border-slate-500'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold ${config.enabled ? colors.text : 'text-gray-700 dark:text-slate-300'}`}>{meta.label}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{meta.desc}</p>
        </div>
        {config.enabled && (
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>Enabled</span>
        )}
      </div>
    </button>
  );
}

// ── Schedule Card ──────────────────────────────────────────────────────────────
function ScheduleCard({ s, onOpen, onEdit, onDuplicate, onDelete, duplicating }) {
  const seatPct    = Math.min(100, Math.round(((s.filledSeats || 0) / (s.maxSeats || 1)) * 100));
  const seatsFull  = (s.filledSeats || 0) >= s.maxSeats;
  const seatsAlmost = seatPct >= 80 && !seatsFull;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">

      {/* ── Card Header ─────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-base leading-snug truncate">
              {s.scheduleName}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
              {s.degree
                ? s.branch ? `${s.degree} · ${s.branch}` : s.degree
                : s.stream || '—'}
            </p>
          </div>
          {/* Edit button — always visible, top-right */}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(s); }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-semibold transition-colors shadow-sm">
            <Pencil size={13} />
            Edit
          </button>
        </div>

        {/* Year badge */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
            <Calendar size={10} />
            {s.academicYear}
          </span>
          {s.admissionType?.regular?.enabled && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              Regular · Yr 1
            </span>
          )}
          {s.admissionType?.lateral?.enabled && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
              Lateral · Yr 2
            </span>
          )}
        </div>
      </div>

      {/* ── Seat Progress ────────────────────────────────────────────── */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
            <Users size={11} />
            Seats
          </span>
          <span className={`text-xs font-semibold
            ${seatsFull   ? 'text-red-600 dark:text-red-400'
            : seatsAlmost ? 'text-amber-600 dark:text-amber-400'
            :               'text-gray-700 dark:text-slate-300'}`}>
            {s.filledSeats || 0}/{s.maxSeats}
            {seatsFull   ? ' · Full'   : ''}
            {seatsAlmost ? ' · Almost' : ''}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all
              ${seatsFull   ? 'bg-red-500'
              : seatsAlmost ? 'bg-amber-500'
              :               'bg-blue-500'}`}
            style={{ width: `${seatPct}%` }}
          />
        </div>
      </div>

      {/* ── Prefixes ─────────────────────────────────────────────────── */}
      <div className="px-5 pb-4 flex items-center gap-3">
        <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
          {s.regPrefix}
        </span>
        <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
          {s.applicantPrefix}
        </span>
      </div>

      {/* ── Footer actions ───────────────────────────────────────────── */}
      <div className="mt-auto px-5 pb-5 space-y-2">
        <button
          onClick={() => onOpen(s._id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm">
          Open Schedule
          <ChevronRight size={15} />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(s); }}
            disabled={duplicating === s._id}
            title="Duplicate schedule"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-xs font-medium text-gray-500 dark:text-slate-400 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 disabled:opacity-50 transition-colors">
            {duplicating === s._id
              ? <Loader2 size={13} className="animate-spin" />
              : <Copy size={13} />}
            Duplicate
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(s._id); }}
            title="Delete schedule"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-xs font-medium text-gray-500 dark:text-slate-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors">
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ title, body, confirmLabel = 'Confirm', confirmClass = 'bg-blue-600 hover:bg-blue-700', onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[340px] shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{title}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{body}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2 ${confirmClass}`}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulesPage() {
  const navigate                     = useNavigate();
  const { toasts, toast }            = useToast();
  const [schedules, setSchedules]    = useState([]);
  const [loading, setLoading]        = useState(true);
  const [loadError, setLoadError]    = useState(false);
  const [viewMode, setViewMode]      = useState('list');   // 'list' | 'form'
  const [editTarget, setEdit]        = useState(null);
  const [form, setForm]              = useState(EMPTY);
  const [errors, setErrors]          = useState({});
  const [saving, setSaving]          = useState(false);
  const [duplicating, setDuplicating] = useState(null);   // schedule._id being duplicated

  // Confirm dialogs
  const [deleteConfirm, setDeleteConfirm] = useState(null);   // { id, name }
  const [saveConfirm, setSaveConfirm]     = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await getSchedules();
      setSchedules(data.data || []);
    } catch {
      toast('Failed to load schedules', 'error');
      setLoadError(true);
    }
    finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Form helpers ────────────────────────────────────────────────────────────
  const openCreate = () => { setForm(EMPTY); setErrors({}); setEdit(null); setViewMode('form'); };

  const openEdit = (s) => {
    setForm({
      scheduleName:    s.scheduleName,
      stream:          s.stream,
      academicYear:    s.academicYear,
      regPrefix:       s.regPrefix,
      applicantPrefix: s.applicantPrefix,
      maxSeats:        s.maxSeats ?? 60,
      admissionType: {
        regular: { enabled: s.admissionType?.regular?.enabled ?? false, allowedTerms: [] },
        lateral: { enabled: s.admissionType?.lateral?.enabled ?? false, allowedTerms: [] },
      },
    });
    setErrors({}); setEdit(s); setViewMode('form');
  };

  const set = (f) => (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((p) => ({ ...p, [f]: val }));
    setErrors((p) => ({ ...p, [f]: '' }));
  };

  const toggleAdmType = (cat) => {
    setForm((p) => ({
      ...p,
      admissionType: {
        ...p.admissionType,
        [cat]: { ...p.admissionType[cat], enabled: !p.admissionType[cat].enabled },
      },
    }));
  };

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

  // Called when user clicks Save button — validate then show confirm if editing
  const handleSaveClick = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    if (editTarget) {
      setSaveConfirm(true); // show confirmation for edits
    } else {
      doSave();             // create directly
    }
  };

  const doSave = async () => {
    setSaveConfirm(false);
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await updateSchedule(editTarget._id, form);
        setSchedules((p) => p.map((s) => s._id === editTarget._id ? data.data : s));
        toast('Schedule updated successfully');
      } else {
        const { data } = await createSchedule(form);
        setSchedules((p) => [data.data, ...p]);
        toast('Schedule created');
      }
      setViewMode('list');
    } catch (err) {
      toast(err.response?.data?.error || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteSchedule(deleteConfirm.id);
      setSchedules((p) => p.filter((s) => s._id !== deleteConfirm.id));
      toast('Schedule deleted');
    } catch { toast('Delete failed', 'error'); }
    finally { setDeleting(false); setDeleteConfirm(null); }
  };

  // ── Duplicate ───────────────────────────────────────────────────────────────
  const handleDuplicate = async (s) => {
    setDuplicating(s._id);
    try {
      const payload = {
        scheduleName:    `${s.scheduleName} (Copy)`,
        stream:          s.stream,
        academicYear:    s.academicYear,
        regPrefix:       s.regPrefix,
        applicantPrefix: `${s.applicantPrefix}C`,
        maxSeats:        s.maxSeats,
        admissionType:   s.admissionType,
      };
      const { data } = await createSchedule(payload);
      setSchedules((p) => [data.data, ...p]);
      toast('Schedule duplicated');
    } catch (err) {
      toast(err.response?.data?.error || 'Duplicate failed', 'error');
    } finally { setDuplicating(null); }
  };

  const inp = (err) =>
    `w-full px-4 py-3 text-sm rounded-xl border bg-white dark:bg-slate-700/50 dark:text-white
     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
     ${err ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'}`;

  const lbl = (text, req) => (
    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
      {text}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // FORM VIEW (full-screen)
  // ══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'form') {
    return (
      <>
        <Toasts toasts={toasts} />

        {/* Save confirmation */}
        {saveConfirm && (
          <ConfirmModal
            title={`Save changes to "${form.scheduleName}"?`}
            body="This will update the schedule configuration. Existing applicant records will not be affected."
            confirmLabel={saving ? 'Saving…' : 'Save Changes'}
            confirmClass="bg-blue-600 hover:bg-blue-700"
            loading={saving}
            onConfirm={doSave}
            onCancel={() => setSaveConfirm(false)}
          />
        )}

        <form onSubmit={handleSaveClick} className="min-h-full">

          {/* ── Top bar ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setViewMode('list')}
                className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editTarget ? 'Edit Schedule' : 'New Schedule'}
                </h1>
                {editTarget && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{editTarget.scheduleName}</p>
                )}
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors shadow-sm">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>

          <div className="max-w-3xl space-y-8">

            {/* ── Schedule Details ──────────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Schedule Details</h2>
                {editTarget && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    Editing — applicant records will not be affected
                  </p>
                )}
              </div>
              <div className="px-6 py-6 space-y-5">

                {/* Schedule Name */}
                <div>
                  {lbl('Schedule Name', true)}
                  <input value={form.scheduleName} onChange={set('scheduleName')}
                    placeholder="e.g. UG Admissions 2025-26"
                    className={inp(errors.scheduleName)} />
                  {errors.scheduleName && <p className="text-xs text-red-500 mt-1">{errors.scheduleName}</p>}
                </div>

                {/* Stream + Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl('Stream / Program', true)}
                    <select value={form.stream} onChange={set('stream')} className={inp(errors.stream)}>
                      <option value="">— Select —</option>
                      {STREAMS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.stream && <p className="text-xs text-red-500 mt-1">{errors.stream}</p>}
                  </div>
                  <div>
                    {lbl('Academic Year', true)}
                    <select value={form.academicYear} onChange={set('academicYear')} className={inp(errors.academicYear)}>
                      <option value="">— Select —</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {errors.academicYear && <p className="text-xs text-red-500 mt-1">{errors.academicYear}</p>}
                  </div>
                </div>

                {/* Reg No Prefix + Applicant ID Prefix */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl('Reg No Prefix', true)}
                    <input value={form.regPrefix} onChange={set('regPrefix')}
                      placeholder="REG2025" className={inp(errors.regPrefix)} />
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                      e.g. &apos;7RL&apos; → 7RL001, 7RL002…
                    </p>
                    {errors.regPrefix && <p className="text-xs text-red-500 mt-1">{errors.regPrefix}</p>}
                  </div>
                  <div>
                    {lbl('Applicant ID Prefix', true)}
                    <input value={form.applicantPrefix} onChange={set('applicantPrefix')}
                      placeholder="APP2025" className={inp(errors.applicantPrefix)} />
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                      e.g. &apos;23RL&apos; → 23RL001, 23RL002…
                    </p>
                    {errors.applicantPrefix && <p className="text-xs text-red-500 mt-1">{errors.applicantPrefix}</p>}
                  </div>
                </div>

                {/* Max Seats */}
                <div className="max-w-[200px]">
                  {lbl('Seat Capacity', true)}
                  <input type="number" min={1} value={form.maxSeats} onChange={set('maxSeats')}
                    className={inp(errors.maxSeats)} />
                  {errors.maxSeats && <p className="text-xs text-red-500 mt-1">{errors.maxSeats}</p>}
                </div>

              </div>
            </section>

            {/* ── Admission Type ────────────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Admission Type</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Select which admission categories are open for this schedule</p>
              </div>
              <div className="px-6 py-6 space-y-3">
                <AdmissionTypeCard category="regular" config={form.admissionType.regular} onToggle={() => toggleAdmType('regular')} />
                <AdmissionTypeCard category="lateral" config={form.admissionType.lateral} onToggle={() => toggleAdmType('lateral')} />
              </div>
            </section>

            {/* ── Pipeline Stages (read-only info) ─────────────────────── */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pipeline Stages</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Fixed stages applied to all schedules</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-4 px-6 py-3.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${stage.color}`}>
                      {stage.num}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-slate-300">{stage.name}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </form>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW — Card grid
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <Toasts toasts={toasts} />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <ConfirmModal
          title={`Delete "${deleteConfirm.name}"?`}
          body="This will permanently delete the schedule. Existing applicant records linked to this schedule may be affected."
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-700"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <div className="space-y-6">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admission Schedules</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Manage admission windows, seat limits and configurations
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors">
            <Plus size={15} /> New Schedule
          </button>
        </div>

        {/* ── Loading skeleton ─────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-gray-100 dark:bg-slate-700/60 rounded w-full" />
                <div className="h-3 bg-gray-100 dark:bg-slate-700/60 rounded w-1/2" />
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && loadError && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm py-16 text-center">
            <AlertTriangle size={36} className="mx-auto mb-3 text-red-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Failed to load schedules</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 mb-5">Make sure the backend is running on port 4000</p>
            <button onClick={fetchData}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              <Loader2 size={14} /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !loadError && schedules.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm py-20 text-center">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No schedules yet</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 mb-5">Create your first admission schedule to get started</p>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus size={15} /> New Schedule
            </button>
          </div>
        )}

        {/* ── Card grid ────────────────────────────────────────────────── */}
        {!loading && !loadError && schedules.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {schedules.map((s) => (
              <ScheduleCard
                key={s._id}
                s={s}
                onOpen={(id) => navigate(`/admin/admissions/schedules/${id}`)}
                onEdit={openEdit}
                onDuplicate={handleDuplicate}
                onDelete={(id) => setDeleteConfirm({ id, name: s.scheduleName })}
                duplicating={duplicating}
              />
            ))}
          </div>
        )}

      </div>
    </>
  );
}
