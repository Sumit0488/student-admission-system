import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { getFeeSchedules, getFeeScheduleStats, getFeeCategories } from '../../services/feeApi';
import { getMasterData } from '../../services/configApi';
import NewScheduleWizard from '../../components/NewScheduleWizard';

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
  draft:    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  active:   'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  inactive: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function ScheduleCard({ schedule, onClick }) {
  const status   = schedule.fee_sched_status || 'draft';
  const stats    = schedule._stats || {};
  const totalAmt = stats.total_amount || 0;
  const paidAmt  = stats.paid_amount  || 0;
  const totalOrders = stats.total     || 0;
  const collPct  = totalAmt > 0 ? ((paidAmt / totalAmt) * 100).toFixed(0) : 0;
  const fmt = (n) => (n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹ 0');

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="h-1 bg-gradient-to-r from-[#002250] to-blue-500" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">
            {schedule.fee_sched_name || schedule.fee_id}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
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
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px]">Term / Semester</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              {schedule.semester || (schedule.term ? `Sem ${schedule.term}` : schedule.year_of_study ? `Year ${schedule.year_of_study}` : '—')}
            </p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px]">Stream</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium truncate">
              {schedule.stream?.stream_name || schedule.stream_name || '—'}
            </p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px]">Orders</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{totalOrders}</p>
          </div>
        </div>

        {totalOrders > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Collected: <span className="font-semibold text-green-600 dark:text-green-400">{fmt(paidAmt)}</span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{collPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, collPct)}%` }}
              />
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

// ── Filter bar ────────────────────────────────────────────────────────────────
const selectCls =
  'px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';

function FilterBar({ filters, onChange, streams, academicYears, categories }) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
      <Filter size={14} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />

      {/* Stream */}
      <select
        value={filters.stream}
        onChange={(e) => onChange('stream', e.target.value)}
        className={selectCls}
      >
        <option value="">All Streams</option>
        {streams.map((s) => (
          <option key={s._id} value={s.label}>{s.label}</option>
        ))}
      </select>

      {/* Academic Year */}
      <select
        value={filters.academic_year}
        onChange={(e) => onChange('academic_year', e.target.value)}
        className={selectCls}
      >
        <option value="">All Academic Years</option>
        {academicYears.map((y) => (
          <option key={y._id} value={y.label}>{y.label}</option>
        ))}
      </select>

      {/* Fee Category */}
      <select
        value={filters.fee_category}
        onChange={(e) => onChange('fee_category', e.target.value)}
        className={selectCls}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c.fee_category}>{c.fee_category}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => onChange('status', e.target.value)}
        className={selectCls}
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Clear filters */}
      {(filters.stream || filters.academic_year || filters.fee_category || filters.status) && (
        <button
          onClick={() => onChange('__clear__', '')}
          className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FeeTrackerPage() {
  const navigate = useNavigate();
  const [schedules, setSchedules]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showWizard, setShowWizard]   = useState(false);
  const { toasts, toast }             = useToast();

  // Filter option lists (fetched from settings)
  const [streams, setStreams]         = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [categories, setCategories]   = useState([]);

  // Active filter values
  const [filters, setFilters] = useState({
    stream: '',
    academic_year: '',
    fee_category: '',
    status: '',
  });

  const handleFilterChange = (key, value) => {
    if (key === '__clear__') {
      setFilters({ stream: '', academic_year: '', fee_category: '', status: '' });
    } else {
      setFilters((p) => ({ ...p, [key]: value }));
    }
  };

  // Load fee schedules with stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getFeeSchedules();
      const list = data.data || [];
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

  // Load filter options from settings
  useEffect(() => {
    getMasterData('stream')
      .then(({ data }) => setStreams(data.data || []))
      .catch(() => {});
    getMasterData('academic_year')
      .then(({ data }) => setAcademicYears(data.data || []))
      .catch(() => {});
    getFeeCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Client-side filter
  const visible = schedules.filter((s) => {
    const streamName = s.stream?.stream_name || s.stream_name || '';
    if (filters.stream        && streamName !== filters.stream)               return false;
    if (filters.academic_year && s.academic_year !== filters.academic_year)   return false;
    if (filters.fee_category  && s.fee_category  !== filters.fee_category)    return false;
    if (filters.status        && (s.fee_sched_status || 'draft') !== filters.status) return false;
    return true;
  });

  return (
    <>
      <Toasts toasts={toasts} />

      {showWizard && (
        <NewScheduleWizard
          onClose={() => setShowWizard(false)}
          onCreated={(s) => {
            setSchedules((p) => [{ ...s, _stats: {} }, ...p]);
            setShowWizard(false);
            toast('Fee schedule created');
          }}
          toast={toast}
        />
      )}

      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fee Tracker</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Manage fee schedules for all streams and academic years
            </p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Schedule
          </button>
        </div>

        {/* Filter bar */}
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          streams={streams}
          academicYears={academicYears}
          categories={categories}
        />

        {/* Result count */}
        {!loading && (
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Showing {visible.length} of {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Schedule grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse"
              >
                <div className="h-24 bg-gray-200 dark:bg-slate-700" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar size={48} className="text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">
              {schedules.length === 0 ? 'No fee schedules yet' : 'No schedules match the selected filters'}
            </p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
              {schedules.length === 0
                ? 'Click "New Schedule" to create your first fee schedule'
                : 'Try adjusting or clearing the filters above'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((s) => (
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
