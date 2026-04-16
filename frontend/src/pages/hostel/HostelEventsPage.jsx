import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarDays, Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react';
import { getHostelEvents, createHostelEvent, updateHostelEvent, deleteHostelEvent } from '../../services/hostelApi';

const EVENT_TYPES = ['Cultural', 'Sports', 'Meeting', 'Maintenance', 'Inspection', 'Social', 'Other'];
const STATUS_TABS = ['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const STATUS_STYLE = {
  Upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Ongoing:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Completed:'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  Cancelled:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TYPE_COLORS = {
  Cultural: 'bg-purple-100 text-purple-700', Sports: 'bg-green-100 text-green-700',
  Meeting: 'bg-blue-100 text-blue-700', Maintenance: 'bg-orange-100 text-orange-700',
  Inspection: 'bg-yellow-100 text-yellow-700', Social: 'bg-pink-100 text-pink-700',
  Other: 'bg-gray-100 text-gray-600',
};

const EMPTY_FORM = {
  title: '', description: '', event_type: 'Cultural', hostel_name: '', venue: '',
  event_date: new Date().toISOString().split('T')[0], end_date: '',
  organizer: '', contact: '', participants_count: 0, status: 'Upcoming', notes: '',
};

function EventModal({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        ...EMPTY_FORM, ...initial,
        event_date: initial.event_date ? initial.event_date.split('T')[0] : '',
        end_date: initial.end_date ? initial.end_date.split('T')[0] : '',
      } : EMPTY_FORM);
      setErr('');
    }
  }, [open, initial]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) return setErr('Title is required');
    setSaving(true); setErr('');
    try {
      if (initial?._id) await updateHostelEvent(initial._id, form);
      else await createHostelEvent(form);
      onSaved();
    } catch (e) { setErr(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-slate-100";
  const lbl = "block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{initial ? 'Edit Event' : 'Add Hostel Event'}</h2>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-3">
          {err && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{err}</div>}
          <div>
            <label className={lbl}>Event Title *</label>
            <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event title" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Event Type</label>
              <select className={inp} value={form.event_type} onChange={e => set('event_type', e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Event Date</label>
              <input className={inp} type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>End Date</label>
              <input className={inp} type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Hostel Name</label>
              <input className={inp} value={form.hostel_name} onChange={e => set('hostel_name', e.target.value)} placeholder="Hostel / Block" />
            </div>
            <div>
              <label className={lbl}>Venue</label>
              <input className={inp} value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Location" />
            </div>
            <div>
              <label className={lbl}>Organizer</label>
              <input className={inp} value={form.organizer} onChange={e => set('organizer', e.target.value)} placeholder="Person / Dept" />
            </div>
            <div>
              <label className={lbl}>Contact</label>
              <input className={inp} value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Phone / email" />
            </div>
            <div>
              <label className={lbl}>Participants</label>
              <input className={inp} type="number" min="0" value={form.participants_count} onChange={e => set('participants_count', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Description</label>
            <textarea className={inp} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Event description…" />
          </div>
          <div>
            <label className={lbl}>Notes</label>
            <textarea className={inp} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes…" />
          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HostelEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);
  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.q = search;
      if (statusTab !== 'All') params.status = statusTab;
      const res = await getHostelEvents(params);
      setEvents(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search, statusTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = v => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays size={22} className="text-blue-600" /> Hostel Events
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage hostel events and activities</p>
        </div>
        <button onClick={() => { setEditTarget(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search events…" onChange={e => handleSearch(e.target.value)}
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

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
          <p className="text-sm text-gray-400">No events found</p>
          <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="mt-2 text-xs text-blue-600 hover:underline">Create first event</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <div key={ev._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[ev.event_type] || 'bg-gray-100 text-gray-600'}`}>{ev.event_type}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[ev.status] || 'bg-gray-100 text-gray-600'}`}>{ev.status}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{ev.title}</h3>
                {ev.description && <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">{ev.description}</p>}
                <div className="space-y-1 text-xs text-gray-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={11} />
                    {fmtDate(ev.event_date)}{ev.end_date ? ` – ${fmtDate(ev.end_date)}` : ''}
                  </div>
                  {ev.venue && <div>📍 {ev.venue}</div>}
                  {ev.organizer && <div>👤 {ev.organizer}</div>}
                  {ev.participants_count > 0 && <div>👥 {ev.participants_count} participants</div>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-50 dark:border-slate-700">
                <button onClick={() => { setEditTarget(ev); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setDeleteId(ev._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {Math.ceil(total / LIMIT) > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-slate-400">{total} total events</span>
          <div className="flex gap-1">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={page===Math.ceil(total/LIMIT)} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}

      <EventModal open={modalOpen} initial={editTarget} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchData(); }} />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Delete Event?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600">Cancel</button>
              <button onClick={async () => { await deleteHostelEvent(deleteId); setDeleteId(null); fetchData(); }}
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
