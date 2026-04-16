import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, X, UserCheck, UserX, Shield, Users, Crown, Eye, EyeOff } from 'lucide-react';
import { getUsers, createUser, updateUser, deactivateUser, activateUser } from '../../services/userApi';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';

const ROLE_STYLE = {
  superadmin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  admin:      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  staff:      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-slate-400',
};
const ROLE_ICON = { superadmin: Crown, admin: Shield, staff: Users };

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff' };

function UserModal({ user, onClose, onSaved, currentUserRole }) {
  const [form, setForm] = useState(user ? { name: user.name, email: user.email, role: user.role, password: '' } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isEdit = !!user;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload = { name: form.name, role: form.role };
      if (!isEdit) { payload.email = form.email; payload.password = form.password; }
      else if (form.password) payload.password = form.password;
      if (isEdit) await updateUser(user._id, payload);
      else { payload.email = form.email; await createUser(payload); }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200";
  const availableRoles = currentUserRole === 'superadmin' ? ['staff', 'admin', 'superadmin'] : ['staff', 'admin'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{isEdit ? 'Edit User' : 'Add User'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {err && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{err}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Full Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="User's name" />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} placeholder="user@institution.edu" />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
              {isEdit ? 'New Password (leave blank to keep)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required={!isEdit}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className={`${inp} pr-10`}
                placeholder="Min 6 characters"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={inp}>
              {availableRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {form.role === 'staff' && 'Staff can view and create records but cannot delete or change configuration.'}
              {form.role === 'admin' && 'Admin has full access to all modules for this institution.'}
              {form.role === 'superadmin' && 'Superadmin has global access across all institutions.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | user object
  const { toasts, toast } = useToast();

  // Get current user role from localStorage/token
  const [currentUserRole] = useState(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return 'admin';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'admin';
    } catch { return 'admin'; }
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.q = search.trim();
      if (roleFilter) params.role = roleFilter;
      const { data } = await getUsers(params);
      setUsers(data.data || []);
    } catch { toast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, [search, roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (user) => {
    try {
      if (user.isActive) await deactivateUser(user._id);
      else await activateUser(user._id);
      toast(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (e) { toast(e.response?.data?.error || 'Failed', 'error'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <Toasts toasts={toasts} />
      {modal && (
        <UserModal
          user={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchUsers}
          currentUserRole={currentUserRole}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage staff and admin accounts for this institution</p>
          </div>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={15} /> Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-600' },
            { label: 'Active',      value: users.filter(u => u.isActive !== false).length, icon: UserCheck, color: 'bg-green-600' },
            { label: 'Inactive',    value: users.filter(u => u.isActive === false).length, icon: UserX, color: 'bg-red-500' },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center`}><c.icon size={18} className="text-white" /></div>
              <div><p className="text-xs text-gray-500 dark:text-slate-400">{c.label}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p></div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200" />
            </div>
            <div className="flex gap-1">
              {['', 'admin', 'staff', ...(currentUserRole === 'superadmin' ? ['superadmin'] : [])].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${roleFilter === r ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                  {r || 'All Roles'}
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
                {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-24" /></td>
                  ))}</tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No users found.</td></tr>
              ) : users.map(u => {
                const RoleIcon = ROLE_ICON[u.role] || Users;
                const isActive = u.isActive !== false;
                return (
                  <tr key={u._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLE[u.role] || ROLE_STYLE.staff}`}>
                        <RoleIcon size={10} />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 dark:text-slate-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                          title={isActive ? 'Deactivate' : 'Activate'}>
                          {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
