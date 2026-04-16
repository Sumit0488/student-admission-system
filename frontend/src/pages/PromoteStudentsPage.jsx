import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Search, Users, CheckSquare, Square, AlertTriangle,
  CheckCircle, ChevronRight, X, Filter,
} from 'lucide-react';
import { getStudents, bulkPromoteStudents } from '../services/studentApi';
import { useAcademicConfig } from '../hooks/useAcademicConfig';
import { useToast } from '../hooks/useToast';
import Toasts from '../components/Toasts';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const ELIGIBILITY_LABELS = {
  feesCleared: 'Fees Cleared',
  attendanceCleared: 'Attendance OK',
  examPassed: 'Exam Passed',
  noDues: 'No Dues',
};

function EligibilityBadge({ student }) {
  const checks = Object.entries(ELIGIBILITY_LABELS);
  const failed = checks.filter(([k]) => student[k] === false);
  if (failed.length === 0)
    return <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"><CheckCircle size={11} /> Eligible</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium">
      <AlertTriangle size={11} /> {failed.map(([, l]) => l).join(', ')}
    </span>
  );
}

function ConfirmModal({ count, newTerm, newBatch, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Confirm Promotion</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <TrendingUp size={18} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Promote <span className="text-blue-600">{count}</span> student{count !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                → Semester <span className="font-bold text-blue-600">{newTerm}</span>
                {newBatch && <> · Batch <span className="font-bold text-blue-600">{newBatch}</span></>}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            This will update the <strong>semester</strong>{newBatch ? ' and <strong>batch</strong>' : ''} for all selected students. This action can be reversed by editing individual students.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button onClick={onConfirm} disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
              {loading ? 'Promoting...' : <><CheckCircle size={14} /> Promote</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromoteStudentsPage() {
  const { programs, batches } = useAcademicConfig();
  const { toasts, toast } = useToast();

  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Live');
  const [search, setSearch] = useState('');

  // Students list
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Promotion targets
  const [newTerm, setNewTerm] = useState('');
  const [newBatch, setNewBatch] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [promoting, setPromoting] = useState(false);

  // Result
  const [result, setResult] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = { limit: 100 };
      if (programFilter) params.program = programFilter;
      if (batchFilter) params.batch = batchFilter;
      if (semFilter) params.term = semFilter;
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.q = search.trim();
      const { data } = await getStudents(params);
      const list = data.data?.students || data.data || [];
      setStudents(list);
      setTotal(data.total || list.length);
    } catch {
      toast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [programFilter, batchFilter, semFilter, statusFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s._id || s.id)));
  };

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePromote = async () => {
    if (!newTerm) return toast('Please select a target semester', 'error');
    if (selected.size === 0) return toast('Select at least one student', 'error');
    setShowConfirm(true);
  };

  const confirmPromote = async () => {
    setPromoting(true);
    try {
      const payload = {
        studentIds: Array.from(selected),
        newTerm: parseInt(newTerm),
      };
      if (newBatch) payload.newBatch = newBatch;
      if (newStatus) payload.newStatus = newStatus;
      const { data } = await bulkPromoteStudents(payload);
      setResult({ count: data.updated, term: newTerm, batch: newBatch });
      setShowConfirm(false);
      setSelected(new Set());
      toast(`${data.updated} student${data.updated !== 1 ? 's' : ''} promoted successfully`);
      fetchStudents();
    } catch (err) {
      toast(err?.response?.data?.error || 'Promotion failed', 'error');
    } finally {
      setPromoting(false);
    }
  };

  const inp = "px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <>
      <Toasts toasts={toasts} />
      {showConfirm && (
        <ConfirmModal
          count={selected.size}
          newTerm={newTerm}
          newBatch={newBatch}
          onConfirm={confirmPromote}
          onClose={() => setShowConfirm(false)}
          loading={promoting}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Promote Students</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Bulk-move students to the next semester or batch</p>
        </div>

        {/* Success result */}
        {result && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              <span className="font-semibold">{result.count}</span> student{result.count !== 1 ? 's' : ''} promoted to Semester <span className="font-semibold">{result.term}</span>
              {result.batch ? ` · Batch ${result.batch}` : ''}.
            </p>
            <button onClick={() => setResult(null)} className="ml-auto"><X size={14} className="text-green-500" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* ── Left panel: Filters & Action ── */}
          <div className="space-y-4">
            {/* Filter panel */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Filter size={11} /> Filter Students
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Program</label>
                <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className={`w-full ${inp}`}>
                  <option value="">All Programs</option>
                  {programs.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Batch</label>
                <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className={`w-full ${inp}`}>
                  <option value="">All Batches</option>
                  {batches.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Current Semester</label>
                <select value={semFilter} onChange={e => setSemFilter(e.target.value)} className={`w-full ${inp}`}>
                  <option value="">All Semesters</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`w-full ${inp}`}>
                  <option value="">All</option>
                  {['Live', 'Detained', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Search</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Name or USN..."
                    className={`w-full pl-8 ${inp}`} />
                </div>
              </div>
            </div>

            {/* Promotion settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={11} /> Promotion Settings
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Target Semester <span className="text-red-500">*</span></label>
                <select value={newTerm} onChange={e => setNewTerm(e.target.value)} className={`w-full ${inp}`}>
                  <option value="">Select semester</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Update Batch <span className="text-gray-400 font-normal">(optional)</span></label>
                <select value={newBatch} onChange={e => setNewBatch(e.target.value)} className={`w-full ${inp}`}>
                  <option value="">Keep current</option>
                  {batches.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Update Status <span className="text-gray-400 font-normal">(optional)</span></label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className={`w-full ${inp}`}>
                  <option value="">Keep current</option>
                  {['Live', 'Completed', 'Detained', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <button
                onClick={handlePromote}
                disabled={selected.size === 0 || !newTerm}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
                <TrendingUp size={15} />
                Promote {selected.size > 0 ? `(${selected.size})` : ''} Students
              </button>
              {selected.size === 0 && (
                <p className="text-xs text-center text-gray-400">Select students from the list first</p>
              )}
            </div>
          </div>

          {/* ── Right panel: Student list ── */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-blue-600 transition-colors">
                    {selected.size === students.length && students.length > 0
                      ? <CheckSquare size={16} className="text-blue-600" />
                      : <Square size={16} />}
                  </button>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {selected.size > 0
                      ? <span className="font-semibold text-blue-600">{selected.size} selected</span>
                      : <span><span className="font-semibold text-gray-700 dark:text-slate-300">{total}</span> students</span>}
                  </span>
                </div>
                {selected.size > 0 && (
                  <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                    Clear selection
                  </button>
                )}
              </div>

              {/* List */}
              <div className="divide-y divide-gray-50 dark:divide-slate-700/50 max-h-[600px] overflow-y-auto">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-40" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-28" />
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-16" />
                    </div>
                  ))
                ) : students.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">No students match the selected filters</p>
                  </div>
                ) : (
                  students.map(s => {
                    const id = s._id || s.id;
                    const isSelected = selected.has(id);
                    const semLabel = s.term ? `Sem ${s.term}` : (s.semester ? `Sem ${s.semester}` : '—');
                    const statusLabel = s.admissionStatus || s.status || '—';

                    const statusColor = {
                      Live: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                      Detained: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
                      Completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                      Cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
                    }[statusLabel] || 'bg-gray-100 text-gray-500';

                    return (
                      <div
                        key={id}
                        onClick={() => toggle(id)}
                        className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors
                          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50/60 dark:hover:bg-slate-700/30'}`}>
                        <div className="text-gray-400 flex-shrink-0">
                          {isSelected
                            ? <CheckSquare size={16} className="text-blue-600" />
                            : <Square size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {s.fullName || s.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-0.5">
                            {s.student_id || s.usn || '—'} · {s.program || '—'} · {s.batch || '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{semLabel}</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                          <ChevronRight size={13} className="text-gray-300 dark:text-slate-600" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Eligibility legend */}
              {!loading && students.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-50 dark:border-slate-700/50 flex items-center gap-4 flex-wrap">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Eligibility:</p>
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle size={11} /> All criteria met</span>
                  <span className="flex items-center gap-1 text-xs text-orange-500"><AlertTriangle size={11} /> Criteria pending</span>
                  <p className="text-xs text-gray-400 dark:text-slate-500 ml-auto">
                    Note: Eligibility is advisory. Admin can promote any student.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
