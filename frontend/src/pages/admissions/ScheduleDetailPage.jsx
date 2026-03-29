import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Search, Trash2, X, CheckCircle, AlertCircle,
  History, FileText, UserPlus, BarChart2, Clock, Users,
} from 'lucide-react';
import {
  getSchedule, getEnquiries, createEnquiry, updateEnquiry,
  addFollowUp, convertEnquiry, deleteEnquiry, moveEnquiryStage,
} from '../../services/admissionsApi';
import DynamicSelect from '../../components/DynamicSelect';

// ── Pipeline stages ───────────────────────────────────────────────────────────
const PIPELINE_STAGES = ['Inquiry', 'Application', 'Admitted', 'Rejected', 'Cancelled'];

const STAGE_STYLE = {
  Inquiry:     'bg-gray-100   dark:bg-slate-700    text-gray-700   dark:text-slate-300',
  Application: 'bg-blue-100   dark:bg-blue-900/30  text-blue-700   dark:text-blue-400',
  Admitted:    'bg-green-100  dark:bg-green-900/30 text-green-700  dark:text-green-400',
  Rejected:    'bg-red-100    dark:bg-red-900/30   text-red-700    dark:text-red-400',
  Cancelled:   'bg-gray-200   dark:bg-slate-600    text-gray-500   dark:text-slate-400',
};

const STAGE_TAB_ACTIVE = {
  Inquiry:     'text-gray-700 dark:text-slate-300',
  Application: 'text-blue-600 dark:text-blue-400',
  Admitted:    'text-green-600 dark:text-green-400',
  Rejected:    'text-red-600 dark:text-red-400',
  Cancelled:   'text-gray-500 dark:text-slate-400',
};

const STAGE_BORDER = {
  Inquiry:     'border-l-gray-300  dark:border-l-slate-600',
  Application: 'border-l-blue-400  dark:border-l-blue-700',
  Admitted:    'border-l-green-400 dark:border-l-green-700',
  Rejected:    'border-l-red-400   dark:border-l-red-700',
  Cancelled:   'border-l-gray-300  dark:border-l-slate-600',
};

const STD_DOCS = {
  Regular: ['10th Certificate', 'PUC/12th Marks Card', 'Transfer Certificate', 'Aadhar Card', 'Passport Photo'],
  Lateral: ['10th Certificate', 'Diploma Certificate', 'Transfer Certificate', 'Aadhar Card', 'Passport Photo'],
};

const FULL_FORM_INIT = {
  // A. Basic Details
  name: '', gender: '', dob: '', phone: '', email: '', aadhaar: '', pan: '',
  bloodGroup: '', area: '', motherTongue: '', religion: '', caste: '', subCaste: '',
  // B. Course Details
  program: '', admissionCategory: '',
  // C. Admission Details
  admissionDate: '', admissionMode: '', quota: '', seatNumber: '',
  seatCategory: '', kannada: '',
  // D. Entrance Exam Details
  examName: '', examRank: '', hallTicketNo: '', examYear: '',
  admOrderDate: '', issuedDate: '', allotmentDate: '', lastJoiningDate: '',
  claimedSeatCat: '', allotedSeatCat: '', admOrderNumber: '', feePaid: '',
  regNo: '', prevQualification: '',
  // E. Previous Education
  prevBoard: '', prevCollege: '', prevPercentage: '', prevYearPassing: '',
  // F. Father Details
  fatherName: '', fatherContact: '', fatherOccupation: '', fatherIncome: '',
  fatherEmail: '', fatherPan: '',
  // F. Mother Details
  motherName: '', motherContact: '', motherOccupation: '', motherIncome: '',
  motherEmail: '', motherPan: '',
  // G. Address
  addressLine: '', city: '', stateVal: '', pincode: '',
  // Notes
  notes: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStage(enq) {
  if (enq.status === 'Rejected')           return 'Rejected';
  if (enq.admissionStage === 'Cancelled')  return 'Cancelled';
  if (enq.admissionStage === 'Admitted')   return 'Admitted';
  if (enq.admissionStage === 'Application' || enq.admissionStage === 'Verified') return 'Application';
  return 'Inquiry';
}

function getTermForCategory(category, schedule) {
  // Use schedule's admission_details when available for accurate term data
  const details = schedule?.admission_details || [];
  const detail  = details.find((d) => d.admission_type === category);
  if (detail?.terms?.[0]) {
    const t = detail.terms[0];
    return { term: t.term, year: t.year_of_study, label: `Term ${t.term} · Year ${t.year_of_study}` };
  }
  // Hardcoded fallback (matches backend ADMISSION_TYPE_MAP)
  if (category === 'Regular') return { term: 1, year: 1, label: 'Term 1 · Year 1' };
  if (category === 'Lateral') return { term: 3, year: 2, label: 'Term 3 · Year 2' };
  return null;
}

function getStatusBadge(enq) {
  const stage = getStage(enq);
  if (enq.status === 'Converted') return { label: 'Active',    cls: 'bg-green-500 text-white' };
  if (stage === 'Admitted')       return { label: 'Admitted',  cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' };
  if (stage === 'Rejected')       return { label: 'Rejected',  cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' };
  if (stage === 'Cancelled')      return { label: 'Cancelled', cls: 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400' };
  return { label: 'Pending', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' };
}

// ── Toast ─────────────────────────────────────────────────────────────────────
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
    <div className="fixed top-5 right-5 z-[60] space-y-2 pointer-events-none">
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

export default function ScheduleDetailPage() {
  const params   = useParams();
  const schId    = params.scheduleId || params.id;
  const navigate = useNavigate();
  const { toasts, toast } = useToast();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [schedule,  setSchedule]  = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ── View mode ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState('detail'); // 'detail' | 'addStudent'

  // ── Tabs & filters ────────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState('students');
  const [pipelineStage, setPipelineStage] = useState('all');
  const [search,        setSearch]        = useState('');

  // ── Full Add Student form ──────────────────────────────────────────────────
  const [addForm,   setAddForm]   = useState(FULL_FORM_INIT);
  const [addErrors, setAddErrors] = useState({});
  const [addSaving, setAddSaving] = useState(false);

  // ── Follow-ups modal ───────────────────────────────────────────────────────
  const [fuTarget, setFuTarget] = useState(null);
  const [fuForm,   setFuForm]   = useState({ date: '', note: '', status: '' });
  const [fuSaving, setFuSaving] = useState(false);

  // ── Documents modal ────────────────────────────────────────────────────────
  const [docsTarget, setDocsTarget] = useState(null);
  const [docsPatch,  setDocsPatch]  = useState([]);
  const [docsSaving, setDocsSaving] = useState(false);

  // ── Convert modal ──────────────────────────────────────────────────────────
  const [convertTarget, setConvertTarget] = useState(null);
  const [forceConvert,  setForceConvert]  = useState(false);
  const [converting,    setConverting]    = useState(false);

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState(null);

  // ── Stage move loading map ─────────────────────────────────────────────────
  const [movingMap, setMovingMap] = useState({});

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: sData }, { data: eData }] = await Promise.all([
        getSchedule(schId),
        getEnquiries({ scheduleId: schId }),
      ]);
      setSchedule(sData.data);
      setEnquiries(eData.data || []);
    } catch { toast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, [schId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const stageCounts = useMemo(() => {
    const counts = { all: enquiries.length };
    PIPELINE_STAGES.forEach((s) => { counts[s] = 0; });
    enquiries.forEach((e) => { counts[getStage(e)] = (counts[getStage(e)] || 0) + 1; });
    return counts;
  }, [enquiries]);

  const displayed = useMemo(() => {
    let list = enquiries;
    if (pipelineStage !== 'all') list = list.filter((e) => getStage(e) === pipelineStage);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.phone?.includes(q)
      );
    }
    return list;
  }, [enquiries, pipelineStage, search]);

  const analytics = useMemo(() => {
    const total   = enquiries.length;
    const seatPct = schedule?.maxSeats > 0
      ? Math.round(((schedule.filledSeats || 0) / schedule.maxSeats) * 100) : 0;
    const regular = enquiries.filter((e) => e.admissionCategory === 'Regular').length;
    const lateral = enquiries.filter((e) => e.admissionCategory === 'Lateral').length;
    const progMap = {};
    enquiries.forEach((e) => {
      const p = e.program || e.stream || 'Unknown';
      progMap[p] = (progMap[p] || 0) + 1;
    });
    return { total, seatPct, regular, lateral, progMap };
  }, [enquiries, schedule]);

  const timelineGroups = useMemo(() => {
    const events = [];
    enquiries.forEach((enq) => {
      events.push({ date: new Date(enq.createdAt), label: `${enq.name} added (Inquiry)`, type: 'add' });
      if (enq.admissionStage === 'Application') events.push({ date: new Date(enq.updatedAt), label: `${enq.name} → Application`, type: 'stage' });
      if (enq.admissionStage === 'Admitted')    events.push({ date: new Date(enq.updatedAt), label: `${enq.name} admitted`, type: 'admit' });
      (enq.followUps || []).forEach((fu) => {
        events.push({ date: new Date(fu.date), label: `${enq.name} — ${fu.note || fu.status || 'Follow-up'}`, type: 'followup' });
      });
    });
    events.sort((a, b) => b.date - a.date);
    const groups = {};
    events.slice(0, 60).forEach((ev) => {
      const key = ev.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return Object.entries(groups);
  }, [enquiries]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMoveStage = async (id, newStage) => {
    setMovingMap((p) => ({ ...p, [id]: true }));
    try {
      const { data } = await moveEnquiryStage(id, newStage);
      setEnquiries((p) => p.map((e) => e._id === id ? data.data : e));
    } catch (err) {
      toast(err.response?.data?.error || 'Stage update failed', 'error');
    } finally { setMovingMap((p) => ({ ...p, [id]: false })); }
  };

  const handleAddStudent = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!addForm.name.trim())  e.name  = 'Required';
    if (!addForm.email.trim()) e.email = 'Required';
    const digits = addForm.phone.replace(/\D/g, '').slice(-10);
    if (!digits || digits.length !== 10) e.phone = '10 digits required';
    setAddErrors(e);
    if (Object.keys(e).length) return;

    setAddSaving(true);
    const ti = getTermForCategory(addForm.admissionCategory, schedule);
    try {
      const str = (v) => v?.trim() || undefined;
      const num = (v) => (v ? Number(v) : undefined);
      const payload = {
        name:              addForm.name.trim(),
        phone:             `+91${digits}`,
        email:             addForm.email.trim(),
        scheduleId:        schId,
        program:           addForm.program || schedule?.stream || '',
        admissionCategory: str(addForm.admissionCategory),
        term:              ti ? ti.term : undefined,
        batch:             schedule?.academicYear,
        // personal
        gender:            str(addForm.gender),
        dob:               str(addForm.dob),
        aadhaar:           str(addForm.aadhaar),
        pan:               str(addForm.pan),
        bloodGroup:        str(addForm.bloodGroup),
        area:              str(addForm.area),
        motherTongue:      str(addForm.motherTongue),
        religion:          str(addForm.religion),
        caste:             str(addForm.caste),
        subCaste:          str(addForm.subCaste),
        // admission
        admissionDate:     str(addForm.admissionDate),
        admissionMode:     str(addForm.admissionMode),
        quota:             str(addForm.quota),
        seatNumber:        str(addForm.seatNumber),
        seatCategory:      str(addForm.seatCategory),
        kannada:           str(addForm.kannada),
        // entrance exam
        examName:          str(addForm.examName),
        examRank:          num(addForm.examRank),
        hallTicketNo:      str(addForm.hallTicketNo),
        examYear:          num(addForm.examYear),
        admOrderDate:      str(addForm.admOrderDate),
        issuedDate:        str(addForm.issuedDate),
        allotmentDate:     str(addForm.allotmentDate),
        lastJoiningDate:   str(addForm.lastJoiningDate),
        claimedSeatCat:    str(addForm.claimedSeatCat),
        allotedSeatCat:    str(addForm.allotedSeatCat),
        admOrderNumber:    str(addForm.admOrderNumber),
        feePaid:           num(addForm.feePaid),
        regNo:             str(addForm.regNo),
        prevQualification: str(addForm.prevQualification),
        // education
        prevBoard:         str(addForm.prevBoard),
        prevCollege:       str(addForm.prevCollege),
        prevPercentage:    num(addForm.prevPercentage),
        prevYearPassing:   num(addForm.prevYearPassing),
        // parents
        fatherName:        addForm.fatherName.trim(),
        fatherContact:     addForm.fatherContact ? `+91${addForm.fatherContact.replace(/\D/g, '').slice(-10)}` : '',
        fatherOccupation:  str(addForm.fatherOccupation),
        fatherIncome:      num(addForm.fatherIncome),
        fatherEmail:       str(addForm.fatherEmail),
        fatherPan:         str(addForm.fatherPan),
        motherName:        addForm.motherName.trim(),
        motherContact:     addForm.motherContact ? `+91${addForm.motherContact.replace(/\D/g, '').slice(-10)}` : undefined,
        motherOccupation:  str(addForm.motherOccupation),
        motherIncome:      num(addForm.motherIncome),
        motherEmail:       str(addForm.motherEmail),
        motherPan:         str(addForm.motherPan),
        // address
        addressLine:       addForm.addressLine?.trim() || '',
        city:              addForm.city?.trim()        || '',
        state:             addForm.stateVal?.trim()    || '',
        pincode:           addForm.pincode?.trim()     || '',
        notes:             str(addForm.notes),
        documents:         addForm.admissionCategory && STD_DOCS[addForm.admissionCategory]
          ? STD_DOCS[addForm.admissionCategory].map((n) => ({ name: n, submitted: false }))
          : [],
      };

      // Step 1: Create enquiry record with all details
      const { data: enqData } = await createEnquiry(payload);
      const newEnquiry = enqData.data;

      // Step 2: Immediately admit — creates a Student record so they appear in the students list
      let admitted = false;
      try {
        await convertEnquiry(newEnquiry._id, { force: true });
        admitted = true;
      } catch (convertErr) {
        // Conversion failed (e.g. seats full) — student is still saved as an enquiry
        toast(`Saved as enquiry. Auto-admit failed: ${convertErr.response?.data?.error || 'seats may be full'}`, 'error');
      }

      // Reload enquiries & schedule to get up-to-date data
      const [{ data: eData }, { data: sData }] = await Promise.all([
        getEnquiries({ scheduleId: schId }),
        getSchedule(schId),
      ]);
      setEnquiries(eData.data || []);
      setSchedule(sData.data);

      if (admitted) toast(`${addForm.name} admitted successfully`);
      setViewMode('detail');
      setAddForm(FULL_FORM_INIT);
      setAddErrors({});
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Failed to add student', 'error');
    } finally { setAddSaving(false); }
  };

  const handleAddFollowUp = async () => {
    if (!fuForm.date) return toast('Date is required', 'error');
    setFuSaving(true);
    try {
      const { data } = await addFollowUp(fuTarget._id, fuForm);
      setEnquiries((p) => p.map((e) => e._id === fuTarget._id ? data.data : e));
      setFuTarget(data.data);
      setFuForm({ date: '', note: '', status: '' });
      toast('Follow-up added');
    } catch { toast('Failed', 'error'); }
    finally { setFuSaving(false); }
  };

  const openDocs = (enq) => {
    const docs = enq.documents?.length
      ? enq.documents.map((d) => ({ ...d }))
      : (STD_DOCS[enq.admissionCategory] || []).map((name) => ({ name, submitted: false }));
    setDocsTarget(enq); setDocsPatch(docs);
  };

  const handleDocSave = async () => {
    setDocsSaving(true);
    try {
      const { data } = await updateEnquiry(docsTarget._id, { documents: docsPatch });
      setEnquiries((p) => p.map((e) => e._id === docsTarget._id ? data.data : e));
      toast('Documents saved'); setDocsTarget(null);
    } catch { toast('Failed', 'error'); }
    finally { setDocsSaving(false); }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      await convertEnquiry(convertTarget._id, { force: forceConvert });
      setEnquiries((p) => p.map((e) => e._id === convertTarget._id ? { ...e, status: 'Converted', admissionStage: 'Admitted' } : e));
      getSchedule(schId).then(({ data: sd }) => setSchedule(sd.data)).catch(() => {});
      toast(`${convertTarget.name} converted to student`);
      setConvertTarget(null);
    } catch (err) {
      toast(err.response?.data?.error || 'Conversion failed', 'error');
    } finally { setConverting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEnquiry(id);
      setEnquiries((p) => p.filter((e) => e._id !== id));
      toast('Deleted');
    } catch { toast('Delete failed', 'error'); }
    finally { setDeleteId(null); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const inp = (err) =>
    `w-full px-4 py-3 text-sm rounded-xl border bg-white dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${err ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'}`;

  const lbl = (text, req) => (
    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
      {text}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const fa = (field) => (e) => {
    const val = typeof e === 'string' ? e : e.target.value;
    setAddForm((p) => ({ ...p, [field]: val }));
    setAddErrors((p) => ({ ...p, [field]: '' }));
  };

  // ds(field, type, placeholder, allowAdd)
  // allowAdd=true only for types where admins should be able to add new values
  const ds = (field, type, placeholder, allowAdd = false) => (
    <DynamicSelect
      type={type}
      value={addForm[field]}
      onChange={(v) => { setAddForm((p) => ({ ...p, [field]: v })); setAddErrors((p) => ({ ...p, [field]: '' })); }}
      placeholder={placeholder || 'Select...'}
      allowAdd={allowAdd}
      className={addErrors[field] ? 'border-red-400' : ''}
    />
  );

  const roInp = 'w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 cursor-default focus:outline-none';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-48" />
        <div className="grid grid-cols-5 gap-4 mt-6">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-slate-400">Schedule not found.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-sm text-blue-600 hover:underline">← Back</button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ADD STUDENT FORM VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'addStudent') {
    const ti = getTermForCategory(addForm.admissionCategory, schedule);
    return (
      <>
        <Toasts toasts={toasts} />
        <form onSubmit={handleAddStudent} className="min-h-full">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { setViewMode('detail'); setAddErrors({}); }}
                className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add Student</h1>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{schedule.scheduleName}</p>
              </div>
            </div>
            <button type="submit" disabled={addSaving}
              className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors shadow-sm">
              {addSaving ? 'Saving...' : 'Save Student'}
            </button>
          </div>

          <div className="max-w-4xl space-y-6">

            {/* A. Basic Details */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/20">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">A · Basic Details</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  {lbl('Full Name', true)}
                  <input value={addForm.name} onChange={fa('name')} placeholder="e.g. Vikas Patil" className={inp(addErrors.name)} />
                  {addErrors.name && <p className="text-xs text-red-500 mt-1">{addErrors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl('Gender', true)}
                    {ds('gender', 'gender', '— Select Gender —')}
                    {addErrors.gender && <p className="text-xs text-red-500 mt-1">{addErrors.gender}</p>}
                  </div>
                  <div>
                    {lbl('Date of Birth', true)}
                    <input type="date" value={addForm.dob} onChange={fa('dob')} className={inp(addErrors.dob)} />
                    {addErrors.dob && <p className="text-xs text-red-500 mt-1">{addErrors.dob}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl('Phone Number', true)}
                    <div className="flex">
                      <span className="px-3 py-3 text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 border border-r-0 border-gray-200 dark:border-slate-600 rounded-l-xl select-none font-mono">+91</span>
                      <input type="tel" maxLength={10}
                        value={addForm.phone.replace(/\D/g, '').slice(0, 10)}
                        onChange={(e) => { setAddForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })); setAddErrors((p) => ({ ...p, phone: '' })); }}
                        placeholder="9876543210"
                        className={`flex-1 px-4 py-3 text-sm border rounded-r-xl bg-white dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${addErrors.phone ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'}`} />
                    </div>
                    {addErrors.phone && <p className="text-xs text-red-500 mt-1">{addErrors.phone}</p>}
                  </div>
                  <div>
                    {lbl('Email', true)}
                    <input type="email" value={addForm.email} onChange={fa('email')} placeholder="student@email.com" className={inp(addErrors.email)} />
                    {addErrors.email && <p className="text-xs text-red-500 mt-1">{addErrors.email}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl('Aadhaar Number')}
                    <input value={addForm.aadhaar} onChange={fa('aadhaar')} placeholder="12-digit Aadhaar" maxLength={12} className={inp(false)} />
                  </div>
                  <div>
                    {lbl('PAN Number')}
                    <input value={addForm.pan} onChange={fa('pan')} placeholder="e.g. ABCDE1234F" maxLength={10} className={inp(false)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    {lbl('Blood Group')}
                    {ds('bloodGroup', 'blood_group', '— Blood Group —')}
                  </div>
                  <div>
                    {lbl('Area')}
                    {ds('area', 'area', '— Select Area —')}
                  </div>
                  <div>
                    {lbl('Mother Tongue')}
                    {ds('motherTongue', 'mother_tongue', '— Select —')}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    {lbl('Religion')}
                    {ds('religion', 'religion', '— Select —')}
                  </div>
                  <div>
                    {lbl('Caste')}
                    {ds('caste', 'caste', '— Select —')}
                  </div>
                  <div>
                    {lbl('Sub Caste')}
                    <input value={addForm.subCaste} onChange={fa('subCaste')} placeholder="Sub caste (optional)" className={inp(false)} />
                  </div>
                </div>
              </div>
            </section>

            {/* B. Course Details */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/20">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">B · Course Details</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl('Degree')}
                    <input readOnly
                      value={schedule.scheduleName || schedule.stream || ''}
                      className={roInp} />
                  </div>
                  <div>
                    {lbl('Academic Year')}
                    <input readOnly value={schedule.academicYear} className={roInp} />
                  </div>
                </div>
                <div>
                  {lbl('Program / Branch', true)}
                  {ds('program', 'program', '— Select Program —', true)}
                  {addErrors.program && <p className="text-xs text-red-500 mt-1">{addErrors.program}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl('Admission Type')}
                    <select value={addForm.admissionCategory}
                      onChange={(e) => setAddForm((p) => ({ ...p, admissionCategory: e.target.value }))}
                      className={inp(false)}>
                      <option value="">— None —</option>
                      {(
                        // Derive options from schedule.admission_details (backend-provided)
                        // Fall back to both types if schedule has no explicit config
                        (schedule.admission_details?.length > 0
                          ? schedule.admission_details.map((d) => d.admission_type)
                          : ['Regular', 'Lateral']
                        ).map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    {lbl('Term & Year (Auto)')}
                    <input readOnly value={ti ? ti.label : '—'} className={roInp} />
                  </div>
                </div>
              </div>
            </section>

            {/* C. Admission Details */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/20">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">C · Admission Details</h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-4">
                <div>
                  {lbl('Admission Date', true)}
                  <input type="date" value={addForm.admissionDate} onChange={fa('admissionDate')} className={inp(addErrors.admissionDate)} />
                  {addErrors.admissionDate && <p className="text-xs text-red-500 mt-1">{addErrors.admissionDate}</p>}
                </div>
                <div>
                  {lbl('Admission Mode')}
                  {ds('admissionMode', 'admission_mode', '— Select Mode —')}
                </div>
                <div>
                  {lbl('Quota')}
                  {ds('quota', 'quota', '— Select Quota —', true)}
                </div>
                <div>
                  {lbl('Seat Number')}
                  <input value={addForm.seatNumber} onChange={fa('seatNumber')} placeholder="Optional" className={inp(false)} />
                </div>
                <div>
                  {lbl('Seat Category')}
                  {ds('seatCategory', 'seat_category', '— Select —')}
                </div>
                <div>
                  {lbl('Kannada')}
                  {ds('kannada', 'kannada', '— Select —')}
                </div>
              </div>
            </section>

            {/* D. Entrance Exam */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/20">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">D · Entrance Exam Details</h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-4">
                <div>
                  {lbl('Exam Name')}
                  {ds('examName', 'exam', '— Select Exam —', true)}
                </div>
                <div>
                  {lbl('Rank')}
                  <input type="number" value={addForm.examRank} onChange={fa('examRank')} placeholder="e.g. 1234" className={inp(false)} />
                </div>
                <div>
                  {lbl('Hall Ticket / Reg. Number')}
                  <input value={addForm.hallTicketNo} onChange={fa('hallTicketNo')} placeholder="Hall ticket no." className={inp(false)} />
                </div>
                <div>
                  {lbl('Exam Year')}
                  <input type="number" value={addForm.examYear} onChange={fa('examYear')} placeholder="e.g. 2025" className={inp(false)} />
                </div>
                <div>
                  {lbl('Adm. Order Date')}
                  <input type="date" value={addForm.admOrderDate} onChange={fa('admOrderDate')} className={inp(false)} />
                </div>
                <div>
                  {lbl('Issued Date')}
                  <input type="date" value={addForm.issuedDate} onChange={fa('issuedDate')} className={inp(false)} />
                </div>
                <div>
                  {lbl('Allotment Date')}
                  <input type="date" value={addForm.allotmentDate} onChange={fa('allotmentDate')} className={inp(false)} />
                </div>
                <div>
                  {lbl('Last Joining Date')}
                  <input type="date" value={addForm.lastJoiningDate} onChange={fa('lastJoiningDate')} className={inp(false)} />
                </div>
                <div>
                  {lbl('Claimed Seat Category')}
                  {ds('claimedSeatCat', 'seat_category', '— Select —')}
                </div>
                <div>
                  {lbl('Alloted Seat Category')}
                  {ds('allotedSeatCat', 'seat_category', '— Select —')}
                </div>
                <div>
                  {lbl('Adm. Order Number')}
                  <input value={addForm.admOrderNumber} onChange={fa('admOrderNumber')} placeholder="Order number" className={inp(false)} />
                </div>
                <div>
                  {lbl('Fee Paid (₹)')}
                  <input type="number" value={addForm.feePaid} onChange={fa('feePaid')} placeholder="Amount" className={inp(false)} />
                </div>
                <div>
                  {lbl('Reg. Number')}
                  <input value={addForm.regNo} onChange={fa('regNo')} placeholder="Registration no." className={inp(false)} />
                </div>
                <div>
                  {lbl('Previous Qualification')}
                  <input value={addForm.prevQualification} onChange={fa('prevQualification')} placeholder="e.g. Diploma, PUC" className={inp(false)} />
                </div>
              </div>
            </section>

            {/* E. Previous Education */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/20">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">E · Previous Education</h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-4">
                <div>
                  {lbl('Board / University')}
                  <input value={addForm.prevBoard} onChange={fa('prevBoard')} placeholder="e.g. Karnataka Board" className={inp(false)} />
                </div>
                <div>
                  {lbl('College / School Name')}
                  <input value={addForm.prevCollege} onChange={fa('prevCollege')} placeholder="Previous institution" className={inp(false)} />
                </div>
                <div>
                  {lbl('Percentage / CGPA')}
                  <input type="number" step="0.01" value={addForm.prevPercentage} onChange={fa('prevPercentage')} placeholder="e.g. 85.5" className={inp(false)} />
                </div>
                <div>
                  {lbl('Year of Passing')}
                  <input type="number" value={addForm.prevYearPassing} onChange={fa('prevYearPassing')} placeholder="e.g. 2024" className={inp(false)} />
                </div>
              </div>
            </section>

            {/* F. Parent Details */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/20">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">F · Parent Details</h2>
              </div>
              <div className="px-6 py-5 space-y-6">
                {/* Father */}
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Father</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {lbl("Father's Name", true)}
                      <input value={addForm.fatherName} onChange={fa('fatherName')} placeholder="Father's full name" className={inp(addErrors.fatherName)} />
                      {addErrors.fatherName && <p className="text-xs text-red-500 mt-1">{addErrors.fatherName}</p>}
                    </div>
                    <div>
                      {lbl('Father Contact', true)}
                      <div className="flex">
                        <span className="px-3 py-3 text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 border border-r-0 border-gray-200 dark:border-slate-600 rounded-l-xl select-none font-mono">+91</span>
                        <input type="tel" maxLength={10}
                          value={addForm.fatherContact.replace(/\D/g, '').slice(0, 10)}
                          onChange={(e) => { setAddForm((p) => ({ ...p, fatherContact: e.target.value.replace(/\D/g, '').slice(0, 10) })); setAddErrors((p) => ({ ...p, fatherContact: '' })); }}
                          placeholder="9876543210"
                          className={`flex-1 px-4 py-3 text-sm border rounded-r-xl bg-white dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${addErrors.fatherContact ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'}`} />
                      </div>
                      {addErrors.fatherContact && <p className="text-xs text-red-500 mt-1">{addErrors.fatherContact}</p>}
                    </div>
                    <div>
                      {lbl('Occupation')}
                      <input value={addForm.fatherOccupation} onChange={fa('fatherOccupation')} placeholder="e.g. Engineer, Farmer" className={inp(false)} />
                    </div>
                    <div>
                      {lbl('Annual Income (₹)')}
                      <input type="number" value={addForm.fatherIncome} onChange={fa('fatherIncome')} placeholder="e.g. 500000" className={inp(false)} />
                    </div>
                    <div>
                      {lbl('Email')}
                      <input type="email" value={addForm.fatherEmail} onChange={fa('fatherEmail')} placeholder="father@email.com" className={inp(false)} />
                    </div>
                    <div>
                      {lbl('PAN')}
                      <input value={addForm.fatherPan} onChange={fa('fatherPan')} placeholder="e.g. ABCDE1234F" maxLength={10} className={inp(false)} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-slate-700" />
                {/* Mother */}
                <div>
                  <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-widest mb-3">Mother</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {lbl("Mother's Name", true)}
                      <input value={addForm.motherName} onChange={fa('motherName')} placeholder="Mother's full name" className={inp(addErrors.motherName)} />
                      {addErrors.motherName && <p className="text-xs text-red-500 mt-1">{addErrors.motherName}</p>}
                    </div>
                    <div>
                      {lbl('Mother Contact')}
                      <div className="flex">
                        <span className="px-3 py-3 text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 border border-r-0 border-gray-200 dark:border-slate-600 rounded-l-xl select-none font-mono">+91</span>
                        <input type="tel" maxLength={10}
                          value={addForm.motherContact.replace(/\D/g, '').slice(0, 10)}
                          onChange={(e) => { setAddForm((p) => ({ ...p, motherContact: e.target.value.replace(/\D/g, '').slice(0, 10) })); }}
                          placeholder="9876543210"
                          className="flex-1 px-4 py-3 text-sm border rounded-r-xl bg-white dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-200 dark:border-slate-600" />
                      </div>
                    </div>
                    <div>
                      {lbl('Occupation')}
                      <input value={addForm.motherOccupation} onChange={fa('motherOccupation')} placeholder="e.g. Homemaker, Teacher" className={inp(false)} />
                    </div>
                    <div>
                      {lbl('Annual Income (₹)')}
                      <input type="number" value={addForm.motherIncome} onChange={fa('motherIncome')} placeholder="e.g. 300000" className={inp(false)} />
                    </div>
                    <div>
                      {lbl('Email')}
                      <input type="email" value={addForm.motherEmail} onChange={fa('motherEmail')} placeholder="mother@email.com" className={inp(false)} />
                    </div>
                    <div>
                      {lbl('PAN')}
                      <input value={addForm.motherPan} onChange={fa('motherPan')} placeholder="e.g. ABCDE1234F" maxLength={10} className={inp(false)} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* G. Address */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/20">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">G · Address</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  {lbl('Address Line', true)}
                  <input value={addForm.addressLine} onChange={fa('addressLine')} placeholder="Door no., Street, Area" className={inp(addErrors.addressLine)} />
                  {addErrors.addressLine && <p className="text-xs text-red-500 mt-1">{addErrors.addressLine}</p>}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    {lbl('City', true)}
                    <input value={addForm.city} onChange={fa('city')} placeholder="City" className={inp(addErrors.city)} />
                    {addErrors.city && <p className="text-xs text-red-500 mt-1">{addErrors.city}</p>}
                  </div>
                  <div>
                    {lbl('State', true)}
                    <input value={addForm.stateVal} onChange={fa('stateVal')} placeholder="State" className={inp(addErrors.stateVal)} />
                    {addErrors.stateVal && <p className="text-xs text-red-500 mt-1">{addErrors.stateVal}</p>}
                  </div>
                  <div>
                    {lbl('Pincode', true)}
                    <input value={addForm.pincode} onChange={fa('pincode')} maxLength={6} placeholder="560001" className={inp(addErrors.pincode)} />
                    {addErrors.pincode && <p className="text-xs text-red-500 mt-1">{addErrors.pincode}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* H. Notes */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/20">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">H · Additional Notes</h2>
              </div>
              <div className="px-6 py-5">
                <textarea value={addForm.notes} onChange={fa('notes')} rows={3}
                  placeholder="Any additional remarks..."
                  className={`${inp(false)} resize-none`} />
              </div>
            </section>

            {/* Bottom actions */}
            <div className="flex gap-3 pb-8">
              <button type="button" onClick={() => { setViewMode('detail'); setAddErrors({}); }}
                className="flex-1 py-3 text-sm rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={addSaving}
                className="flex-1 py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {addSaving ? 'Saving...' : 'Save Student'}
              </button>
            </div>

          </div>
        </form>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <Toasts toasts={toasts} />

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}

      {/* Follow-ups */}
      {fuTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Follow-up History</h2>
                <p className="text-xs text-gray-400 mt-0.5">{fuTarget.name}</p>
              </div>
              <button onClick={() => setFuTarget(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><X size={17} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {fuTarget.followUps?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No follow-ups yet</p>}
              {[...(fuTarget.followUps || [])].reverse().map((fu) => (
                <div key={fu._id} className="flex gap-3">
                  <div className="w-1.5 shrink-0 rounded-full bg-blue-400 mt-1" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{new Date(fu.date).toLocaleDateString('en-IN')}</span>
                      {fu.status && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500">{fu.status}</span>}
                    </div>
                    {fu.note && <p className="text-xs text-gray-500 mt-0.5">{fu.note}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3 shrink-0">
              <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Add Follow-up</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date *</label>
                  <input type="date" value={fuForm.date} onChange={(e) => setFuForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <input value={fuForm.status} onChange={(e) => setFuForm((p) => ({ ...p, status: e.target.value }))}
                    placeholder="Called, Visited..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <textarea value={fuForm.note} onChange={(e) => setFuForm((p) => ({ ...p, note: e.target.value }))}
                rows={2} placeholder="Notes..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <button onClick={handleAddFollowUp} disabled={fuSaving}
                className="w-full py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white disabled:opacity-60">
                {fuSaving ? 'Adding...' : 'Add Follow-up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      {docsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Documents</h2>
                <p className="text-xs text-gray-400 mt-0.5">{docsTarget.name}</p>
              </div>
              <button onClick={() => setDocsTarget(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><X size={17} /></button>
            </div>
            <div className="px-6 py-4 space-y-2">
              {docsPatch.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Set admission category first</p>}
              {docsPatch.map((doc, i) => (
                <label key={doc.name} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                  ${doc.submitted ? 'border-green-200 dark:border-green-700 bg-green-50/50' : 'border-gray-200 dark:border-slate-600'}`}>
                  <input type="checkbox" checked={doc.submitted}
                    onChange={(e) => setDocsPatch((p) => p.map((d, j) => j === i ? { ...d, submitted: e.target.checked } : d))}
                    className="w-4 h-4 rounded accent-green-600" />
                  <span className={`text-sm ${doc.submitted ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-slate-300'}`}>{doc.name}</span>
                  {doc.submitted && <CheckCircle size={13} className="ml-auto text-green-500 shrink-0" />}
                </label>
              ))}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setDocsTarget(null)} className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300">Cancel</button>
              <button onClick={handleDocSave} disabled={docsSaving} className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60">
                {docsSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert confirm */}
      {convertTarget && (() => {
        const missing   = (convertTarget.documents || []).filter((d) => !d.submitted).map((d) => d.name);
        const seatsLeft = (schedule?.maxSeats || 0) - (schedule?.filledSeats || 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-96 shadow-2xl space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Convert to Admission?</h3>
              <p className="text-sm text-gray-500">A student record will be created for <strong>{convertTarget.name}</strong>.</p>
              <div className={`text-xs px-3 py-2 rounded-lg font-medium ${seatsLeft > 0
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                {seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft !== 1 ? 's' : ''} remaining` : 'No seats available'}
              </div>
              {missing.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Missing documents:</p>
                  <ul className="text-xs text-amber-600 list-disc list-inside space-y-0.5">
                    {missing.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={forceConvert} onChange={(e) => setForceConvert(e.target.checked)} className="w-4 h-4 rounded accent-amber-600" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">Proceed anyway</span>
                  </label>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setConvertTarget(null)} className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300">Cancel</button>
                <button onClick={handleConvert}
                  disabled={converting || (missing.length > 0 && !forceConvert) || seatsLeft <= 0}
                  className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50">
                  {converting ? 'Converting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-80 shadow-2xl">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Remove this applicant?</p>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{schedule.scheduleName}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Here you can manage all your students under schedule</p>
            </div>
          </div>
          <button onClick={() => { setAddForm(FULL_FORM_INIT); setAddErrors({}); setViewMode('addStudent'); }}
            className="flex items-center gap-2 bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors shrink-0">
            <Plus size={15} /> Add Student
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-slate-700">
          {[
            { id: 'students',  label: 'List View',  icon: Users },
            { id: 'analytics', label: 'Analytics',  icon: BarChart2 },
            { id: 'timeline',  label: 'Timeline',   icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">

            {/* Stage filter tabs */}
            <div className="border-b border-gray-100 dark:border-slate-700 overflow-x-auto">
              <div className="flex min-w-max">
                <button onClick={() => setPipelineStage('all')}
                  className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors
                    ${pipelineStage === 'all'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                  All
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${pipelineStage === 'all' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'}`}>
                    {stageCounts.all}
                  </span>
                </button>
                {PIPELINE_STAGES.map((stage) => (
                  <button key={stage} onClick={() => setPipelineStage(stage)}
                    className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors
                      ${pipelineStage === stage
                        ? `border-current ${STAGE_TAB_ACTIVE[stage]}`
                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                    {stage}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${pipelineStage === stage ? STAGE_STYLE[stage] : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'}`}>
                      {stageCounts[stage] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar */}
            <div className="px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students with keywords"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-500">from {displayed.length} Students</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900/30">
                    {['USN', 'Full Name', 'Status', 'Term', 'Program', 'Email', 'Stage', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {displayed.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-14 text-center">
                      <Users size={28} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                      <p className="text-sm text-gray-400 dark:text-slate-500">
                        {pipelineStage === 'all' ? 'No students yet — click Add Student' : `No students in ${pipelineStage} stage`}
                      </p>
                    </td></tr>
                  ) : displayed.map((e) => {
                    const stage       = getStage(e);
                    const status      = getStatusBadge(e);
                    const missing     = (e.documents || []).filter((d) => !d.submitted).length;
                    const isConverted = e.status === 'Converted';
                    const usn         = e.regNo || e.applicantId || '—';
                    return (
                      <Fragment key={e._id}>
                        <tr className={`hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors border-l-2 ${STAGE_BORDER[stage]}`}>

                          {/* USN */}
                          <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">{usn}</td>

                          {/* Full Name */}
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{e.name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-mono">{e.phone}</p>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${status.cls}`}>
                              {status.label.toUpperCase()}
                            </span>
                          </td>

                          {/* Term */}
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{e.term || '—'}</span>
                          </td>

                          {/* Program */}
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300 max-w-[150px] truncate">
                            {e.program || e.stream || '—'}
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 max-w-[150px] truncate">{e.email}</td>

                          {/* Stage dropdown */}
                          <td className="px-4 py-3">
                            <select
                              value={stage}
                              disabled={movingMap[e._id] || isConverted}
                              onChange={(ev) => handleMoveStage(e._id, ev.target.value)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 uppercase tracking-wider
                                ${STAGE_STYLE[stage]} ${movingMap[e._id] ? 'opacity-50' : ''}`}>
                              {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setFuTarget(e); setFuForm({ date: '', note: '', status: '' }); }}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 relative transition-colors">
                                <History size={13} />
                                {e.followUps?.length > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                    {e.followUps.length}
                                  </span>
                                )}
                              </button>
                              <button onClick={() => openDocs(e)}
                                className={`p-1.5 rounded-lg transition-colors ${missing > 0 ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                <FileText size={13} />
                              </button>
                              {stage === 'Admitted' && !isConverted && (
                                <button onClick={() => { setConvertTarget(e); setForceConvert(false); }}
                                  className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                                  <UserPlus size={13} />
                                </button>
                              )}
                              <button onClick={() => setDeleteId(e._id)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Row count footer */}
            {displayed.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-50 dark:border-slate-700/50 flex justify-end">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  Rows per page: 10 &nbsp;·&nbsp; 1–{displayed.length} of {displayed.length}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {PIPELINE_STAGES.map((stage) => (
                <div key={stage} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stageCounts[stage] || 0}</p>
                  <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_STYLE[stage]}`}>{stage}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Seat Utilization</p>
                <div className="flex items-end gap-4">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">{analytics.seatPct}%</p>
                  <p className="text-sm text-gray-500 pb-1">{schedule.filledSeats}/{schedule.maxSeats} seats</p>
                </div>
                <div className="mt-3 h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${analytics.seatPct >= 90 ? 'bg-red-500' : analytics.seatPct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(analytics.seatPct, 100)}%` }} />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Admission Type Breakdown</p>
                <div className="space-y-3">
                  {[
                    { label: 'Regular', count: analytics.regular, color: 'bg-blue-500' },
                    { label: 'Lateral', count: analytics.lateral, color: 'bg-purple-500' },
                  ].map(({ label, count, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-slate-400 mb-1">
                        <span>{label}</span><span>{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`}
                          style={{ width: analytics.total > 0 ? `${Math.round((count / analytics.total) * 100)}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TIMELINE TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            {timelineGroups.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>
            ) : timelineGroups.map(([date, events]) => (
              <div key={date} className="mb-6 last:mb-0">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">{date}</p>
                <div className="space-y-2 pl-3 border-l-2 border-gray-100 dark:border-slate-700">
                  {events.map((ev, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 -ml-[5px] ${ev.type === 'add' ? 'bg-blue-400' : ev.type === 'admit' ? 'bg-green-400' : ev.type === 'followup' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                      <p className="text-sm text-gray-600 dark:text-slate-400">{ev.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
