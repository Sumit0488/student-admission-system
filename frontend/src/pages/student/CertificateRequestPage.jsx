import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  AlertCircle,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  submitCertificateRequest,
  getStudentRequests,
  downloadCertificate,
  getTemplates,
} from '../../services/admissionsApi';
import { getStudentByUSN } from '../../services/studentApi';

// ── Eligibility rules per certificate type ────────────────────────────────────
// Each rule: { label, test(student) → true = PASS }
const ELIGIBILITY_RULES = {
  Bonafide: [
    { label: 'Must be an active (Live) student', test: (s) => s.status === 'Live' },
    { label: 'Must not be debarred', test: (s) => !s.isDebarred },
    { label: 'All fees must be cleared', test: (s) => s.feesCleared !== false },
  ],
  Study: [
    { label: 'Must be currently studying (Live)', test: (s) => s.status === 'Live' },
    { label: 'Must not be debarred', test: (s) => !s.isDebarred },
    { label: 'All fees must be cleared', test: (s) => s.feesCleared !== false },
  ],
  Transfer: [
    {
      label: 'All fees must be cleared before Transfer Certificate is issued',
      test: (s) => s.feesCleared !== false,
    },
    { label: 'Must not be debarred', test: (s) => !s.isDebarred },
  ],
  Conduct: [
    { label: 'Must be an active (Live) student', test: (s) => s.status === 'Live' },
    { label: 'Must not be debarred', test: (s) => !s.isDebarred },
  ],
  'Course Completion': [
    { label: 'Course must be completed', test: (s) => s.status === 'Completed' },
    { label: 'All fees must be cleared', test: (s) => s.feesCleared !== false },
  ],
};

// Map a template name to the closest known cert type key (case-insensitive partial match)
function resolveCertType(templateName) {
  if (!templateName) return null;
  const lower = templateName.toLowerCase();
  for (const key of Object.keys(ELIGIBILITY_RULES)) {
    if (lower.includes(key.toLowerCase())) return key;
  }
  return null;
}

// Returns { eligible: bool, failedChecks: string[] } for a given student + template name
function checkEligibility(student, templateName) {
  if (!student) return { eligible: false, failedChecks: ['Student record not found'] };
  const certType = resolveCertType(templateName);
  if (!certType) return { eligible: true, failedChecks: [] }; // unknown type → allow
  const failed = ELIGIBILITY_RULES[certType].filter((r) => !r.test(student)).map((r) => r.label);
  return { eligible: failed.length === 0, failedChecks: failed };
}

const STATUS_STYLE = {
  Pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  Approved: 'bg-green-100 text-green-700 border border-green-200',
  Rejected: 'bg-red-100   text-red-700   border border-red-200',
};
const STATUS_ICON = {
  Pending: <Clock size={12} />,
  Approved: <CheckCircle size={12} />,
  Rejected: <XCircle size={12} />,
};

const EMPTY_FORM = {
  templateId: '',
  reason: '',
  deliveryType: 'Download',
  additionalNotes: '',
};

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
    >
      {type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

export default function CertificateRequestPage() {
  // Dynamic certificate types from live templates
  const [certTypes, setCertTypes] = useState([]);
  useEffect(() => {
    getTemplates()
      .then(({ data }) => setCertTypes((data.data || []).filter((t) => t.status === 'LIVE')))
      .catch(() => {});
  }, []);

  // Lookup state
  const [usnInput, setUsnInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [activeUsn, setActiveUsn] = useState('');
  const [activeName, setActiveName] = useState('');

  // Student record fetched on USN lookup (used for eligibility checks)
  const [studentRecord, setStudentRecord] = useState(null);

  // Requests list
  const [requests, setRequests] = useState([]);

  // New request modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Eligibility for the currently selected template
  const eligibility = (() => {
    if (!form.templateId || !studentRecord) return null;
    const tmpl = certTypes.find((t) => t._id === form.templateId);
    return checkEligibility(studentRecord, tmpl?.name || '');
  })();

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleLookup = async (e) => {
    e.preventDefault();
    const usn = usnInput.trim().toUpperCase();
    const name = nameInput.trim();
    if (!usn) {
      setLookupError('Please enter your USN');
      return;
    }
    if (!name) {
      setLookupError('Please enter your name');
      return;
    }
    setLookupError('');
    setLookupLoading(true);
    try {
      const [{ data }, student] = await Promise.all([
        getStudentRequests(usn),
        getStudentByUSN(usn).catch(() => null),
      ]);
      setRequests(data.data || []);
      setStudentRecord(student);
      setActiveUsn(usn);
      setActiveName(name);
      setLookupDone(true);
    } catch {
      setLookupError('Failed to load requests. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const set = (f) => (e) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    setFormErrors((p) => ({ ...p, [f]: '' }));
  };

  const validateForm = () => {
    const e = {};
    if (!form.templateId) e.templateId = 'Required';
    if (!form.reason.trim()) e.reason = 'Required';
    if (eligibility && !eligibility.eligible) e.eligibility = 'Not eligible for this certificate';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        studentName: activeName,
        usn: activeUsn,
        templateId: form.templateId,
        certificateType: certTypes.find((t) => t._id === form.templateId)?.name || form.templateId,
        reason: form.reason.trim(),
        deliveryType: form.deliveryType,
        additionalNotes: form.additionalNotes.trim(),
      };
      console.log('Sending request:', payload);
      const { data } = await submitCertificateRequest(payload);
      console.log('Request response:', data);
      setRequests((p) => [data.data, ...p]);
      showToast('Certificate request submitted!');
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      showToast(err.response?.data?.error || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (req) => {
    if (!req.certificateRef) return;
    try {
      const res = await downloadCertificate(req.certificateRef);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${req.certificateType.replace(/\s+/g, '_')}_${req.usn}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Download failed', 'error');
    }
  };

  const inp = (err) =>
    `w-full px-3 py-2.5 text-sm rounded-lg border
     ${err ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
     focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50">
          <Toast msg={toast.msg} type={toast.type} />
        </div>
      )}

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Request a Certificate</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeName} · {activeUsn}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                  setFormErrors({});
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Certificate Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.templateId}
                  onChange={set('templateId')}
                  className={inp(formErrors.templateId)}
                >
                  <option value="">— Select Certificate —</option>
                  {certTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {formErrors.templateId && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.templateId}</p>
                )}
              </div>

              {/* Eligibility banner — shown once a cert type is selected */}
              {eligibility && (
                <div
                  className={`rounded-xl border px-4 py-3 flex items-start gap-3
                  ${
                    eligibility.eligible
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {eligibility.eligible ? (
                    <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-semibold ${eligibility.eligible ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {eligibility.eligible
                        ? 'You are eligible for this certificate'
                        : 'Not eligible for this certificate'}
                    </p>
                    {eligibility.failedChecks.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {eligibility.failedChecks.map((r) => (
                          <li key={r} className="text-xs text-red-600 flex items-start gap-1.5">
                            <XCircle size={11} className="shrink-0 mt-0.5" /> {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={set('reason')}
                  rows={3}
                  placeholder="Describe why you need this certificate..."
                  className={`${inp(formErrors.reason)} resize-none`}
                />
                {formErrors.reason && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.reason}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Delivery Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Download', 'Hard Copy'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, deliveryType: opt }))}
                      className={`py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all
                        ${
                          form.deliveryType === opt
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                    >
                      {opt === 'Download' ? '⬇ Download PDF' : '📄 Hard Copy'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.additionalNotes}
                  onChange={set('additionalNotes')}
                  rows={2}
                  placeholder="Any additional information..."
                  className={`${inp(false)} resize-none`}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm(EMPTY_FORM);
                    setFormErrors({});
                  }}
                  className="flex-1 py-2.5 text-sm rounded-xl border border-gray-300 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (eligibility !== null && !eligibility.eligible)}
                  title={
                    eligibility && !eligibility.eligible
                      ? 'Not eligible for this certificate'
                      : undefined
                  }
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">EduAdmin Institute</p>
            <h1 className="text-sm font-bold text-gray-900 leading-none">
              Certificate Request Portal
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* ── Lookup Card ───────────────────────────────────────────────────────── */}
        {!lookupDone ? (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
                <FileText size={30} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">My Certificate Requests</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your USN and name to view or submit certificate requests
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    USN <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={usnInput}
                    onChange={(e) => {
                      setUsnInput(e.target.value);
                      setLookupError('');
                    }}
                    placeholder="e.g. 1RV21CS001"
                    className={inp(false) + ' uppercase'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setLookupError('');
                    }}
                    placeholder="Enter your full name"
                    className={inp(false)}
                  />
                </div>
                {lookupError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle size={13} /> {lookupError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {lookupLoading ? (
                    'Loading…'
                  ) : (
                    <>
                      <Search size={15} /> View My Requests
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ── Requests Dashboard ──────────────────────────────────────────────── */
          <div className="space-y-6">
            {/* Greeting + actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Hello, {activeName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  USN: <span className="font-mono font-semibold text-blue-600">{activeUsn}</span>
                  <button
                    onClick={() => {
                      setLookupDone(false);
                      setUsnInput('');
                      setNameInput('');
                    }}
                    className="ml-3 text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Switch USN
                  </button>
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
              >
                <Plus size={15} /> Request Certificate
              </button>
            </div>

            {/* Requests list */}
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FileText size={26} className="text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-500">No requests yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your certificate requests will appear here
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-5 flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline"
                >
                  <Plus size={14} /> Make your first request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={18} className="text-blue-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-gray-900">{r.certificateType}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Requested on{' '}
                            {new Date(r.requestedDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                            {' · '}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}
                            >
                              {STATUS_ICON[r.status]} {r.status}
                            </span>
                          </p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium shrink-0">
                          {r.deliveryType}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium text-gray-700">Reason:</span> {r.reason}
                      </p>

                      {r.remarks && (
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Admin note:</span> {r.remarks}
                        </p>
                      )}

                      {/* Download button for approved + download type */}
                      {r.status === 'Approved' &&
                        r.certificateRef &&
                        r.deliveryType === 'Download' && (
                          <button
                            onClick={() => handleDownload(r)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                          >
                            <Download size={13} /> Download Certificate
                          </button>
                        )}
                      {r.status === 'Approved' && r.deliveryType === 'Hard Copy' && (
                        <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
                          <CheckCircle size={13} /> Approved — please collect from the admin office
                        </p>
                      )}
                    </div>

                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            )}

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Certificate requests are typically processed within{' '}
                <strong>2–3 working days</strong>. For urgent requests, please contact the
                administration office directly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
