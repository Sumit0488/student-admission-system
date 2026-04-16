import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Users, AlertCircle, List, CalendarDays, SlidersHorizontal,
  Mail, MessageCircle, Download, X, Eye, CheckSquare, Square,
  ChevronDown, Phone, MapPin, BookOpen, User, Calendar, FileText,
  Shield, GraduationCap, Layers, Hash, Edit3, CheckCircle, Info,
  IndianRupee,
} from 'lucide-react';
import api from '../../services/api';
import { getFeeOrders, collectFeePayment } from '../../services/feeApi';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_TABS = ['All', 'Live', 'Completed', 'Cancelled', 'Detained'];

const STATUS_STYLE = {
  Live:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Detained:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const ALL_COLUMNS = [
  { key: 'student_id', label: 'USN' },
  { key: 'fullName',   label: 'Full Name' },
  { key: 'admissionStatus', label: 'Status' },
  { key: 'term',       label: 'Term' },
  { key: 'program',    label: 'Program' },
  { key: 'batch',      label: 'Batch' },
  { key: 'email',      label: 'Email' },
  { key: 'phone',      label: 'Phone' },
  { key: 'gender',     label: 'Gender' },
  { key: 'quota',      label: 'Quota' },
  { key: 'admissionCategory', label: 'Admission Category' },
  { key: 'fatherName', label: 'Father Name' },
  { key: 'dob',        label: 'Date of Birth' },
  { key: 'city',       label: 'City' },
];

const PROFILE_TABS = [
  'Basic Details', 'Core Details', 'Admission Details',
  'Entrance Exam', 'Personal Details', 'Parent Details',
  'Marks Card', 'Address', 'Documents',
];

function fmt(n) {
  if (!n) return '—';
  return n;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Field Row ─────────────────────────────────────────────────────────────────
function PRow({ label, value }) {
  return (
    <div className="flex items-start py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
      <p className="w-40 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200">{value || '—'}</p>
    </div>
  );
}

// ── Document row with Original / Xerox checkboxes ────────────────────────────
const DOCS = [
  'SSLC / 10th Marksheet', 'PUC / 12th Marksheet', 'Transfer Certificate',
  'Conduct Certificate', 'Caste Certificate', 'Income Certificate',
  'Aadhar Card', 'Passport Size Photo', 'Migration Certificate',
  'Entrance Rank Card', 'Category Certificate',
];

function DocumentsSection() {
  const [docs, setDocs] = useState(() =>
    DOCS.reduce((acc, d) => { acc[d] = { original: false, xerox: false }; return acc; }, {})
  );
  const toggle = (doc, type) =>
    setDocs((p) => ({ ...p, [doc]: { ...p[doc], [type]: !p[doc][type] } }));

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">Collected Documents</p>
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Document</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 w-24">Original</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 w-24">Xerox</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {DOCS.map((doc) => (
              <tr key={doc} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/20">
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{doc}</td>
                <td className="px-4 py-2.5 text-center">
                  <button onClick={() => toggle(doc, 'original')} className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center mx-auto
                    ${docs[doc].original ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                    {docs[doc].original && <CheckCircle size={12} />}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button onClick={() => toggle(doc, 'xerox')} className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center mx-auto
                    ${docs[doc].xerox ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                    {docs[doc].xerox && <CheckCircle size={12} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Quick View Panel ──────────────────────────────────────────────────────────
function QuickViewPanel({ student, onClose }) {
  const [profileTab, setProfileTab] = useState('Basic Details');
  const [editMode, setEditMode] = useState(false);

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-[#002250] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {student.fullName?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{student.fullName}</h3>
              <p className="text-xs text-white/60 font-mono">{student.student_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${editMode ? 'bg-orange-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <Edit3 size={12} /> {editMode ? 'Editing' : 'Edit'}
            </button>
            <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status + info strip */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-700 flex items-center gap-4 flex-wrap flex-shrink-0">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[student.admissionStatus] || STATUS_STYLE.Live}`}>
            {student.admissionStatus}
          </span>
          {student.program && <span className="text-xs text-gray-500 dark:text-slate-400"><BookOpen size={11} className="inline mr-1" />{student.program}</span>}
          {student.batch  && <span className="text-xs text-gray-500 dark:text-slate-400"><Calendar size={11} className="inline mr-1" />{student.batch}</span>}
          {student.term   && <span className="text-xs text-gray-500 dark:text-slate-400">Sem {student.term}</span>}
        </div>

        {/* Profile tab nav */}
        <div className="px-4 border-b border-gray-100 dark:border-slate-700 overflow-x-auto flex-shrink-0">
          <div className="flex gap-0 min-w-max">
            {PROFILE_TABS.map((t) => (
              <button key={t} onClick={() => setProfileTab(t)}
                className={`px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors
                  ${profileTab === t
                    ? 'border-[#002250] text-[#002250] dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {profileTab === 'Basic Details' && (
            <div>
              <PRow label="USN / Student ID" value={student.student_id} />
              <PRow label="Full Name"         value={student.fullName} />
              <PRow label="Email"             value={student.email} />
              <PRow label="Personal Email"    value={student.personalEmail} />
              <PRow label="Phone"             value={student.phone} />
              <PRow label="Status"            value={student.admissionStatus} />
            </div>
          )}
          {profileTab === 'Core Details' && (
            <div>
              <PRow label="Program"           value={student.program} />
              <PRow label="Degree"            value={student.degree} />
              <PRow label="Department"        value={student.department} />
              <PRow label="Batch"             value={student.batch} />
              <PRow label="Term / Semester"   value={student.term ? `Semester ${student.term}` : '—'} />
              <PRow label="Admission Category" value={student.admissionCategory} />
              <PRow label="Quota"             value={student.quota} />
            </div>
          )}
          {profileTab === 'Admission Details' && (
            <div>
              <PRow label="Admission Status"  value={student.admissionStatus} />
              <PRow label="Admission Date"    value={fmtDate(student.admissionDate)} />
              <PRow label="Last Joining Date" value={fmtDate(student.lastJoiningDate)} />
              <PRow label="Remarks"           value={student.remarks} />
              <PRow label="Fees Cleared"      value={student.feesCleared ? 'Yes' : 'No'} />
              <PRow label="No Dues"           value={student.noDues ? 'Yes' : 'No'} />
              <PRow label="Attendance Cleared" value={student.attendanceCleared ? 'Yes' : 'No'} />
              <PRow label="Exam Passed"       value={student.examPassed ? 'Yes' : 'No'} />
            </div>
          )}
          {profileTab === 'Entrance Exam' && (
            <div>
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                <GraduationCap size={32} className="mx-auto mb-2 opacity-40" />
                Entrance exam details not available
              </div>
            </div>
          )}
          {profileTab === 'Personal Details' && (
            <div>
              <PRow label="Gender"     value={student.gender} />
              <PRow label="Date of Birth" value={fmtDate(student.dob)} />
              <PRow label="Religion"   value={student.religion} />
              <PRow label="Caste"      value={student.caste} />
              <PRow label="Blood Group" value={student.bloodGroup} />
              <PRow label="Nationality" value={student.nationality || 'Indian'} />
            </div>
          )}
          {profileTab === 'Parent Details' && (
            <div>
              <PRow label="Father Name"  value={student.fatherName} />
              <PRow label="Mother Name"  value={student.motherName} />
              <PRow label="Guardian Phone" value={student.guardianPhone} />
              <PRow label="Parent Email" value={student.parentEmail} />
              <PRow label="Annual Income" value={student.annualIncome} />
            </div>
          )}
          {profileTab === 'Marks Card' && (
            <div>
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                Marks card not available
              </div>
            </div>
          )}
          {profileTab === 'Address' && (
            <div>
              <PRow label="Current Address"   value={student.address} />
              <PRow label="City"              value={student.city} />
              <PRow label="Permanent Address" value={student.permanentAddress} />
              <PRow label="State"             value={student.state} />
              <PRow label="Pincode"           value={student.pincode} />
            </div>
          )}
          {profileTab === 'Documents' && <DocumentsSection />}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center gap-3 flex-shrink-0">
          {editMode && (
            <button className="flex-1 px-4 py-2 text-sm font-semibold bg-[#002250] text-white rounded-lg hover:bg-[#003780] transition-colors">
              Save Changes
            </button>
          )}
          <button onClick={onClose} className={`${editMode ? '' : 'flex-1'} px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Export Dialog ─────────────────────────────────────────────────────────────
function ExportDialog({ students, onClose }) {
  const [selected, setSelected] = useState(new Set(ALL_COLUMNS.slice(0, 6).map((c) => c.key)));

  const toggle = (key) => setSelected((p) => {
    const n = new Set(p);
    if (n.has(key)) n.delete(key); else n.add(key);
    return n;
  });

  const selectAll = () => setSelected(new Set(ALL_COLUMNS.map((c) => c.key)));
  const clearAll  = () => setSelected(new Set());

  const handleExport = () => {
    const cols = ALL_COLUMNS.filter((c) => selected.has(c.key));
    const header = cols.map((c) => c.label).join(',');
    const rows = students.map((s) =>
      cols.map((c) => {
        const v = s[c.key];
        if (!v && v !== 0) return '';
        if (c.key === 'dob') return fmtDate(v);
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `students_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Select Columns to Export</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={selectAll} className="text-xs text-blue-600 font-medium hover:underline">Select All</button>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            <button onClick={clearAll} className="text-xs text-gray-500 font-medium hover:underline">Clear All</button>
            <span className="ml-auto text-xs text-gray-400">{selected.size} of {ALL_COLUMNS.length} selected</span>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {ALL_COLUMNS.map((col) => (
              <label key={col.key} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                <div onClick={() => toggle(col.key)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                    ${selected.has(col.key) ? 'bg-[#002250] border-[#002250]' : 'border-gray-300 dark:border-slate-600'}`}>
                  {selected.has(col.key) && <CheckCircle size={10} className="text-white" />}
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
            Cancel
          </button>
          <button onClick={handleExport} disabled={selected.size === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-[#002250] text-white rounded-lg hover:bg-[#003780] disabled:opacity-50 transition-colors">
            <Download size={14} /> Export {students.length} Records
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Timeline View ─────────────────────────────────────────────────────────────
function TimelineView({ students, onQuickView, selected, toggleOne, onCollect }) {
  const grouped = students.reduce((acc, s) => {
    const k = s.batch || 'No Batch';
    if (!acc[k]) acc[k] = [];
    acc[k].push(s);
    return acc;
  }, {});

  if (students.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <CalendarDays size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
        <p className="text-sm text-gray-400 dark:text-slate-500">No students found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {Object.entries(grouped).map(([batch, items]) => (
        <div key={batch}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {batch} <span className="font-normal text-gray-400">({items.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((s) => (
              <div key={s._id}
                className={`rounded-xl p-3 border transition-shadow hover:shadow-sm cursor-pointer
                  ${selected.has(s._id)
                    ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-700'
                    : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40'}`}
                onClick={() => toggleOne(s._id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{s.fullName}</p>
                    <p className="font-mono text-xs text-blue-600 dark:text-blue-400 mt-0.5">{s.student_id}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_STYLE[s.admissionStatus] || STATUS_STYLE.Live}`}>
                    {s.admissionStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate mb-3">{s.program}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Sem {s.term || '—'}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); onQuickView(s); }}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Eye size={12} /> View
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onCollect(s); }}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-[#002250] text-white rounded-lg hover:bg-[#003780] transition-colors">
                      <IndianRupee size={11} /> Collect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Collect Payment Modal ────────────────────────────────────────────────────
const PAYMENT_METHODS = ['Cash', 'Cheque', 'DD', 'PO', 'RTGS/NEFT', 'Book Adjustment'];

function CollectPaymentModal({ student, onClose, onSuccess }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    method: 'Cash',
    reference: '',
    date: new Date().toISOString().slice(0, 10),
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!student) return;
    setLoadingOrders(true);
    getFeeOrders({ student_id: student._id, limit: 50 })
      .then(({ data }) => {
        const list = (data.data || []).filter((o) => o.order_status !== 'paid');
        setOrders(list);
        if (list.length > 0) {
          setSelectedOrder(list[0]);
          setForm((p) => ({ ...p, amount: String(list[0].fee_due_amount || list[0].fee_order_amount || '') }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [student]);

  const handleOrderChange = (orderId) => {
    const o = orders.find((x) => x._id === orderId);
    setSelectedOrder(o || null);
    if (o) setForm((p) => ({ ...p, amount: String(o.fee_due_amount || o.fee_order_amount || '') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) { setError('Select a fee order'); return; }
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    setError('');
    setSubmitting(true);
    try {
      await collectFeePayment(selectedOrder._id, form);
      onSuccess(`Payment of ₹${amt.toLocaleString('en-IN')} collected for ${student.fullName}`);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => n ? `₹ ${Number(n).toLocaleString('en-IN')}` : '₹ 0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-[#002250] rounded-t-2xl">
          <div>
            <h3 className="font-semibold text-white text-sm">Collect Payment</h3>
            <p className="text-white/60 text-xs mt-0.5">{student.fullName} · {student.student_id}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Order selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Fee Order</label>
            {loadingOrders ? (
              <div className="h-9 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ) : orders.length === 0 ? (
              <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
                No pending fee orders found for this student.
              </p>
            ) : (
              <select
                value={selectedOrder?._id || ''}
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.fee_category} — Due: {fmt(o.fee_due_amount || o.fee_order_amount)} ({o.order_status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Order summary */}
          {selectedOrder && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: fmt(selectedOrder.fee_order_amount), color: 'text-gray-800 dark:text-white' },
                { label: 'Paid', value: fmt(selectedOrder.fee_paid_amount), color: 'text-green-700 dark:text-green-400' },
                { label: 'Due', value: fmt(selectedOrder.fee_due_amount), color: 'text-orange-600 dark:text-orange-400' },
              ].map((c) => (
                <div key={c.label} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide">{c.label}</p>
                  <p className={`text-sm font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Amount (₹) *</label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required type="number" min="1" step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button key={m} type="button" onClick={() => set('method', m)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors
                    ${form.method === m
                      ? 'bg-[#002250] border-[#002250] text-white'
                      : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-blue-400'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Reference + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Transaction Ref</label>
              <input value={form.reference} onChange={(e) => set('reference', e.target.value)}
                placeholder="Ref / Cheque No"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Date</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Remarks</label>
            <textarea value={form.remarks} onChange={(e) => set('remarks', e.target.value)} rows={2}
              placeholder="Optional remarks..."
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || orders.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-[#002250] text-white rounded-lg hover:bg-[#003780] disabled:opacity-50 transition-colors">
              <IndianRupee size={14} />
              {submitting ? 'Processing...' : 'Collect Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CollectFeePage() {
  const [tab, setTab]           = useState('Live');
  const [view, setView]         = useState('list');
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [quickView, setQuickView] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [actionToast, setActionToast] = useState('');
  const [collectTarget, setCollectTarget] = useState(null);

  // fetch students from admission backend
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const { data } = await api.get('/api/students', { params: { limit: 1000 } });
      setStudents(data.data || data || []);
    } catch {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Toast auto-clear
  useEffect(() => {
    if (!actionToast) return;
    const t = setTimeout(() => setActionToast(''), 3000);
    return () => clearTimeout(t);
  }, [actionToast]);

  // Per-tab counts
  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? students.length : students.filter((s) => s.admissionStatus === t).length;
    return acc;
  }, {});

  // Filtered list
  const filtered = students.filter((s) => {
    const matchTab = tab === 'All' || s.admissionStatus === tab;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.fullName?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.program?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // Bulk select
  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s._id));
  const anyChecked = selected.size > 0;

  const toggleAll = () => {
    if (allChecked) {
      setSelected((p) => { const n = new Set(p); filtered.forEach((s) => n.delete(s._id)); return n; });
    } else {
      setSelected((p) => { const n = new Set(p); filtered.forEach((s) => n.add(s._id)); return n; });
    }
  };
  const toggleOne = (id) => {
    setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // Bulk actions
  const selectedStudents = students.filter((s) => selected.has(s._id));

  const handleBulkEmail = () => {
    const emails = selectedStudents.map((s) => s.email).filter(Boolean);
    if (emails.length) window.open(`mailto:${emails.join(',')}`, '_blank');
    setActionToast(`Email opened for ${emails.length} students`);
  };

  const handleBulkWhatsApp = () => {
    const phones = selectedStudents.map((s) => s.phone?.replace(/\D/g, '')).filter(Boolean);
    if (phones.length === 1) {
      window.open(`https://wa.me/${phones[0]}`, '_blank');
    } else if (phones.length > 1) {
      setActionToast(`WhatsApp: ${phones.length} contacts selected. Open individually.`);
    }
  };

  // Row actions
  const handleUpdateContact = (s) => setActionToast(`Update Contact: ${s.fullName}`);
  const handleVerifyContact = (s) => setActionToast(`Verify Contact: ${s.fullName} — ${s.phone || 'No phone'}`);
  const handleSendSignIn   = (s) => setActionToast(`Sign-in link sent to ${s.email}`);

  return (
    <div className="space-y-5">
      {/* Action Toast */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in">
          <Info size={15} className="flex-shrink-0" />
          {actionToast}
        </div>
      )}

      {/* Quick View Panel */}
      {quickView && <QuickViewPanel student={quickView} onClose={() => setQuickView(null)} />}

      {/* Export Dialog */}
      {showExport && (
        <ExportDialog students={selectedStudents.length > 0 ? selectedStudents : filtered} onClose={() => setShowExport(false)} />
      )}

      {/* Collect Payment Modal */}
      {collectTarget && (
        <CollectPaymentModal
          student={collectTarget}
          onClose={() => setCollectTarget(null)}
          onSuccess={(msg) => setActionToast(msg)}
        />
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Welcome to your Students board! Here you can store and manage all of your Students
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">

        {/* Top bar: view toggle + icon actions */}
        <div className="flex items-center justify-between px-5 pt-3 pb-0 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center">
            {[['list', <List size={13} />, 'ListView'], ['timeline', <CalendarDays size={13} />, 'TimeLine']].map(([v, icon, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors
                  ${view === v
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 pb-2">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg" title="Filter"><SlidersHorizontal size={15} /></button>
            <button
              onClick={anyChecked ? handleBulkEmail : undefined}
              className={`p-1.5 rounded-lg transition-colors ${anyChecked ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-gray-300 dark:text-slate-600 cursor-default'}`}
              title={anyChecked ? `Email ${selected.size} students` : 'Select students first'}>
              <Mail size={15} />
            </button>
            <button
              onClick={anyChecked ? handleBulkWhatsApp : undefined}
              className={`p-1.5 rounded-lg transition-colors ${anyChecked ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-300 dark:text-slate-600 cursor-default'}`}
              title={anyChecked ? `WhatsApp ${selected.size} students` : 'Select students first'}>
              <MessageCircle size={15} />
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg" title="Export">
              <Download size={15} />
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="px-5 py-2 border-b border-gray-50 dark:border-slate-700/50">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${tab === t
                    ? 'text-gray-900 dark:text-white font-bold underline underline-offset-4'
                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                {t}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full
                  ${tab === t ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                  {counts[t] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {view === 'list' ? (
          <>
            {/* Search + bulk action bar */}
            <div className="px-5 py-3 flex items-center gap-3 flex-wrap border-b border-gray-50 dark:border-slate-700/30">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student by name, USN..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              {anyChecked ? (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full">
                    {selected.size} selected
                  </span>
                  <button onClick={toggleAll} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    {allChecked ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-gray-200 dark:text-slate-700">|</span>
                  <button onClick={handleBulkEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Mail size={12} /> Email
                  </button>
                  <button onClick={handleBulkWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <MessageCircle size={12} /> WhatsApp
                  </button>
                  <button onClick={() => setShowExport(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <Download size={12} /> Export
                  </button>
                </div>
              ) : (
                <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">
                  <span className="font-semibold text-gray-600 dark:text-slate-300">{filtered.length}</span> of {students.length} students
                </span>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900/50">
                    {/* Checkbox header */}
                    <th className="px-4 py-3.5 w-10">
                      <button onClick={toggleAll} className="text-gray-400 hover:text-blue-600 transition-colors">
                        {allChecked
                          ? <CheckSquare size={16} className="text-blue-600" />
                          : <Square size={16} />}
                      </button>
                    </th>
                    {/* Quick view header */}
                    <th className="px-2 py-3.5 w-10 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide"></th>
                    {['USN', 'Full Name', 'Status', 'Term', 'Program', 'Batch', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 10 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : error ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <AlertCircle size={28} className="mx-auto mb-2 text-red-400" />
                        <p className="text-sm text-gray-400 dark:text-slate-500">{error}</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center">
                        <Users size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                        <p className="text-sm text-gray-400 dark:text-slate-500">No students found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s._id}
                        className={`transition-colors cursor-pointer
                          ${selected.has(s._id)
                            ? 'bg-blue-50/40 dark:bg-blue-900/10'
                            : 'hover:bg-gray-50/60 dark:hover:bg-slate-700/30'}`}>

                        {/* Checkbox */}
                        <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleOne(s._id); }}>
                          <button className="text-gray-400 hover:text-blue-600 transition-colors">
                            {selected.has(s._id)
                              ? <CheckSquare size={16} className="text-blue-600" />
                              : <Square size={16} />}
                          </button>
                        </td>

                        {/* Quick View */}
                        <td className="px-2 py-3" onClick={(e) => { e.stopPropagation(); setQuickView(s); }}>
                          <button className="p-1.5 text-gray-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            <Eye size={15} />
                          </button>
                        </td>

                        {/* USN */}
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                          {s.student_id || '—'}
                        </td>

                        {/* Full Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-slate-400 text-xs font-bold flex-shrink-0">
                              {s.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{s.fullName}</p>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500">{s.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[s.admissionStatus] || STATUS_STYLE.Live}`}>
                            {s.admissionStatus}
                          </span>
                        </td>

                        {/* Term */}
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-sm">
                          {s.term ? `Sem ${s.term}` : '—'}
                        </td>

                        {/* Program */}
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-sm max-w-[180px]">
                          <p className="truncate">{s.program || '—'}</p>
                        </td>

                        {/* Batch */}
                        <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-sm whitespace-nowrap">
                          {s.batch || '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateContact(s)}
                              title="Update Contact"
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap">
                              <Phone size={10} /> Update
                            </button>
                            <button
                              onClick={() => handleVerifyContact(s)}
                              title="Verify Contact"
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-colors whitespace-nowrap">
                              <Shield size={10} /> Verify
                            </button>
                            <button
                              onClick={() => setCollectTarget(s)}
                              title="Collect Fee"
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md bg-[#002250] text-white hover:bg-[#003780] transition-colors whitespace-nowrap">
                              <IndianRupee size={10} /> Collect
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Showing <span className="font-semibold text-gray-600 dark:text-slate-300">{filtered.length}</span> students
                </p>
                {anyChecked && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{selected.size} selected</p>
                )}
              </div>
            )}
          </>
        ) : (
          <TimelineView students={filtered} onQuickView={setQuickView} selected={selected} toggleOne={toggleOne} onCollect={setCollectTarget} />
        )}
      </div>
    </div>
  );
}
