import { useState, useEffect, useCallback, useRef } from 'react';
import { Cpu, Plus, Search, Edit2, Trash2, X, Check, UserCheck, RotateCcw } from 'lucide-react';
import { getHostelDevices, createHostelDevice, updateHostelDevice, deleteHostelDevice, assignHostelDevice, returnHostelDevice } from '../../services/hostelApi';

const DEVICE_TYPES = ['Fan', 'Heater', 'Extension Board', 'AC', 'TV', 'Laptop', 'Mobile Charger', 'Refrigerator', 'Other'];
const CONDITIONS = ['Good', 'Fair', 'Poor'];
const STATUS_TABS = ['All', 'Available', 'Assigned', 'Under Maintenance', 'Damaged', 'Lost'];

const STATUS_STYLE = {
  Available:          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Assigned:           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Under Maintenance':'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Damaged:            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Lost:               'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
};

const EMPTY_FORM = {
  device_name: '', device_type: 'Fan', serial_number: '', brand: '',
  hostel_name: '', room_number: '', status: 'Available', condition: 'Good',
  student_name: '', usn: '', assigned_date: '', remarks: '',
};

function DeviceModal({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        ...EMPTY_FORM, ...initial,
        assigned_date: initial.assigned_date ? initial.assigned_date.split('T')[0] : '',
      } : EMPTY_FORM);
      setErr('');
    }
  }, [open, initial]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.device_name.trim()) return setErr('Device name is required');
    setSaving(true); setErr('');
    try {
      if (initial?._id) await updateHostelDevice(initial._id, form);
      else await createHostelDevice(form);
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
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{initial ? 'Edit Device' : 'Add Device'}</h2>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-3">
          {err && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{err}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lbl}>Device Name *</label>
              <input className={inp} value={form.device_name} onChange={e => set('device_name', e.target.value)} placeholder="e.g. Ceiling Fan" required />
            </div>
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} value={form.device_type} onChange={e => set('device_type', e.target.value)}>
                {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Brand</label>
              <input className={inp} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Brand name" />
            </div>
            <div>
              <label className={lbl}>Serial Number</label>
              <input className={inp} value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="Serial / Asset tag" />
            </div>
            <div>
              <label className={lbl}>Condition</label>
              <select className={inp} value={form.condition} onChange={e => set('condition', e.target.value)}>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
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
                {['Available', 'Assigned', 'Under Maintenance', 'Damaged', 'Lost'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {form.status === 'Assigned' && (
              <>
                <div className="col-span-2">
                  <label className={lbl}>Assigned To (Student Name)</label>
                  <input className={inp} value={form.student_name} onChange={e => set('student_name', e.target.value)} placeholder="Student name" />
                </div>
                <div>
                  <label className={lbl}>USN</label>
                  <input className={inp} value={form.usn} onChange={e => set('usn', e.target.value)} placeholder="Roll number" />
                </div>
                <div>
                  <label className={lbl}>Assigned Date</label>
                  <input className={inp} type="date" value={form.assigned_date} onChange={e => set('assigned_date', e.target.value)} />
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className={lbl}>Remarks</label>
              <textarea className={inp} rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional…" />
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save Device'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HostelDevicePage() {
  const [devices, setDevices] = useState([]);
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
      const res = await getHostelDevices(params);
      setDevices(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search, statusTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = v => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const handleReturn = async (device) => {
    await returnHostelDevice(device._id, { condition: 'Good' });
    fetchData();
  };

  const available = devices.filter(d => d.status === 'Available').length;
  const assigned = devices.filter(d => d.status === 'Assigned').length;
  const maintenance = devices.filter(d => d.status === 'Under Maintenance').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu size={22} className="text-blue-600" /> Hostel Devices
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Track devices and equipment in the hostel</p>
        </div>
        <button onClick={() => { setEditTarget(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> Add Device
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Devices', value: total, color: 'bg-blue-600' },
          { label: 'Available', value: available, color: 'bg-green-600' },
          { label: 'Assigned', value: assigned, color: 'bg-orange-500' },
          { label: 'Maintenance', value: maintenance, color: 'bg-yellow-500' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${c.color} flex items-center justify-center`}>
              <Cpu size={16} className="text-white" />
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
          <input type="text" placeholder="Search device, serial, student…" onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-slate-100" />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-x-auto">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => { setStatusTab(t); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap
                ${statusTab === t ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Device ID', 'Device', 'Type', 'Serial #', 'Hostel / Room', 'Assigned To', 'Assigned Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-16" /></td>)}</tr>
              )) : devices.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-16 text-center">
                  <Cpu size={36} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-400">No devices found</p>
                  <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="mt-2 text-xs text-blue-600 hover:underline">Add first device</button>
                </td></tr>
              ) : devices.map(d => (
                <tr key={d._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{d.device_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{d.device_name}</div>
                    {d.brand && <div className="text-xs text-gray-400">{d.brand}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300">{d.device_type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{d.serial_number || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{d.hostel_name || '—'} / {d.room_number || '—'}</td>
                  <td className="px-4 py-3">
                    {d.student_name ? (
                      <div>
                        <div className="text-sm text-gray-800 dark:text-slate-200">{d.student_name}</div>
                        {d.usn && <div className="text-xs text-gray-400 font-mono">{d.usn}</div>}
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                    {d.assigned_date ? new Date(d.assigned_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {d.status === 'Assigned' && (
                        <button onClick={() => handleReturn(d)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors" title="Return Device">
                          <RotateCcw size={13} />
                        </button>
                      )}
                      <button onClick={() => { setEditTarget(d); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteId(d._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
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
            <span className="text-xs text-gray-500">Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}</span>
            <div className="flex gap-1">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40">Prev</button>
              <button disabled={page===Math.ceil(total/LIMIT)} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <DeviceModal open={modalOpen} initial={editTarget} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchData(); }} />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Delete Device?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600">Cancel</button>
              <button onClick={async () => { await deleteHostelDevice(deleteId); setDeleteId(null); fetchData(); }}
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
