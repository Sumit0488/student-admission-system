import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Building2, Users, CheckCircle, XCircle,
  Edit2, Trash2, LogIn, X, Eye, EyeOff, ToggleLeft, ToggleRight,
  Globe, Phone, MapPin, Crown,
} from 'lucide-react';
import {
  getSuperAdminStats, getTenants, createTenant, updateTenant,
  toggleTenant, deleteTenant, impersonateTenant,
} from '../../services/superAdminApi';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';

// ── Create / Edit Tenant Modal ────────────────────────────────────────────────
const EMPTY = {
  name: '', domain: '', address: '', city: '', state: '', phone: '', website: '',
  adminName: '', adminEmail: '', adminPassword: '',
};

function TenantModal({ tenant, onClose, onSaved }) {
  const isEdit = !!tenant;
  const [form, setForm] = useState(
    isEdit
      ? { name: tenant.name || '', domain: tenant.domain || '', address: tenant.address || '',
          city: tenant.city || '', state: tenant.state || '', phone: tenant.phone || '',
          website: tenant.website || '' }
      : { ...EMPTY }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inp = "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200 placeholder:text-gray-400";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      if (isEdit) {
        await updateTenant(tenant._id, {
          name: form.name, domain: form.domain, address: form.address,
          city: form.city, state: form.state, phone: form.phone, website: form.website,
        });
      } else {
        await createTenant(form);
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Institution' : 'Add New Institution'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {err && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{err}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Institution Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="University / College name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Domain</label>
              <input value={form.domain} onChange={e => set('domain', e.target.value)} className={inp} placeholder="college.edu" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} placeholder="+91 99999 99999" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} className={inp} placeholder="Street address" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} className={inp} placeholder="City" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">State</label>
              <input value={form.state} onChange={e => set('state', e.target.value)} className={inp} placeholder="State" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Website</label>
            <input value={form.website} onChange={e => set('website', e.target.value)} className={inp} placeholder="https://college.edu" />
          </div>

          {/* Admin user — only on create */}
          {!isEdit && (
            <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Admin Account</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Admin Name</label>
                <input value={form.adminName} onChange={e => set('adminName', e.target.value)} className={inp} placeholder="Admin full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Admin Email *</label>
                <input required type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} className={inp} placeholder="admin@college.edu" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Admin Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showPwd ? 'text' : 'password'}
                    value={form.adminPassword}
                    onChange={e => set('adminPassword', e.target.value)}
                    className={`${inp} pr-10`}
                    placeholder="Min 6 characters"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create Institution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ tenant, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteTenant(tenant._id); onDeleted(); onClose(); }
    catch (e) { alert(e.response?.data?.error || 'Failed to delete'); setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-center font-semibold text-gray-900 dark:text-white mb-1">Delete Institution</h3>
        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-5">
          Delete <strong className="text-gray-800 dark:text-white">{tenant.name}</strong>? All users will be deactivated. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Super Admin Page ─────────────────────────────────────────────────────
export default function SuperAdminPage() {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'add' | tenant object (edit)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [impersonating, setImpersonating] = useState(null);
  const { toasts, toast } = useToast();
  const LIMIT = 15;

  const fetchStats = useCallback(async () => {
    try { const { data } = await getSuperAdminStats(); setStats(data.data); }
    catch {}
  }, []);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search.trim()) params.q = search.trim();
      if (statusFilter) params.status = statusFilter;
      const { data } = await getTenants(params);
      setTenants(data.data || []);
      setTotal(data.total || 0);
    } catch { toast('Failed to load institutions', 'error'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);
  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleToggle = async (tenant) => {
    try {
      await toggleTenant(tenant._id);
      toast(`${tenant.name} ${tenant.isActive ? 'deactivated' : 'activated'}`);
      fetchTenants(); fetchStats();
    } catch (e) { toast(e.response?.data?.error || 'Failed', 'error'); }
  };

  const handleImpersonate = async (tenant) => {
    setImpersonating(tenant._id);
    try {
      const { data } = await impersonateTenant(tenant._id);
      // Store impersonation token temporarily and reload
      const originalToken = localStorage.getItem('auth_token');
      localStorage.setItem('auth_token_original', originalToken);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('impersonating', JSON.stringify({ name: data.tenant.name, id: data.tenant.id }));
      toast(`Switched to ${data.tenant.name}`, 'success');
      setTimeout(() => { window.location.href = '/admin/dashboard'; }, 800);
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to impersonate', 'error');
    } finally { setImpersonating(null); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <Toasts toasts={toasts} />
      {modal && (
        <TenantModal
          tenant={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { fetchTenants(); fetchStats(); }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          tenant={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { fetchTenants(); fetchStats(); toast('Institution deleted'); }}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Crown size={18} className="text-purple-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Super Admin Panel</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Manage all institutions globally</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { fetchTenants(); fetchStats(); }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Plus size={15} /> Add Institution
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Institutions', value: stats?.totalTenants ?? '—', icon: Building2, color: 'bg-purple-600' },
            { label: 'Active', value: stats?.activeTenants ?? '—', icon: CheckCircle, color: 'bg-green-600' },
            { label: 'Inactive', value: stats?.inactiveTenants ?? '—', icon: XCircle, color: 'bg-red-500' },
            { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'bg-blue-600' },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center flex-shrink-0`}>
                <c.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">{c.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, code, or domain..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-slate-200"
              />
            </div>
            <div className="flex gap-1">
              {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, label]) => (
                <button key={val} onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === val ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Institution', 'Contact', 'Users', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-24" /></td>
                  ))}</tr>
                ))
              ) : tenants.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No institutions found.</td></tr>
              ) : tenants.map(t => (
                <tr key={t._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold flex-shrink-0">
                        {t.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
                        {t.domain && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                            <Globe size={10} /> {t.domain}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 dark:text-slate-400">
                    {t.city && <p className="flex items-center gap-1"><MapPin size={10} /> {t.city}{t.state ? `, ${t.state}` : ''}</p>}
                    {t.phone && <p className="flex items-center gap-1 mt-0.5"><Phone size={10} /> {t.phone}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      <Users size={10} /> {t.userCount ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${t.isActive !== false ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      {t.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 dark:text-slate-500">{fmtDate(t.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleToggle(t)}
                        className={`p-1.5 rounded-lg transition-colors ${t.isActive !== false ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                        title={t.isActive !== false ? 'Deactivate' : 'Activate'}
                      >
                        {t.isActive !== false ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                      <button
                        onClick={() => handleImpersonate(t)}
                        disabled={impersonating === t._id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-40"
                        title="Impersonate (login as this tenant's admin)"
                      >
                        <LogIn size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-600">
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span key={`e${p}`} className="px-2 text-gray-400 self-center text-xs">…</span>}
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg ${p === page ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                      {p}
                    </button>
                  </>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-600">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
