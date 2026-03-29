import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentById as apiGetStudentById, updateStudent as apiUpdateStudent } from '../services/studentApi';
import { getAllConfig } from '../services/configApi';
import {
  ArrowLeft, Pencil, Save, X, User, Mail, Phone,
  MapPin, BookOpen, Calendar, Hash, CheckCircle, AlertCircle, GraduationCap,
  Award, Download, Plus, Loader2,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import {
  getCertificatesByStudent, getTemplates,
  issueCertificate, downloadCertificate, submitCertificateRequest,
} from '../services/admissionsApi';


// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDismiss }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium
      ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
      <button onClick={onDismiss}><X size={14} className="ml-2 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function Field({ icon: Icon, label, value, editMode, name, onChange, type = 'text', options, readOnly }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        {editMode && !readOnly ? (
          options ? (
            <select name={name} value={value || ''} onChange={onChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={type} name={name} value={value || ''} onChange={onChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          )
        ) : (
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            {value || <span className="text-gray-400 dark:text-slate-500 italic font-normal">Not provided</span>}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Phone Field ──────────────────────────────────────────────────────────────
function PhoneField({ value, editMode, onChange }) {
  const [error, setError] = useState('');
  const digits = value?.startsWith('+91') ? value.slice(3) : (value || '');
  const handleInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    const full = raw ? `+91${raw}` : '';
    setError(raw.length > 0 && raw.length < 10 ? 'Enter exactly 10 digits' : '');
    onChange({ target: { name: 'phone', value: full } });
  };
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 dark:border-slate-700">
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Phone size={15} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Phone</p>
        {editMode ? (
          <div>
            <div className="flex">
              <span className="px-3 py-2.5 text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 border border-r-0 border-gray-300 dark:border-slate-600 rounded-l-lg font-mono select-none">+91</span>
              <input type="tel" value={digits} onChange={handleInput} placeholder="9876543210" maxLength={10}
                className={`flex-1 px-3 py-2.5 text-sm border rounded-r-lg bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-gray-300 dark:border-slate-600'}`} />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            {!error && digits.length === 10 && <p className="text-xs text-green-600 mt-1">✓ +91{digits}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            {value || <span className="text-gray-400 italic font-normal">Not provided</span>}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Info Card ────────────────────────────────────────────────────────────────
function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value || '—'}</p>
    </div>
  );
}

const TABS = ['Summary', 'Certificates', 'Forms'];

// ─── Profile Page ─────────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [student, setStudent]   = useState(null);
  const [form, setForm]         = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState({ msg: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('Summary');

  // ── Certificates tab state ─────────────────────────────────────────────────
  const [studentCerts,    setStudentCerts]    = useState([]);
  const [certsLoading,    setCertsLoading]    = useState(false);
  const [templates,       setTemplates]       = useState([]);
  const [showIssueModal,  setShowIssueModal]  = useState(false);
  const [selTemplate,     setSelTemplate]     = useState('');
  const [fieldValues,     setFieldValues]     = useState({});
  const [issuing,         setIssuing]         = useState(false);
  const [dlId,            setDlId]            = useState(null);
  const [showCertReqModal, setShowCertReqModal] = useState(false);
  const [certReqForm, setCertReqForm]           = useState({ templateId: '', reason: '', deliveryType: 'Download' });
  const [certReqErrors, setCertReqErrors]       = useState({});
  const [certReqSubmitting, setCertReqSubmitting] = useState(false);
  const [config, setConfig]     = useState({
    programs: ['B.E CSE','B.E ECE','B.E Civil','B.E Mechanical','B.E AI & ML','B.E Data Science','B.E Information Science','B.E EEE','CSE Design','CSE Business System'],
    batches:  ['2020–2024','2021–2025','2022–2026','2023–2027','2024–2028','2025–2029','2026–2030'],
    statuses: ['Live','Completed','Cancelled','Detained'],
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    setLoading(true);
    apiGetStudentById(id)
      .then(({ data }) => { setStudent(data.data); setForm(data.data); })
      .catch(() => showToast('Failed to load student profile', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getAllConfig()
      .then(({ data }) => { if (data.data?.programs?.length) setConfig(data.data); })
      .catch(() => {});
  }, []);

  // ── Load certificates + templates when student is known ───────────────────
  const loadCerts = useCallback(async (usn) => {
    if (!usn) return;
    setCertsLoading(true);
    try {
      const { data } = await getCertificatesByStudent(usn);
      setStudentCerts(data.data || []);
    } catch { /* silent */ }
    finally { setCertsLoading(false); }
  }, []);

  useEffect(() => {
    if (student?.student_id) loadCerts(student.student_id);
  }, [student, loadCerts]);

  useEffect(() => {
    getTemplates()
      .then(({ data }) => setTemplates(data.data || []))
      .catch(() => {});
  }, []);

  // Build student auto-fill map — single source of truth
  // All keys listed here are auto-populated by backend; they will NOT appear
  // as manual input fields in the Issue Certificate modal.
  const studentAutoFill = student ? {
    student_name:      student.name      || '',
    name:              student.name      || '',
    full_name:         student.name      || '',
    usn:               student.student_id || '',
    student_id:        student.student_id || '',
    roll_no:           student.student_id || '',
    program:           student.program   || '',
    program_name:      student.program   || '',
    program_full_name: student.program   || '',   // backend expands to full name
    branch:            student.program   || '',
    current_branch:    student.program   || '',
    course:            student.program   || '',
    degree:            student.degree    || '',
    department:        student.department || student.program || '',
    semester:          student.semester  ? String(student.semester) : '',
    current_sem:       student.semester  ? String(student.semester) : '',
    current_term:      student.semester  ? `Semester ${student.semester}` : '',
    term:              student.semester  ? `Semester ${student.semester}` : '',
    academic_year:     student.batch     || '',
    year_of_study:     student.batch     || '',
    current_year:      student.batch     || '',
    batch:             student.batch     || '',
    email:             student.email     || '',
    phone:             student.phone     || '',
    address:           student.address   || '',
    place:             student.address   ? student.address.split(',').pop().trim() : '',
    status:            student.status    || '',
    admission_status:  student.status    || '',
    // Fields backend can fill but frontend doesn't have — still mark as known
    // so they don't appear as manual inputs (backend fills from student record)
    father_name:       '',
    date_of_birth:     '',
    dob:               '',
    current_date:      '',   // backend generates today's date
  } : {};

  // Auto-fill field values when template changes
  useEffect(() => {
    const tmpl = templates.find((t) => t._id === selTemplate);
    if (!tmpl) { setFieldValues({}); return; }
    const defaults = {};
    tmpl.fields.forEach((f) => {
      defaults[f.key] = studentAutoFill[f.key] ?? '';
    });
    setFieldValues(defaults);
  }, [selTemplate, templates, student]); // eslint-disable-line

  const handleIssue = async () => {
    if (!selTemplate) { showToast('Please select a template', 'error'); return; }
    setIssuing(true);
    try {
      const { data } = await issueCertificate({
        studentName: student.name,
        usn:         student.student_id,
        templateId:  selTemplate,
        fieldValues,
      });
      setStudentCerts((p) => [data.data, ...p]);
      setShowIssueModal(false);
      setSelTemplate('');
      setFieldValues({});
      showToast('Certificate issued successfully');
    } catch (err) {
      const apiErr = err.response?.data;
      if (apiErr?.eligibilityErrors?.length) {
        showToast(`Blocked: ${apiErr.eligibilityErrors.join(' · ')}`, 'error');
      } else {
        showToast(apiErr?.error || 'Failed to issue certificate', 'error');
      }
    } finally { setIssuing(false); }
  };

  const canDownload = (cert) => cert.status === 'Approved' || cert.status === 'Generated';

  const handleDownloadCert = async (cert) => {
    if (!canDownload(cert)) return;
    setDlId(cert._id);
    try {
      const response = await downloadCertificate(cert._id);
      setStudentCerts((p) => p.map((c) =>
        c._id === cert._id ? { ...c, status: 'Generated', generatedDate: new Date().toISOString() } : c
      ));
      const filename = `${cert.type.replace(/\s+/g, '_')}_${cert.usn}.pdf`;
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded "${filename}"`);
    } catch (err) {
      const msg = err?.response?.data?.error || 'PDF generation failed';
      showToast(msg, 'error');
    }
    finally { setDlId(null); }
  };

  const handleCertReqSubmit = async () => {
    const e = {};
    if (!certReqForm.templateId) e.templateId = 'Required';
    if (!certReqForm.reason.trim())   e.reason = 'Required';
    setCertReqErrors(e);
    if (Object.keys(e).length) return;
    setCertReqSubmitting(true);
    try {
      await submitCertificateRequest({
        studentName:     student.name,
        usn:             student.student_id,
        templateId:      certReqForm.templateId,
        certificateType: templates.find((t) => t._id === certReqForm.templateId)?.name || certReqForm.templateId,
        reason:          certReqForm.reason.trim(),
        deliveryType:    certReqForm.deliveryType,
      });
      showToast('Certificate request submitted successfully');
      setShowCertReqModal(false);
      setCertReqForm({ templateId: '', reason: '', deliveryType: 'Download' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Submission failed', 'error');
    } finally { setCertReqSubmitting(false); }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await apiUpdateStudent(id, {
        name: form.name, program: form.program, degree: form.degree,
        batch: form.batch, status: form.status, phone: form.phone,
        address: form.address, personalEmail: form.personalEmail,
        isDebarred:  form.isDebarred,
        feesCleared: form.feesCleared,
      });
      setStudent(data.data); setForm(data.data); setEditMode(false);
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-slate-400">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-slate-400 text-lg">Student not found.</p>
        <button onClick={() => navigate('/admin/admissions/students')} className="mt-4 text-blue-600 text-sm hover:underline">
          ← Back to Students
        </button>
      </div>
    );
  }

  const initials = student.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast({ msg: '' })} />

      <div className="p-6 max-w-4xl mx-auto space-y-5">

        {/* Back */}
        <button onClick={() => navigate('/admin/admissions/students')}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ArrowLeft size={16} /> Back to Students
        </button>

        {/* ── Hero Card ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{student.name}</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-mono mt-0.5">{student.student_id}</p>
                <div className="mt-2">
                  <StatusBadge status={student.status} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {editMode ? (
                <>
                  <button onClick={() => { setForm(student); setEditMode(false); }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <X size={15} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                    <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowCertReqModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                    <Award size={15} /> Request Certificate
                  </button>
                  <button onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    <Pencil size={15} /> Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            <InfoCard label="Degree"       value={student.degree || '—'} />
            <InfoCard label="Program"      value={student.program} />
            <InfoCard label="Batch"        value={student.batch} />
            <InfoCard label="Term" value={student.semester != null ? `Term ${student.semester}` : '—'} />
            <InfoCard label="Status"       value={student.status} />
            <InfoCard label="Quota"        value={student.quota || 'General'} />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-slate-700 px-4">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'Summary' && (
              <div className="space-y-6">
                {/* Student Details */}
                <div>
                  <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Student Details</h2>
                  <Field icon={User}         label="Full Name"    name="name"       value={form.name}       editMode={editMode} onChange={handleChange} />
                  <Field icon={Hash}         label="USN"          name="student_id" value={form.student_id} editMode={false}    onChange={handleChange} readOnly />
                  <Field icon={BookOpen}     label="Program"      name="program"    value={form.program}    editMode={editMode} onChange={handleChange} options={config.programs} />
                  <Field icon={GraduationCap} label="Degree"     name="degree"     value={form.degree}     editMode={editMode} onChange={handleChange} options={['BE', 'B.Tech', 'ME', 'M.Tech', 'MBA', 'MCA', 'BCA', 'B.Sc', 'M.Sc', 'PhD']} />
                  <Field icon={Calendar}     label="Batch"        name="batch"      value={form.batch}      editMode={editMode} onChange={handleChange} options={config.batches} />
                  <Field icon={CheckCircle}  label="Status"       name="status"     value={form.status}     editMode={editMode} onChange={handleChange} options={config.statuses} />
                  <Field icon={GraduationCap} label="Term (assigned at admission)" name="semester" value={student.semester != null ? `Term ${student.semester}` : '—'} editMode={false} onChange={handleChange} readOnly />
                </div>

                {/* Eligibility */}
                <div>
                  <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Certificate Eligibility</h2>
                  <div className="space-y-3">
                    {/* Fees Cleared toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${form.feesCleared ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                          <CheckCircle size={15} className={form.feesCleared ? 'text-green-600' : 'text-red-500'} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Fees Cleared</p>
                          <p className={`text-sm font-medium mt-0.5 ${form.feesCleared ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {form.feesCleared ? 'All fees cleared' : 'Outstanding dues pending'}
                          </p>
                        </div>
                      </div>
                      {editMode && (
                        <button type="button"
                          onClick={() => setForm((p) => ({ ...p, feesCleared: !p.feesCleared }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                            ${form.feesCleared ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.feesCleared ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      )}
                    </div>
                    {/* Debarred toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${form.isDebarred ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                          <AlertCircle size={15} className={form.isDebarred ? 'text-red-500' : 'text-green-600'} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Debarment Status</p>
                          <p className={`text-sm font-medium mt-0.5 ${form.isDebarred ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                            {form.isDebarred ? 'Debarred — certificates blocked' : 'Not debarred'}
                          </p>
                        </div>
                      </div>
                      {editMode && (
                        <button type="button"
                          onClick={() => setForm((p) => ({ ...p, isDebarred: !p.isDebarred }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                            ${form.isDebarred ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isDebarred ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      )}
                    </div>
                    {/* Warning banner when ineligible */}
                    {(form.isDebarred || !form.feesCleared) && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-400">
                          Certificate issuance is <strong>blocked</strong> for this student.
                          {form.isDebarred && ' Debarment active.'}
                          {!form.feesCleared && ' Fees not cleared.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Contact Information</h2>
                  <Field icon={Mail}  label="College Email (auto-generated)" name="email"         value={form.email}         editMode={false}    onChange={handleChange} type="email" readOnly />
                  <Field icon={Mail}  label="Personal Email"                 name="personalEmail" value={form.personalEmail} editMode={editMode} onChange={handleChange} type="email" />
                  <PhoneField value={form.phone || ''} editMode={editMode} onChange={handleChange} />
                  <Field icon={MapPin} label="Address" name="address" value={form.address} editMode={editMode} onChange={handleChange} />
                </div>

                <p className="text-xs text-gray-400 dark:text-slate-500 text-center pt-2">
                  Record created: {student.createdAt ? new Date(student.createdAt).toLocaleString() : '—'}
                </p>
              </div>
            )}

            {activeTab === 'Certificates' && (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                    {studentCerts.length} certificate{studentCerts.length !== 1 ? 's' : ''} issued
                  </p>
                  <button onClick={() => setShowIssueModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    <Plus size={15} /> Issue Certificate
                  </button>
                </div>

                {/* Certificate list */}
                {certsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : studentCerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-500">
                    <Award size={36} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">No certificates issued yet</p>
                    <p className="text-xs mt-1">Click "Issue Certificate" to generate one</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-900/50">
                          {['Name', 'Requested', 'Generated', 'Status', 'Action'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {studentCerts.map((c) => (
                          <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.type}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(c.requestedDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {c.generatedDate ? new Date(c.generatedDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                                ${c.status === 'Generated' ? 'bg-green-100 text-green-700' :
                                  c.status === 'Approved'  ? 'bg-blue-100  text-blue-700'  :
                                  c.status === 'Rejected'  ? 'bg-red-100   text-red-600'   :
                                                             'bg-amber-100 text-amber-700'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleDownloadCert(c)}
                                disabled={dlId === c._id || !canDownload(c)}
                                title={
                                  c.status === 'Rejected' ? 'Certificate rejected — cannot download' :
                                  !canDownload(c)         ? 'Awaiting approval before download' : 'Download PDF'
                                }
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                                  ${canDownload(c)
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                                  }`}
                              >
                                {dlId === c._id
                                  ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                  : <Download size={13} />
                                }
                                PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Issue Certificate Modal */}
                {showIssueModal && (() => {
                  const tmpl = templates.find((t) => t._id === selTemplate);
                  return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                      onClick={(e) => { if (e.target === e.currentTarget) setShowIssueModal(false); }}>
                      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Award size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Issue Certificate</h3>
                              <p className="text-xs text-gray-400 dark:text-slate-500">{student.name} · {student.student_id}</p>
                            </div>
                          </div>
                          <button onClick={() => setShowIssueModal(false)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                            <X size={18} />
                          </button>
                        </div>

                        {/* Modal body — scrollable */}
                        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                          {/* Template selector */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                              Select Template <span className="text-red-500">*</span>
                            </label>
                            <select value={selTemplate} onChange={(e) => setSelTemplate(e.target.value)}
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">— Select a template —</option>
                              {templates.filter((t) => t.status === 'LIVE').map((t) => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Only show fields that are NOT in the student profile */}
                          {tmpl?.fields?.length > 0 && (() => {
                            const manualFields = tmpl.fields.filter((f) => !(f.key in studentAutoFill));
                            return manualFields.length > 0 ? (
                              <div className="space-y-3">
                                {manualFields.map((f) => (
                                  <div key={f.key}>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                                      {f.name}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                                    </label>
                                    <input
                                      type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                                      value={fieldValues[f.key] || ''}
                                      onChange={(e) => setFieldValues((p) => ({ ...p, [f.key]: e.target.value }))}
                                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : null;
                          })()}

                          {selTemplate && !tmpl?.fields?.length && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3">
                              This template has no dynamic fields. The certificate will use the pre-written notes as-is.
                            </p>
                          )}
                        </div>

                        {/* Modal footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
                          <button onClick={() => setShowIssueModal(false)}
                            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 transition-colors">
                            Cancel
                          </button>
                          <button onClick={handleIssue} disabled={issuing || !selTemplate}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                            {issuing ? 'Issuing...' : 'Issue Certificate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'Forms' && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-500">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm font-medium">No forms submitted yet</p>
                <p className="text-xs mt-1">Submitted forms will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Certificate Request Modal ── */}
      {showCertReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCertReqModal(false); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Award size={16} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Request Certificate</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{student.name} · {student.student_id}</p>
                </div>
              </div>
              <button onClick={() => setShowCertReqModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Certificate Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Certificate Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={certReqForm.templateId}
                  onChange={(e) => setCertReqForm((p) => ({ ...p, templateId: e.target.value }))}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500
                    ${certReqErrors.certificateType ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'}`}>
                  <option value="">— Select Certificate —</option>
                  {templates.filter((t) => t.status === 'LIVE').map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                {certReqErrors.templateId && <p className="text-xs text-red-500 mt-1">{certReqErrors.templateId}</p>}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={certReqForm.reason}
                  onChange={(e) => setCertReqForm((p) => ({ ...p, reason: e.target.value }))}
                  rows={3}
                  placeholder="Describe why this certificate is needed..."
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none
                    ${certReqErrors.reason ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'}`}
                />
                {certReqErrors.reason && <p className="text-xs text-red-500 mt-1">{certReqErrors.reason}</p>}
              </div>

              {/* Delivery Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Delivery Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Download', 'Hard Copy'].map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setCertReqForm((p) => ({ ...p, deliveryType: opt }))}
                      className={`py-2.5 text-sm font-medium rounded-xl border transition-colors
                        ${certReqForm.deliveryType === opt
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-purple-400'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700">
              <button onClick={() => { setShowCertReqModal(false); setCertReqForm({ templateId: '', reason: '', deliveryType: 'Download' }); setCertReqErrors({}); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleCertReqSubmit} disabled={certReqSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition-colors">
                {certReqSubmitting
                  ? <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                  : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
