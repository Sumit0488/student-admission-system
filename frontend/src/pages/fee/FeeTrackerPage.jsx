import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';
import { getFeeSchedules, createFeeSchedule, getFeeScheduleStats } from '../../services/feeApi';

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
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto
          ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {t.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  inactive: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function ScheduleCard({ schedule, onClick }) {
  const status = schedule.fee_sched_status || 'draft';
  const stats = schedule._stats || {};
  const totalAmt = stats.total_amount || 0;
  const paidAmt = stats.paid_amount || 0;
  const totalOrders = stats.total || 0;
  const collPct = totalAmt > 0 ? ((paidAmt / totalAmt) * 100).toFixed(0) : 0;
  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹ 0';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Top color bar */}
      <div className="h-1 bg-gradient-to-r from-[#002250] to-blue-500" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">
            {schedule.fee_sched_name || schedule.fee_id}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[status]}`}>
            {status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px]">Category</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium truncate">{schedule.fee_category || '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px]">Academic Year</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{schedule.academic_year}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px]">Term/Year</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{schedule.term ? `Sem ${schedule.term}` : schedule.year_of_study ? `Year ${schedule.year_of_study}` : '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px]">Orders</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{totalOrders}</p>
          </div>
        </div>

        {/* Collection stats */}
        {totalOrders > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Collected: <span className="font-semibold text-green-600 dark:text-green-400">{fmt(paidAmt)}</span></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{collPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, collPct)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Total: {fmt(totalAmt)}</p>
          </div>
        )}

        <button className="w-full mt-1 py-1.5 text-xs font-semibold text-white bg-[#002250] hover:bg-[#003780] rounded-lg transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  fee_category: '',
  academic_year: '',
  stream_code: '',
  stream_name: '',
  year_of_study: '',
  fee_type: 'GENERAL',
  start_date: '',
  end_date: '',
  fee_sched_name: '',
  entity: 'fee_schedule',
};

function AddModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        stream: { stream_code: form.stream_code, stream_name: form.stream_name },
        year_of_study: form.year_of_study ? parseInt(form.year_of_study) : undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">New Fee Schedule</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Schedule Name</label>
              <input value={form.fee_sched_name} onChange={(e) => set('fee_sched_name', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Category *</label>
              <input required value={form.fee_category} onChange={(e) => set('fee_category', e.target.value)}
                placeholder="e.g. Admission"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Academic Year *</label>
              <input required value={form.academic_year} onChange={(e) => set('academic_year', e.target.value)}
                placeholder="e.g. 2025-2026"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Stream Code</label>
              <input value={form.stream_code} onChange={(e) => set('stream_code', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Stream Name</label>
              <input value={form.stream_name} onChange={(e) => set('stream_name', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Year of Study</label>
              <select value={form.year_of_study} onChange={(e) => set('year_of_study', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Select Year</option>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Type</label>
              <select value={form.fee_type} onChange={(e) => set('fee_type', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="GENERAL">GENERAL</option>
                <option value="EXAM">EXAM</option>
                <option value="REVAL">REVAL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeeTrackerPage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { toasts, toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getFeeSchedules();
      const list = data.data || [];
      // Fetch stats for each schedule in parallel (best-effort)
      const statsResults = await Promise.allSettled(
        list.map((s) => getFeeScheduleStats(s._id))
      );
      const enriched = list.map((s, i) => ({
        ...s,
        _stats: statsResults[i].status === 'fulfilled'
          ? statsResults[i].value.data?.data?.overall || {}
          : {},
      }));
      setSchedules(enriched);
    } catch {
      toast('Failed to load fee schedules', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (payload) => {
    try {
      const { data } = await createFeeSchedule(payload);
      setSchedules((p) => [data.data, ...p]);
      toast('Fee schedule created');
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create schedule', 'error');
      throw err;
    }
  };

  return (
    <>
      <Toasts toasts={toasts} />
      {showModal && <AddModal onClose={() => setShowModal(false)} onSave={handleCreate} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fee Tracker</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Manage fee schedules for all streams and academic years
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            New Schedule
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-slate-700" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar size={48} className="text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">No fee schedules yet</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Click "New Schedule" to create your first fee schedule</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {schedules.map((s) => (
              <ScheduleCard
                key={s._id}
                schedule={s}
                onClick={() => navigate(`/admin/fee/tracker/${s._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
