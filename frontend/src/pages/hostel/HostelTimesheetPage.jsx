import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Plus, Search, Edit2, Trash2, X, Check, Calendar, Users } from 'lucide-react';
import { getHostelTimesheet, createHostelTimesheet, updateHostelTimesheet, deleteHostelTimesheet } from '../../services/hostelApi';

const STATUS_OPTS = ['Present', 'Absent', 'Late', 'Leave', 'Half Day'];
const LEAVE_TYPES = ['Home', 'Medical', 'Official', 'Other'];
const STATUS_TABS = ['All', 'Present', 'Absent', 'Late', 'Leave', 'Half Day'];

const STATUS_STYLE = {
  Present:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Absent:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Late:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Leave:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Half Day': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const EMPTY_FORM = {
  student_name: '', usn: '', hostel_name: '', room_number: '',
  date: new Date().toISOString().split('T')[0],
  check_in: '', check_out: '', status: 'Present',
  leave_type: '', remarks: '',
};

function TimesheetModal({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...EMPTY_FORM, ...initial, date: initial.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0] } : EMPTY_FORM);
      setErr('');
    }
  }, [open, initial]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.student_name.trim()) return setErr('Student name is required');
    setSaving(true); setErr('');
    try {
      if (initial?._id) await updateHostelTimesheet(initial._id, form);
      else await createHostelTimesheet(form);
      onSaved();
    } catch (e) { setErr(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-slate-100";
  const lbl = "block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{initial ? 'Edit Record' : 'Add Attendance Record'}</h2>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-3">
          {err && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{err}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lbl}>Student Name *</label>
              <input className={inp} value={form.student_name} onChange={e => set('student_name', e.target.value)} placeholder="Full name" required />
            </div>
            <div>
              <label className={lbl}>USN</label>
              <input className={inp} value={form.usn} onChange={e => set('usn', e.target.value)} placeholder="Roll number" />
            </div>
            <div>
              <label className={lbl}>Date</label>
              <input className={inp} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Hostel Name</label>
              <input className={inp} value={form.hostel_name} onChange={e => set('hostel_name', e.target.value)} placeholder="Hostel" />
            </div>
            <div>
              <label className={lbl}>Room Number</label>
              <input className={inp} value={form.room_number} onChange={e => set('room_number', e.target.value)} placeholder="Room" />
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {form.status === 'Leave' && (
              <div>
                <label className={lbl}>Leave Type</label>
                <select className={inp} value={form.leave_type} onChange={e => set('leave_type', e.target.value)}>
                  <option value="">Select</option>
                  {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            )}
            {(form.status === 'Present' || form.status === 'Late') && (
              <>
                <div>
                  <label className={lbl}>Check In Time</label>
                  <input className={inp} type="time" value={form.check_in} onChange={e => set('check_in', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Check Out Time</label>
                  <input className={inp} type="time" value={form.check_out} onChange={e => set('check_out', e.target.value)} />
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className={lbl}>Remarks</label>
              <textarea className={inp} rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional remarks…" />
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HostelTimesheetPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState('All');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);
  const LIMIT = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.q = search;
      if (statusTab !== 'All') params.status = statusTab;
      if (dateFilter) params.date = dateFilter;
      const res = await getHostelTimesheet(params);
      setRecords(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search, statusTab, dateFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = v => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const onLeave = records.filter(r => r.status === 'Leave').length;
  const late = records.filter(r => r.status === 'Late').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={22} className="text-blue-600" /> Hostel Timesheet
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Resident attendance and check-in/check-out records</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
          <button onClick={() => { setEditTarget(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Day Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present', value: present, color: 'bg-green-500' },
          { label: 'Absent', value: absent, color: 'bg-red-500' },
          { label: 'Late', value: late, color: 'bg-orange-500' },
          { label: 'On Leave', value: onLeave, color: 'bg-blue-500' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${c.color} flex items-center justify-center`}>
              <Users size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{c.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{loading ? '—' : c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search student, USN…" onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-slate-100" />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => { setStatusTab(t); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${statusTab === t ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {dateFilter ? new Date(dateFilter).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'All Dates'}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400">{total} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Record ID', 'Student Name', 'USN', 'Hostel / Room', 'Date', 'Check In', 'Check Out', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-16" /></td>)}</tr>
              )) : records.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-16 text-center">
                  <Clock size={36} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-400">No attendance records for this date</p>
                  <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="mt-2 text-xs text-blue-600 hover:underline">Add first record</button>
                </td></tr>
              ) : records.map(r => (
                <tr key={r._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.record_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.student_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.usn || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{r.hostel_name || '—'} / {r.room_number || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300">
                    {r.date ? new Date(r.date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300">{r.check_in || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300">{r.check_out || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                    {r.leave_type && <span className="ml-1 text-xs text-gray-400">({r.leave_type})</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditTarget(r); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteId(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / LIMIT) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
            <div className="flex gap-1">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40">Prev</button>
              <button disabled={page===Math.ceil(total/LIMIT)} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <TimesheetModal open={modalOpen} initial={editTarget} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchData(); }} />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Delete Record?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600">Cancel</button>
              <button onClick={async () => { await deleteHostelTimesheet(deleteId); setDeleteId(null); fetchData(); }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
