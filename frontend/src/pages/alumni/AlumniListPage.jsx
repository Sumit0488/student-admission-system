import { useState, useEffect, useCallback, useRef } from 'react';
import { GraduationCap, Plus, Search, Edit2, Trash2, X, Check, Linkedin, Mail, Phone, MapPin, Briefcase, Building2, TrendingUp } from 'lucide-react';
import { getAlumni, getAlumniStats, createAlumni, updateAlumni, deleteAlumni } from '../../services/alumniApi';
import { useAcademicConfig } from '../../hooks/useAcademicConfig';

// Fallback when MasterData seed hasn't been run yet
const FALLBACK_PROGRAMS = ['B.Tech', 'M.Tech', 'MBA', 'MCA', 'B.Sc', 'M.Sc', 'BCA', 'B.Com', 'M.Com', 'Ph.D', 'Other'];
const FALLBACK_BATCHES = ['2019-2023', '2020-2024', '2021-2025', '2022-2026', '2023-2027'];
const INDUSTRIES = ['Information Technology', 'Banking & Finance', 'Healthcare', 'Education', 'Manufacturing', 'Consulting', 'Government', 'Research', 'Entrepreneurship', 'Other'];
const STATUS_TABS = ['All', 'Active', 'Inactive'];

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

const EMPTY_FORM = {
  name: '', usn: '', email: '', personal_email: '', mobile_number: '', program: '', batch: '',
  graduation_year: '', cgpa: '', gender: '', dob: '', address: '',
  current_company: '', current_designation: '', current_location: '', industry: '',
  linkedin_url: '', higher_education: false, higher_education_institute: '',
  status: 'Active', notes: '',
};

function AddEditModal({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const { programs: configPrograms, batches: configBatches } = useAcademicConfig();
  const programs = configPrograms.length > 0 ? configPrograms : FALLBACK_PROGRAMS;
  const batches  = configBatches.length  > 0 ? configBatches  : FALLBACK_BATCHES;

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
    setErr('');
  }, [open, initial]);

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setErr('Name is required');
    setSaving(true); setErr('');
    try {
      if (initial?._id) await updateAlumni(initial._id, form);
      else await createAlumni(form);
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 dark:text-slate-100 placeholder-gray-400";
  const lbl = "block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {initial ? 'Edit Alumni' : 'Add New Alumni'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {err && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{err}</div>}

          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className={lbl}>Full Name *</label>
                <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" required />
              </div>
              <div>
                <label className={lbl}>USN</label>
                <input className={inp} value={form.usn} onChange={e => set('usn', e.target.value)} placeholder="USN / Roll No" />
              </div>
              <div>
                <label className={lbl}>Institute Email</label>
                <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@college.edu" />
              </div>
              <div>
                <label className={lbl}>Personal Email</label>
                <input className={inp} type="email" value={form.personal_email} onChange={e => set('personal_email', e.target.value)} placeholder="personal@gmail.com" />
              </div>
              <div>
                <label className={lbl}>Mobile Number</label>
                <input className={inp} value={form.mobile_number} onChange={e => set('mobile_number', e.target.value)} placeholder="10-digit mobile" />
              </div>
              <div>
                <label className={lbl}>Gender</label>
                <select className={inp} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select Gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Date of Birth</label>
                <input className={inp} type="date" value={form.dob ? form.dob.split('T')[0] : ''} onChange={e => set('dob', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Address</label>
                <textarea className={inp} rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Current address" />
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Academic Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={lbl}>Program</label>
                <select className={inp} value={form.program} onChange={e => set('program', e.target.value)}>
                  <option value="">Select Program</option>
                  {programs.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Batch</label>
                <select className={inp} value={form.batch} onChange={e => set('batch', e.target.value)}>
                  <option value="">Select Batch</option>
                  {configBatches.length > 0
                    ? configBatches.map(b => <option key={b}>{b}</option>)
                    : <option disabled>No batches in Settings</option>}
                </select>
              </div>
              <div>
                <label className={lbl}>Graduation Year</label>
                <input className={inp} type="number" min="1990" max="2030" value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} placeholder="2023" />
              </div>
              <div>
                <label className={lbl}>CGPA</label>
                <input className={inp} type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} placeholder="e.g. 8.5" />
              </div>
            </div>
          </div>

          {/* Career Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Career Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Current Company</label>
                <input className={inp} value={form.current_company} onChange={e => set('current_company', e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <label className={lbl}>Designation</label>
                <input className={inp} value={form.current_designation} onChange={e => set('current_designation', e.target.value)} placeholder="Job title" />
              </div>
              <div>
                <label className={lbl}>Industry</label>
                <select className={inp} value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Current Location</label>
                <input className={inp} value={form.current_location} onChange={e => set('current_location', e.target.value)} placeholder="City, State" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>LinkedIn URL</label>
                <input className={inp} value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="higher_edu" checked={form.higher_education} onChange={e => set('higher_education', e.target.checked)} className="rounded" />
                <label htmlFor="higher_edu" className="text-sm text-gray-700 dark:text-slate-300">Pursuing / Pursued Higher Education</label>
              </div>
              {form.higher_education && (
                <div>
                  <label className={lbl}>Higher Education Institute</label>
                  <input className={inp} value={form.higher_education_institute} onChange={e => set('higher_education_institute', e.target.value)} placeholder="University / Institute name" />
                </div>
              )}
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={lbl}>Notes</label>
              <textarea className={inp} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
            </div>
          </div>
        </form>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
          <button type="submit" onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={15} />}
            {saving ? 'Saving…' : 'Save Alumni'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlumniListPage() {
  const { programs: configPrograms, batches: configBatches } = useAcademicConfig();
  const pagePrograms = configPrograms.length > 0 ? configPrograms : FALLBACK_PROGRAMS;
  const pageBatches  = configBatches.length  > 0 ? configBatches  : FALLBACK_BATCHES;
  const [alumni, setAlumni] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('All');
  const [programFilter, setProgramFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchTimer = useRef(null);
  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.q = search;
      if (statusTab !== 'All') params.status = statusTab;
      if (programFilter) params.program = programFilter;
      if (yearFilter) params.graduation_year = yearFilter;
      const [listRes, statsRes] = await Promise.all([getAlumni(params), getAlumniStats()]);
      setAlumni(listRes.data.data || []);
      setTotal(listRes.data.total || 0);
      setStats(statsRes.data);
    } catch { }
    finally { setLoading(false); }
  }, [page, search, statusTab, programFilter, yearFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = v => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await deleteAlumni(deleteId); setDeleteId(null); fetchData(); }
    catch { } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={22} className="text-purple-600" /> Alumni Directory
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage alumni records, career info, and contacts</p>
        </div>
        <button onClick={() => { setEditTarget(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> Add Alumni
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Alumni', value: stats.total || 0, color: 'bg-purple-600', icon: GraduationCap },
            { label: 'Active', value: stats.active || 0, color: 'bg-green-600', icon: Check },
            { label: 'Employed', value: alumni.filter(a => a.current_company).length, color: 'bg-blue-600', icon: Briefcase },
            { label: 'Higher Education', value: alumni.filter(a => a.higher_education).length, color: 'bg-orange-500', icon: TrendingUp },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{c.label}</p>
                <div className={`w-7 h-7 rounded-lg ${c.color} flex items-center justify-center`}>
                  <c.icon size={14} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, USN, email, company..."
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 dark:text-slate-100"
            />
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
            {STATUS_TABS.map(t => (
              <button key={t} onClick={() => { setStatusTab(t); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                  ${statusTab === t ? 'bg-white dark:bg-slate-600 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                {t}
              </button>
            ))}
          </div>
          <select value={programFilter} onChange={e => { setProgramFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-slate-300">
            <option value="">All Programs</option>
            {pagePrograms.map(p => <option key={p}>{p}</option>)}
          </select>
          <input type="number" placeholder="Grad Year" value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-slate-300" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Alumni ID', 'Name / Contact', 'USN', 'Program / Batch', 'Company / Role', 'Location', 'Grad Year', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                ))}</tr>
              )) : alumni.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <GraduationCap size={36} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">No alumni records found</p>
                    <button onClick={() => { setEditTarget(null); setModalOpen(true); }}
                      className="mt-3 text-xs text-purple-600 hover:underline">Add first alumni</button>
                  </td>
                </tr>
              ) : alumni.map(a => (
                <tr key={a._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{a.alumni_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{a.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {a.personal_email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={10} />{a.personal_email}</span>}
                      {a.mobile_number && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={10} />{a.mobile_number}</span>}
                      {a.linkedin_url && <a href={a.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600"><Linkedin size={12} /></a>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{a.usn || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-800 dark:text-slate-200">{a.program || '—'}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">{a.batch || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {a.current_company ? (
                      <>
                        <div className="flex items-center gap-1 text-sm text-gray-800 dark:text-slate-200">
                          <Building2 size={12} className="text-gray-400 shrink-0" />{a.current_company}
                        </div>
                        {a.current_designation && <div className="text-xs text-gray-400 dark:text-slate-500 ml-4">{a.current_designation}</div>}
                      </>
                    ) : a.higher_education ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <TrendingUp size={11} /> Higher Education
                      </span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {a.current_location ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                        <MapPin size={11} />{a.current_location}
                      </span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300">{a.graduation_year || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold
                      ${a.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditTarget(a); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteId(a._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-500 dark:text-slate-400">Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1 text-xs rounded-lg border ${p === page ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">Next</button>
            </div>
          </div>
        )}
      </div>

      <AddEditModal open={modalOpen} initial={editTarget} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchData(); }} />

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Delete Alumni Record?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
                {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
