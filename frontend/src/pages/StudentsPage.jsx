import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudents          as apiGetStudents,
  getStatusCounts      as apiGetCounts,
  createStudent        as apiCreateStudent,
  updateStudent        as apiUpdateStudent,
  deleteStudent        as apiDeleteStudent,
  changeStudentStatus  as apiChangeStatus,
  exportStudents       as apiExportStudents,
  exportFullReport     as apiExportFullReport,
  getDistinctPrograms  as apiGetDistinctPrograms,
} from '../services/studentApi';
import { getAllConfig } from '../services/configApi';
import {
  Search, SlidersHorizontal, Download, MoreVertical,
  ChevronLeft, ChevronRight, Eye, Pencil, Trash2, RefreshCw,
  X, CheckCircle, AlertCircle, Award, Loader2,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { submitCertificateRequest, getTemplates } from '../services/admissionsApi';

// ─── Certificate Request Modal ────────────────────────────────────────────────
function CertificateRequestModal({ student, onClose, toast }) {
  const [form, setForm] = useState({ templateId: '', reason: '', deliveryType: 'Download' });
  const [certTypes, setCertTypes] = useState([]);
  useEffect(() => {
    getTemplates()
      .then(({ data }) => setCertTypes((data.data || []).filter((t) => t.status === 'LIVE')))
      .catch(() => {});
  }, []);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (f) => (e) => { setForm((p) => ({ ...p, [f]: e.target.value })); setErrors((p) => ({ ...p, [f]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.templateId) e.templateId = 'Required';
    if (!form.reason.trim())   e.reason = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const tmpl = certTypes.find((t) => t._id === form.templateId);
      await submitCertificateRequest({
        studentName:     student.name,
        usn:             student.student_id,
        templateId:      form.templateId,
        certificateType: tmpl?.name || form.templateId,
        reason:          form.reason.trim(),
        deliveryType:    form.deliveryType,
      });
      toast('Certificate request submitted successfully');
      onClose();
    } catch (err) {
      toast(err.response?.data?.error || 'Submission failed', 'error');
    } finally { setSubmitting(false); }
  };

  const inp = (err) =>
    `w-full px-3 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-slate-700 dark:text-white
     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
     ${err ? 'border-red-400' : 'border-gray-300 dark:border-slate-600'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Award size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Request Certificate</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500">{student.name} · {student.student_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Student Name — read only */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Student Name</label>
            <input value={student.name} readOnly className={`${inp(false)} opacity-60 cursor-not-allowed`} />
          </div>

          {/* USN — read only */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">USN</label>
            <input value={student.student_id} readOnly className={`${inp(false)} font-mono opacity-60 cursor-not-allowed`} />
          </div>

          {/* Certificate Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Certificate Type <span className="text-red-500">*</span>
            </label>
            <select value={form.templateId} onChange={set('templateId')} className={inp(errors.templateId)}>
              <option value="">— Select Certificate —</option>
              {certTypes.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            {errors.templateId && <p className="text-xs text-red-500 mt-1">{errors.templateId}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea value={form.reason} onChange={set('reason')} rows={3}
              placeholder="Describe why this certificate is needed..."
              className={`${inp(errors.reason)} resize-none`} />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>

          {/* Delivery Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Delivery Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['Download', 'Hard Copy'].map((opt) => (
                <button key={opt} type="button"
                  onClick={() => setForm((p) => ({ ...p, deliveryType: opt }))}
                  className={`py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all
                    ${form.deliveryType === opt
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-300'}`}>
                  {opt === 'Download' ? '⬇ Download PDF' : '📄 Hard Copy'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TABS     = ['Live', 'Completed', 'Cancelled', 'Detained'];
const PER_PAGE = 8;

// Backend now stores Live/Completed/Cancelled/Detained directly
const toTab = (status) => {
  if (['Live', 'Completed', 'Cancelled', 'Detained'].includes(status)) return status;
  return 'Live'; // fallback for any legacy values
};

// Normalize REST response → shape the table needs
const normalize = (s) => ({
  id:            String(s.id),
  usn:           s.student_id || `STU-${String(s.id).slice(-6).toUpperCase()}`,
  fullName:      s.name       || s.fullName || '—',
  status:        toTab(s.status || s.admissionStatus),
  rawStatus:     s.status     || s.admissionStatus,
  semester:      s.semester   || 1,
  program:       s.program    || '—',
  batch:         s.batch      || '—',
  department:    s.department || s.program || '—',
  phone:         s.phone         || '',
  email:         s.email         || '',
  personalEmail: s.personalEmail || '',
  address:       s.address       || '',
  createdAt:     s.createdAt,
});

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto
            ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {t.msg}
          <button onClick={() => remove(t.id)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, toast: add, remove };
}

// ─── Add Student Modal ────────────────────────────────────────────────────────
const EMPTY = { name: '', program: '', batch: '', status: 'Live', phone: '', personalEmail: '', address: '' };

function AddStudentModal({ onClose, onSaved, toast, programs = [], batches = [], statuses = [], configLoading = false }) {
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Full name is required';
    if (!form.program.trim()) e.program = 'Program is required';
    if (!form.batch.trim())   e.batch   = 'Batch is required';
    if (form.phone && !/^\+91\d{10}$/.test(form.phone)) e.phone = 'Format: +91XXXXXXXXXX';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    console.log('[AddStudent] submit clicked, form =', form);
    if (!validate()) { console.log('[AddStudent] validation failed'); return; }
    setSaving(true);
    try {
      const { data } = await apiCreateStudent(form);
      console.log('[AddStudent] API response:', data);
      toast('Student added successfully');
      onSaved(data.data);   // raw — parent normalizes once
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      console.error('[AddStudent] API error:', msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const inputCls = (err) =>
    `w-full px-3 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-slate-700 dark:text-white
     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
     ${err ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-slate-600'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleBackdrop}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add New Student</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" className={inputCls(errors.name)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Program */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Program <span className="text-red-500">*</span>
            </label>
            <select value={form.program} onChange={set('program')} className={inputCls(errors.program)}>
              <option value="">{configLoading ? '⏳ Loading...' : '— Select Program —'}</option>
              {programs.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.program && <p className="text-xs text-red-500 mt-1">{errors.program}</p>}
          </div>

          {/* Batch + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Batch <span className="text-red-500">*</span>
              </label>
              <select value={form.batch} onChange={set('batch')} className={inputCls(errors.batch)}>
                <option value="">{configLoading ? '⏳ Loading...' : '— Select Batch —'}</option>
                {batches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.batch && <p className="text-xs text-red-500 mt-1">{errors.batch}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls(false)}>
                {configLoading
                  ? <option value="">⏳ Loading...</option>
                  : statuses.map((s) => <option key={s} value={s}>{s}</option>)
                }
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Phone</label>
            <div className="flex">
              <span className="px-3 py-2.5 text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 border border-r-0 border-gray-300 dark:border-slate-600 rounded-l-lg font-mono select-none">
                +91
              </span>
              <input
                type="tel"
                value={form.phone.startsWith('+91') ? form.phone.slice(3) : form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setForm((prev) => ({ ...prev, phone: digits ? `+91${digits}` : '' }));
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="9876543210"
                maxLength={10}
                className={`flex-1 px-3 py-2.5 text-sm border rounded-r-lg bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-400' : 'border-gray-300 dark:border-slate-600'}`}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Personal Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Personal Email</label>
            <input type="email" value={form.personalEmail} onChange={set('personalEmail')} placeholder="e.g. rahul@gmail.com" className={inputCls(false)} />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Address</label>
            <input value={form.address} onChange={set('address')} placeholder="e.g. 123 Main St, Bengaluru" className={inputCls(false)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Phone Input (+91 prefix, digits only, 10 max) ───────────────────────────
function PhoneInput({ value, onChange }) {
  const [error, setError] = useState('');
  const digits = value?.startsWith('+91') ? value.slice(3) : (value || '');

  const handleInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    const full = raw ? `+91${raw}` : '';
    setError(raw.length > 0 && raw.length < 10 ? 'Enter exactly 10 digits' : '');
    onChange({ target: { name: 'phone', value: full } });
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
        Phone
      </label>
      <div className="flex">
        <span className="px-3 py-2.5 text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300
          border border-r-0 border-gray-300 dark:border-slate-600 rounded-l-lg font-mono select-none">
          +91
        </span>
        <input
          type="tel"
          value={digits}
          onChange={handleInput}
          placeholder="9876543210"
          maxLength={10}
          className={`flex-1 px-3 py-2.5 text-sm border rounded-r-lg
            bg-gray-50 dark:bg-slate-700 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-400' : 'border-gray-300 dark:border-slate-600'}`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {!error && digits.length === 10 && (
        <p className="text-xs text-green-600 mt-1">✓ +91{digits}</p>
      )}
    </div>
  );
}

// ─── Edit Student Modal ───────────────────────────────────────────────────────
function EditStudentModal({ student, onClose, onSaved, toast, programs = [], batches = [], statuses = [], configLoading = false }) {
  const [form, setForm]     = useState({
    name:    student.fullName || '',
    program: student.program  || '',
    batch:   student.batch    || '',
    status:  student.status   || 'Live',
    phone:   student.phone    || '',
    email:   student.email    || '',
    address: student.address  || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Name is required', 'error'); return; }

    setSaving(true);
    console.log('Calling UPDATE API', student.id, form);
    try {
      const { data } = await apiUpdateStudent(student.id, form);
      console.log('[EditModal] PUT response:', data);
      toast('Student updated successfully');
      onSaved(data.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      console.error('[EditModal] PUT error:', msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, name, placeholder, type = 'text', options = null) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {options ? (
        <select
          name={name} value={form[name]} onChange={handleChange}
          disabled={configLoading}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600
            bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:opacity-60 disabled:cursor-wait"
        >
          {configLoading
            ? <option value="">⏳ Loading...</option>
            : options.map((o) => <option key={o} value={o}>{o}</option>)
          }
        </select>
      ) : (
        <input
          type={type} name={name} value={form[name]} onChange={handleChange} placeholder={placeholder}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600
            bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleBackdrop}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Student</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-mono">{student.usn}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {field('Full Name *', 'name',    'e.g. Rahul Sharma')}
          {field('Program', 'program', '', 'text', programs)}
          {field('Batch',   'batch',   '', 'text', batches)}
          {field('Status',  'status',  '', 'text', statuses)}
          <PhoneInput value={form.phone || ''} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          {field('Email',      'email',    'e.g. student@email.com', 'email')}
          {field('Address',    'address',  'e.g. 123 Main St, City')}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-300 dark:border-slate-600
                text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white
                hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function DeleteDialog({ student, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Delete Student</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-5">
          Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">&quot;{student.fullName}&quot;</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Change Status Modal ──────────────────────────────────────────────────────
const STATUS_OPTIONS = ['Live', 'Completed', 'Cancelled', 'Detained']; // fallback

function ChangeStatusModal({ student, onClose, onSaved, toast, statuses = [] }) {
  const options = statuses.length ? statuses : STATUS_OPTIONS;
  const [status,  setStatus]  = useState(student.status || 'Live');
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === student.status) { onClose(); return; }
    console.log('[ChangeStatus] PUT /api/students/' + student.id + '/status', { status });
    setSaving(true);
    try {
      const res = await apiChangeStatus(student.id, status);
      console.log('[ChangeStatus] Response:', res.data);
      onSaved(res.data.data);
      toast(`Status updated to "${status}"`);
      onClose();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to update status', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <RefreshCw size={18} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Change Status</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{student.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Current status */}
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
          Current: <span className="font-semibold text-gray-700 dark:text-slate-300">{student.status}</span>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              New Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={`px-3 py-2.5 text-sm rounded-xl border font-medium transition-all ${
                    status === opt
                      ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                      : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-300 dark:border-slate-600
                text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving || status === student.status}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-orange-600 text-white
                hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 3-dot Actions Menu ───────────────────────────────────────────────────────
function ActionsMenu({ student, onView, onEdit, onDelete, onStatusChange, onCertRequest, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const actions = [
    { icon: Eye,       label: 'View Profile',       color: 'text-gray-700 dark:text-slate-300',   fn: () => { onView(student); onClose(); } },
    { icon: Pencil,    label: 'Edit Details',        color: 'text-blue-600 dark:text-blue-400',    fn: () => { onEdit(student); onClose(); } },
    { icon: Award,     label: 'Request Certificate', color: 'text-purple-600 dark:text-purple-400', fn: () => { onCertRequest(student); onClose(); } },
    { icon: RefreshCw, label: 'Change Status',       color: 'text-orange-600 dark:text-orange-400', fn: () => { console.log('[ChangeStatus] opening modal for:', student.fullName); onClose(); onStatusChange(student); } },
    { icon: Trash2,    label: 'Delete',              color: 'text-red-600 dark:text-red-400',      fn: () => { onDelete(student); onClose(); } },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-6 z-30 mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-sm"
    >
      {actions.map(({ icon: Icon, label, color, fn }) => (
        <button
          key={label}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[ActionsMenu] clicked:', label);
            fn();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${color}`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[10, 16, 28, 14, 8, 20, 14, 8].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3.5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-${w}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const navigate                        = useNavigate();
  const [students, setStudents]         = useState([]);
  const [activeTab, setActiveTab]       = useState('Live');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState([]);
  const [page, setPage]                 = useState(1);
  const [openMenu, setOpenMenu]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [total, setTotal]               = useState(0);
  const [refreshKey, setRefreshKey]     = useState(0);
  const [filterOpen, setFilterOpen]         = useState(false);
  const [filters, setFilters]               = useState({ program: '', batch: '' });
  const [filterPrograms, setFilterPrograms] = useState([]);
  const filterRef                           = useRef(null);
  const [tabCounts, setTabCounts]         = useState({ Live: 0, Completed: 0, Cancelled: 0, Detained: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [config, setConfig]           = useState({
    programs: ['B.E CSE','B.E ECE','B.E Civil','B.E Mechanical','B.E AI & ML','B.E Data Science','B.E Information Science','B.E EEE','CSE Design','CSE Business System'],
    batches:  ['2020–2024','2021–2025','2022–2026','2023–2027','2024–2028','2025–2029','2026–2030'],
    statuses: ['Live','Completed','Cancelled','Detained'],
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [statusTarget, setStatusTarget]   = useState(null);
  const [editTarget, setEditTarget]     = useState(null); // student being edited
  const [certReqTarget, setCertReqTarget] = useState(null); // student for cert request
  const [exporting, setExporting]           = useState(false);
  const [exportProgram, setExportProgram]   = useState('');
  const [exportingReport, setExportingReport] = useState(false);
  const { toasts, toast, remove }       = useToast();

  const debouncedSearch = useDebounce(search, 350);

  // ── Close filter on outside click or ESC ──
  useEffect(() => {
    if (!filterOpen) return;
    const onKey   = (e) => { if (e.key === 'Escape') setFilterOpen(false); };
    const onClick  = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [filterOpen]);

  const hasFilters      = filters.program || filters.batch;
  const removeFilter    = (key) => { setFilters((f) => ({ ...f, [key]: '' })); setPage(1); };
  const clearAllFilters = () => { setFilters({ program: '', batch: '' }); setPage(1); };

  // ── Fetch counts from backend (for tabs) ──
  const fetchCounts = useCallback(async () => {
    try {
      const { data } = await apiGetCounts();
      setTabCounts(data.data);
    } catch (err) {
      console.error('[Counts] Fetch error:', err.message);
    }
  }, []);

  // ── Fetch students from backend (real pagination, race-condition safe) ──
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = {
          status: activeTab,
          page,
          limit:  PER_PAGE,
          ...(debouncedSearch  && { q:       debouncedSearch }),
          ...(filters.program  && { program: filters.program }),
          ...(filters.batch    && { batch:   filters.batch }),
        };
        const { data } = await apiGetStudents(params);
        if (!cancelled) {
          setStudents((data.data || []).map(normalize));
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (!cancelled) toast('Failed to load students from server', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, debouncedSearch, filters.program, filters.batch, page, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 whenever tab / search / filters change
  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch, filters.program, filters.batch]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Fetch dropdown config from backend once on mount
  useEffect(() => {
    console.log('[Config] ⏳ Fetching GET /api/config ...');
    setConfigLoading(true);
    getAllConfig()
      .then(({ data }) => {
        console.log('[Config] ✅ Raw response:', data);
        console.log('[Config] programs:', data.data?.programs);
        console.log('[Config] batches :', data.data?.batches);
        console.log('[Config] statuses:', data.data?.statuses);
        setConfig(data.data);
      })
      .catch((err) => {
        console.error('[Config] ❌ Failed to fetch /api/config:', err.message);
        toast('Could not load dropdown config from server', 'error');
      })
      .finally(() => setConfigLoading(false));
  }, [toast]);

  // Fetch distinct programs from actual student data (for filter panel)
  useEffect(() => {
    apiGetDistinctPrograms()
      .then(({ data }) => setFilterPrograms(data.data || []))
      .catch(() => {});
  }, [refreshKey]);

  // ── Tab change ──
  const handleTabChange = (tab) => {
    console.log('[Tab] switched to:', tab);
    setActiveTab(tab);
    setPage(1);
    setSearch('');
    setSelected([]);
    // filters are intentionally preserved on tab switch
  };

  // ── Add student — switch to that tab and refetch ──
  const handleStudentAdded = (newStudent) => {
    const n = normalize(newStudent);
    setActiveTab(n.status);
    setPage(1);
    setRefreshKey((k) => k + 1);
    fetchCounts();
  };

  // ── Update student — refetch so filters/sort stay consistent ──
  const handleStudentUpdated = () => {
    setRefreshKey((k) => k + 1);
    fetchCounts();
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    console.log('[Delete] Deleting student:', deleteTarget.id, deleteTarget.fullName);
    setDeleting(true);
    try {
      await apiDeleteStudent(deleteTarget.id);
      toast(`"${deleteTarget.fullName}" deleted successfully`);
      setDeleteTarget(null);
      setPage(1);
      setRefreshKey((k) => k + 1);
      fetchCounts();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      console.error('[Delete] Error:', msg);
      toast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Export Live Students CSV (always status=Live, optional program filter) ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(exportProgram && { program: exportProgram }),
      };
      const response = await apiExportStudents(params);

      const disposition = response.headers['content-disposition'] || '';
      const match       = disposition.match(/filename="?([^"]+)"?/);
      const filename    = match ? match[1] : 'students_all_live.xlsx';

      const url = URL.createObjectURL(
        new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported "${filename}"`);
    } catch (err) {
      const msg = err.response?.status === 404
        ? 'No live students found for the selected branch'
        : 'Export failed — please try again';
      toast(msg, 'error');
    } finally {
      setExporting(false);
    }
  };

  // ── Full report export (all students, grouped by status, 5-sheet Excel) ──
  const handleExportReport = async () => {
    setExportingReport(true);
    try {
      const response = await apiExportFullReport();

      const disposition = response.headers['content-disposition'] || '';
      const match       = disposition.match(/filename="?([^"]+)"?/);
      const filename    = match ? match[1] : 'students_full_report.xlsx';

      const url = URL.createObjectURL(
        new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported "${filename}"`);
    } catch (err) {
      const msg = err.response?.status === 404
        ? 'No students found in the database'
        : 'Report export failed — please try again';
      toast(msg, 'error');
    } finally {
      setExportingReport(false);
    }
  };

  // ── Derived data ── (use config so options are always complete even after filtering)
  const programs = useMemo(() => config.programs, [config.programs]);
  const batches  = useMemo(() => config.batches,  [config.batches]);

  // Backend returns exactly one page of results; paginated === students from API
  const paginated  = students;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage   = Math.min(page, totalPages);

  const allChecked  = paginated.length > 0 && paginated.every((s) => selected.includes(s.id));
  const someChecked = paginated.some((s) => selected.includes(s.id)) && !allChecked;
  const toggleAll   = () => setSelected(allChecked ? selected.filter((id) => !paginated.find((s) => s.id === id)) : [...new Set([...selected, ...paginated.map((s) => s.id)])]);
  const toggleOne   = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <>
      <Toast toasts={toasts} remove={remove} />

      {/* Modals */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleStudentAdded}
          toast={toast}
          programs={config.programs}
          batches={config.batches}
          statuses={config.statuses}
          configLoading={configLoading}
        />
      )}
      {editTarget && (
        <EditStudentModal
          student={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleStudentUpdated}
          toast={toast}
          programs={config.programs}
          batches={config.batches}
          statuses={config.statuses}
          configLoading={configLoading}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          student={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
      {certReqTarget && (
        <CertificateRequestModal
          student={certReqTarget}
          onClose={() => setCertReqTarget(null)}
          toast={toast}
        />
      )}
      {statusTarget && (
        <ChangeStatusModal
          student={statusTarget}
          onClose={() => setStatusTarget(null)}
          onSaved={() => {
            setPage(1);
            setRefreshKey((k) => k + 1);
            fetchCounts();
          }}
          toast={toast}
          statuses={config.statuses}
        />
      )}

      <div className="p-6 space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Home / Admissions / Students</p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          </div>

        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`rounded-xl p-4 text-left border transition-all cursor-pointer
                ${activeTab === tab
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
            >
              <p className={`text-2xl font-bold ${activeTab === tab ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {tabCounts[tab]}
              </p>
              <p className={`text-xs mt-0.5 font-medium ${activeTab === tab ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'}`}>
                {tab}
              </p>
            </button>
          ))}
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search ${activeTab.toLowerCase()} students...`}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Bulk actions — shown only when rows are selected */}
              {selected.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                    {selected.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${selected.length} student(s)?`)) return;
                      const results = await Promise.allSettled(
                        selected.map((id) => apiDeleteStudent(id))
                      );
                      const succeeded = selected.filter((_, i) => results[i].status === 'fulfilled');
                      const failed    = selected.length - succeeded.length;
                      setSelected([]);
                      setPage(1);
                      setRefreshKey((k) => k + 1);
                      fetchCounts();
                      if (succeeded.length) toast(`${succeeded.length} student(s) deleted`);
                      if (failed)           toast(`${failed} delete(s) failed`, 'error');
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="text-xs text-gray-500 dark:text-slate-400 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* ── Filter button + persistent panel ── */}
              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors cursor-pointer
                    ${filterOpen
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <SlidersHorizontal size={15} />
                  Filter
                  {hasFilters && (
                    <span className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1
                      ${filterOpen ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                      {[filters.program, filters.batch].filter(Boolean).length}
                    </span>
                  )}
                </button>

                {filterOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">

                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">Filters</span>
                      {hasFilters && (
                        <button type="button" onClick={clearAllFilters}
                          className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="p-3 space-y-4 max-h-[70vh] overflow-y-auto">

                      {/* Program */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Program</p>
                        <div className="space-y-0.5">
                          {filterPrograms.length === 0 && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 px-3 py-2">No programs found</p>
                          )}
                          {filterPrograms.map((p) => {
                            const active = filters.program === p;
                            return (
                              <button key={p} type="button"
                                onClick={() => { setFilters((f) => ({ ...f, program: active ? '' : p })); setPage(1); }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                                  ${active
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                              >
                                <span>{p}</span>
                                {active && (
                                  <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Batch */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Batch</p>
                        <div className="space-y-0.5">
                          {batches.map((b) => {
                            const active = filters.batch === b;
                            return (
                              <button key={b} type="button"
                                onClick={() => { setFilters((f) => ({ ...f, batch: active ? '' : b })); setPage(1); }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                                  ${active
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                              >
                                <span>{b}</span>
                                {active && (
                                  <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Panel footer — close */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                      <button type="button" onClick={() => setFilterOpen(false)}
                        className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Full Report: all students by status ── */}
              <button
                onClick={handleExportReport}
                disabled={exportingReport}
                title="Export all students grouped by status (Live / Completed / Cancelled / Detained)"
                className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {exportingReport ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={15} className="flex-shrink-0" />
                    Full Report
                  </>
                )}
              </button>

              {/* ── Export Live Students: branch select + button grouped ── */}
              <div className="flex items-center rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
                <select
                  value={exportProgram}
                  onChange={(e) => setExportProgram(e.target.value)}
                  disabled={exporting}
                  className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 border-r border-gray-200 dark:border-slate-600 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Branches</option>
                  {programs.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  title="Export Live students to CSV"
                  className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {exporting ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={15} className="flex-shrink-0" />
                      Export Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Active filter chips ── */}
          {hasFilters && (
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 dark:border-slate-700 flex-wrap">
              <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">Active filters:</span>
              {filters.program && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {filters.program}
                  <button type="button" onClick={() => removeFilter('program')} className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              )}
              {filters.batch && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                  {filters.batch}
                  <button type="button" onClick={() => removeFilter('batch')} className="hover:text-purple-900 dark:hover:text-purple-100 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              )}
              <button type="button" onClick={clearAllFilters}
                className="text-[11px] text-red-500 hover:text-red-600 font-medium ml-1 transition-colors">
                Clear all
              </button>
            </div>
          )}

          {/* Tab strip */}
          <div className="flex items-center border-b border-gray-100 dark:border-slate-700 px-5 gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer
                  ${activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                  }`}
              >
                {tab}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50">
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  {['USN', 'Full Name', 'Status', 'Sem', 'Program', 'Batch', ''].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : paginated.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500">
                            <Search size={32} className="opacity-30" />
                            <p className="font-medium text-sm">
                              {students.length === 0 ? 'No students yet' : 'No students found'}
                            </p>
                            <p className="text-xs">
                              {students.length === 0
                                ? 'Click "Add Student" to create the first record'
                                : 'Try adjusting your search or filter'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )
                    : paginated.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/admin/admissions/students/${s.id}`)}
                        className={`group hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer
                          ${selected.includes(s.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.includes(s.id)}
                            onChange={() => toggleOne(s.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                          {s.usn}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {s.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{s.fullName}</p>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500">{s.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 text-xs font-semibold">
                            {s.semester}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 dark:text-slate-300 whitespace-nowrap">{s.program}</td>
                        <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">{s.batch}</td>
                        <td className="px-4 py-3.5 relative">
                          {/* ✅ FIX: ⋮ button is now always visible, not hidden behind opacity-0 */}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); console.log('[Menu] opened for:', s.fullName); setOpenMenu((v) => (v === s.id ? null : s.id)); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenu === s.id && (
                            <ActionsMenu
                              student={s}
                              onView={(st) => navigate(`/admin/admissions/students/${st.id}`)}
                              onEdit={(st) => { setOpenMenu(null); setEditTarget(st); }}
                              onDelete={(st) => setDeleteTarget(st)}
                              onStatusChange={(st) => setStatusTarget(st)}
                              onCertRequest={(st) => { setOpenMenu(null); setCertReqTarget(st); }}
                              onClose={() => setOpenMenu(null)}
                            />
                          )}
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Showing{' '}
                <span className="font-semibold text-gray-700 dark:text-slate-300">
                  {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, total)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-gray-700 dark:text-slate-300">{total}</span> students
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${p === safePage ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
