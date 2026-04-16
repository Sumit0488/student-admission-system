import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, GraduationCap, UserCheck, ClipboardList,
  CreditCard, Users, ScrollText, ArrowLeftRight, Settings,
  Plus, Trash2, CheckCircle, AlertCircle, ChevronRight,
} from 'lucide-react';
import { getMasterData, addMasterData, deleteMasterData, seedMasterData } from '../../services/configApi';
import { getMe, getInstitution, updateInstitution } from '../../services/authApi';

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

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'general',      label: 'General Setting',    icon: Building2,     to: '/admin/config/general'      },
  { key: 'academic',     label: 'Academic Setting',   icon: GraduationCap, to: '/admin/config/academic'     },
  { key: 'onboarding',   label: 'Student Onboarding', icon: UserCheck,     to: '/admin/config/onboarding'   },
  { key: 'admission',    label: 'Admission Setting',  icon: ClipboardList, to: '/admin/config/admission'    },
  { key: 'fee-template', label: 'Fee Template',       icon: CreditCard,    to: '/admin/config/fee-template' },
  { key: 'users',        label: 'User Management',    icon: Users,         to: '/admin/config/users'        },
  { key: 'data',         label: 'Data Management',    icon: ScrollText,    to: '/admin/config/data'         },
  { key: 'integration',  label: 'Integration',        icon: ArrowLeftRight,to: '/admin/config/integration'  },
];

// ── Placeholder ───────────────────────────────────────────────────────────────
function ComingSoon({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
        <Settings size={28} className="text-blue-400" />
      </div>
      <p className="text-lg font-semibold text-gray-700 dark:text-slate-300">{label}</p>
      <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">This section is coming soon.</p>
    </div>
  );
}

// ── Master Data List (generic) ─────────────────────────────────────────────────
function MasterDataList({ type, label }) {
  const [items, setItems] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toasts, toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMasterData(type);
      setItems(res.data?.data || []);
    } catch {
      toast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const res = await addMasterData({ type, label: newLabel.trim() });
      setItems((p) => [...p, res.data?.data]);
      setNewLabel('');
      toast(`${label} added successfully`);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to add', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMasterData(id);
      setItems((p) => p.filter((i) => i._id !== id));
      toast('Removed successfully');
    } catch {
      toast('Failed to remove', 'error');
    }
  };

  return (
    <>
      <Toasts toasts={toasts} />
      <div className="space-y-4">
        {/* Add form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={`Add new ${label}...`}
            className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={adding || !newLabel.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        </form>

        {/* List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 dark:text-slate-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-slate-500">No {label.toLowerCase()} entries yet.</div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {items.map((item) => (
                <li key={item._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{item.label}</span>
                  {item.isUserAddable && (
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// ── General Setting ───────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{value || '—'}</p>
    </div>
  );
}

function EditInstitutionDialog({ institution, onClose, onSaved, toast }) {
  const [form, setForm] = useState({ ...institution });
  const [saving, setSaving] = useState(false);
  const inputCls = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateInstitution(form);
      toast('Institution updated successfully');
      onSaved(form);
      onClose();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to update', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Edit Institution</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Institution Name', key: 'name' },
              { label: 'Short Name / Code', key: 'code' },
              { label: 'Domain', key: 'domain', placeholder: 'e.g. college.edu' },
              { label: 'Phone', key: 'phone', placeholder: '+91 00000 00000' },
              { label: 'Website', key: 'website', placeholder: 'https://college.edu' },
              { label: 'Pin Code', key: 'pin_code' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input value={form[key] || ''} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className={inputCls} placeholder={placeholder || ''} />
              </div>
            ))}
          </div>
          {[
            { label: 'Address', key: 'address' },
            { label: 'City', key: 'city' },
            { label: 'State', key: 'state' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input value={form[key] || ''} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className={inputCls} />
            </div>
          ))}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GeneralSetting() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [institution, setInstitution] = useState({ name: '', code: '', domain: '', address: '', city: '', state: '', pin_code: '', phone: '', website: '' });
  const [avatar, setAvatar] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toasts, toast } = useToast();

  useEffect(() => {
    Promise.all([getMe(), getInstitution()])
      .then(([meRes, instRes]) => {
        const u = meRes.data.user;
        setProfile({ name: u.name || '', email: u.email || '' });
        const t = instRes.data.data;
        setInstitution({ name: t.name || '', code: t.code || '', domain: t.domain || '', address: t.address || '', city: t.city || '', state: t.state || '', pin_code: t.pin_code || '', phone: t.phone || '', website: t.website || '' });
      })
      .catch(() => toast('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
    const saved = JSON.parse(window.localStorage.getItem('appConfig-personal') || '{}');
    if (saved.avatar) setAvatar(saved.avatar);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      const s = JSON.parse(window.localStorage.getItem('appConfig-personal') || '{}');
      window.localStorage.setItem('appConfig-personal', JSON.stringify({ ...s, avatar: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="py-20 text-center text-sm text-gray-400 dark:text-slate-500">Loading...</div>;

  return (
    <>
      <Toasts toasts={toasts} />
      {showEdit && (
        <EditInstitutionDialog
          institution={institution}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setInstitution((p) => ({ ...p, ...updated }))}
          toast={toast}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col: Logo card */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 overflow-hidden flex items-center justify-center">
                {avatar ? <img src={avatar} alt="logo" className="w-full h-full object-cover" /> : <Building2 size={36} className="text-blue-300" />}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow">
                <Plus size={13} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{institution.name || 'Institution Name'}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 mt-1">Active</span>
            </div>
          </div>

          {/* Registration info card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Registration Info</p>
            <div className="space-y-3">
              <InfoRow label="Institution Code" value={institution.code} />
              <InfoRow label="Domain" value={institution.domain} />
              <InfoRow label="Admin Email" value={profile.email} />
            </div>
          </div>
        </div>

        {/* Right col: Organization Info + Contact Info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Organization Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Organization Info</p>
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <Settings size={12} /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Organization Name" value={institution.name} />
              <InfoRow label="Short Name / Code" value={institution.code} />
              <InfoRow label="Admin Name" value={profile.name} />
              <InfoRow label="Admin Email" value={profile.email} />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Contact Information</p>
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <Settings size={12} /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Phone" value={institution.phone} />
              <InfoRow label="Website" value={institution.website} />
              <InfoRow label="Address" value={institution.address} />
              <InfoRow label="City" value={institution.city} />
              <InfoRow label="State" value={institution.state} />
              <InfoRow label="Pin Code" value={institution.pin_code} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Academic Setting ──────────────────────────────────────────────────────────
function AcademicSetting() {
  const navigate = useNavigate();

  const ITEMS = [
    { key: 'stream', label: 'Stream', desc: 'Manage streams, programs and quotas', to: '/admin/config/academic/streams' },
    { key: 'program', label: 'Programs', desc: 'Manage academic programs', type: 'program' },
    { key: 'batch', label: 'Batch', desc: 'Manage batches', type: 'batch' },
    { key: 'academic_year', label: 'Academic Year', desc: 'Manage academic years', type: 'academic_year' },
  ];

  const [activeTab, setActiveTab] = useState(null);

  return (
    <div className="space-y-4">
      {/* Sub-menu cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => item.to ? navigate(item.to) : setActiveTab(activeTab === item.key ? null : item.key)}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left group"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.label}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-blue-400 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Inline master data for non-stream tabs */}
      {activeTab && activeTab !== 'stream' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {ITEMS.find((i) => i.key === activeTab)?.label}
          </p>
          <MasterDataList type={activeTab} label={ITEMS.find((i) => i.key === activeTab)?.label || ''} />
        </div>
      )}
    </div>
  );
}

function UserManagement() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">User Roles</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Add and remove role names used for admin and staff access levels.
        </p>
        <MasterDataList type="user_role" label="Role" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Permission Groups</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Manage permission sets for reporting, admission, finance, and configuration access.
        </p>
        <MasterDataList type="permission_group" label="Permission Group" />
      </div>
    </div>
  );
}

function DataManagement() {
  const [seedLoading, setSeedLoading] = useState(false);
  const { toasts, toast } = useToast();

  const handleSeedDefaults = async () => {
    setSeedLoading(true);
    try {
      await seedMasterData();
      toast('Default configuration seeded successfully');
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to seed defaults', 'error');
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <>
      <Toasts toasts={toasts} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Seed Default Data</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Load default programs, batches, quotas and lookup values into the system.
          </p>
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={seedLoading}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {seedLoading ? 'Seeding...' : 'Seed Defaults'}
          </button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Support Data</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Maintain lookup values used across admissions, student profiles and fee templates.
          </p>
          <div className="grid gap-4">
            <MasterDataList type="fee_head" label="Fee Head" />
            <MasterDataList type="payment_method" label="Payment Method" />
          </div>
        </div>
      </div>
    </>
  );
}

function IntegrationSetting() {
  const [integration, setIntegration] = useState({
    paymentGateway: 'Razorpay',
    paymentApiKey: '',
    smsGateway: 'Twilio',
    smsApiKey: '',
    webhookUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const { toasts, toast } = useToast();

  useEffect(() => {
    const saved = window.localStorage.getItem('appConfig-integration');
    if (saved) setIntegration(JSON.parse(saved));
  }, []);

  const handleChange = (field, value) => {
    setIntegration((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    window.localStorage.setItem('appConfig-integration', JSON.stringify(integration));
    setTimeout(() => {
      setSaving(false);
      toast('Integration settings saved successfully');
    }, 250);
  };

  return (
    <>
      <Toasts toasts={toasts} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Gateway</h3>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">Gateway</label>
            <select
              value={integration.paymentGateway}
              onChange={(e) => handleChange('paymentGateway', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Razorpay">Razorpay</option>
              <option value="PayU">PayU</option>
              <option value="Stripe">Stripe</option>
            </select>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">API Key</label>
              <input
                value={integration.paymentApiKey}
                onChange={(e) => handleChange('paymentApiKey', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter payment API key"
              />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">SMS / Webhooks</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">SMS Gateway</label>
              <select
                value={integration.smsGateway}
                onChange={(e) => handleChange('smsGateway', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="Twilio">Twilio</option>
                <option value="MSG91">MSG91</option>
                <option value="Nexmo">Nexmo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">SMS API Key</label>
              <input
                value={integration.smsApiKey}
                onChange={(e) => handleChange('smsApiKey', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter SMS API key"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">Webhook URL</label>
              <input
                value={integration.webhookUrl}
                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter webhook endpoint"
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Integration'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Section renderer ──────────────────────────────────────────────────────────
function SectionContent({ section }) {
  const navigate = useNavigate();

  switch (section) {
    case 'general':
      return <GeneralSetting />;
    case 'academic':
      return <AcademicSetting />;
    case 'onboarding':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Programs', type: 'program' },
              { label: 'Batches', type: 'batch' },
              { label: 'Quotas', type: 'quota' },
              { label: 'Departments', type: 'department' },
            ].map(({ label, type }) => (
              <div key={type} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">{label}</h3>
                <MasterDataList type={type} label={label.slice(0, -1)} />
              </div>
            ))}
          </div>
        </div>
      );
    case 'admission':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Admission Types', type: 'admission_type' },
              { label: 'Admission Categories', type: 'admission_category' },
              { label: 'Streams', type: 'stream' },
              { label: 'Academic Years', type: 'academic_year' },
            ].map(({ label, type }) => (
              <div key={type} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">{label}</h3>
                <MasterDataList type={type} label={label.slice(0, -1)} />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Admission Schedules</h3>
              <button
                onClick={() => navigate('/admin/admissions/enquiry')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Manage Schedules <ChevronRight size={13} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Create and manage admission schedules, configure programs, seats, and admission types.
            </p>
          </div>
        </div>
      );
    case 'fee-template':
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
            <CreditCard size={28} className="text-blue-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700 dark:text-slate-300">Fee Template</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-4">Manage fee templates in the Fee Configuration page.</p>
          <button
            onClick={() => navigate('/admin/fee/configuration')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Fee Configuration <ChevronRight size={14} />
          </button>
        </div>
      );
    case 'users':
      return <UserManagement />;
    case 'data':
      return <DataManagement />;
    case 'integration':
      return <IntegrationSetting />;
    default:
      return <ComingSoon label={SECTIONS.find((s) => s.key === section)?.label || 'Section'} />;
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ConfigurationPage({ section }) {
  const currentSection = section || 'general';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Configuration</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Manage system settings, academic data, and integrations
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left sub-nav */}
        <div className="w-56 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Sections</p>
          </div>
          <ul className="py-2">
            {SECTIONS.map((s) => {
              const isActive = currentSection === s.key;
              return (
                <li key={s.key}>
                  <NavLink
                    to={s.to}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                      ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-800 dark:hover:text-slate-200'
                      }`}
                  >
                    <s.icon size={15} className="flex-shrink-0" />
                    {s.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {SECTIONS.find((s) => s.key === currentSection)?.label || 'Configuration'}
            </h2>
          </div>
          <SectionContent section={currentSection} />
        </div>
      </div>
    </div>
  );
}
