import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, GraduationCap, UserCheck, ClipboardList,
  CreditCard, Users, ScrollText, ArrowLeftRight, Settings,
  Plus, Trash2, CheckCircle, AlertCircle, ChevronRight,
} from 'lucide-react';
import { getMasterData, addMasterData, deleteMasterData } from '../../services/configApi';

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
function GeneralSetting() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Persona Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <UserCheck size={18} className="text-purple-500" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Persona</h3>
        </div>
        <div className="space-y-3">
          {['Admin Name', 'Admin Email', 'Contact Number'].map((f) => (
            <div key={f}>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">{f}</label>
              <input
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={`Enter ${f.toLowerCase()}`}
              />
            </div>
          ))}
          <button className="w-full mt-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Institution Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Building2 size={18} className="text-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Institution</h3>
        </div>
        <div className="space-y-3">
          {['Institution Name', 'Address', 'City', 'State', 'Pin Code', 'Website'].map((f) => (
            <div key={f}>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">{f}</label>
              <input
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={`Enter ${f.toLowerCase()}`}
              />
            </div>
          ))}
          <button className="w-full mt-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Academic Setting ──────────────────────────────────────────────────────────
function AcademicSetting() {
  const [activeTab, setActiveTab] = useState('stream');

  const TABS = [
    { key: 'stream',        label: 'Stream',        type: 'stream'        },
    { key: 'batch',         label: 'Batch',         type: 'batch'         },
    { key: 'academic_year', label: 'Academic Year', type: 'academic_year' },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-700/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors
              ${activeTab === t.key
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {TABS.map((t) => activeTab === t.key && (
        <MasterDataList key={t.key} type={t.type} label={t.label} />
      ))}
    </div>
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
