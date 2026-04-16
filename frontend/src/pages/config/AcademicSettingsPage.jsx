import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GraduationCap, BookOpen, Calendar, Clock, CheckSquare, Tag,
  Plus, Pencil, Trash2, Check, X, Search, Lock, RefreshCw,
  ChevronUp, ChevronDown, AlertCircle, Package, Layers,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getMasterData, addMasterData, updateMasterData,
  deleteMasterData, seedMasterData,
} from '../../services/configApi';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  {
    key: 'program',
    label: 'Programs',
    icon: GraduationCap,
    color: 'blue',
    description: 'Degree programs offered by your institution (e.g. B.E CSE, MBA)',
    placeholder: 'e.g. B.E Computer Science',
  },
  {
    key: 'batch',
    label: 'Batches',
    icon: Calendar,
    color: 'green',
    description: 'Academic batch years (e.g. 2021-2025, 2022-2026)',
    placeholder: 'e.g. 2022-2026',
  },
  {
    key: 'stream',
    label: 'Streams / Dept.',
    icon: Layers,
    color: 'purple',
    description: 'Streams or departments within programs',
    placeholder: 'e.g. B.E Information Science',
  },
  {
    key: 'academic_year',
    label: 'Academic Years',
    icon: Clock,
    color: 'orange',
    description: 'Academic years for fees and enrollments (e.g. 2024-25)',
    placeholder: 'e.g. 2025-26',
  },
  {
    key: 'admission_status',
    label: 'Admission Status',
    icon: CheckSquare,
    color: 'teal',
    description: 'Student admission lifecycle statuses (e.g. Live, Completed)',
    placeholder: 'e.g. Pass Out',
  },
  {
    key: 'quota',
    label: 'Quotas / Categories',
    icon: Tag,
    color: 'rose',
    description: 'Admission quota categories (e.g. Management, CET, NRI)',
    placeholder: 'e.g. Sports Quota',
  },
];

// ── Color map ─────────────────────────────────────────────────────────────────
const COLOR = {
  blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400',   active: 'bg-blue-600',   light: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-800',   ring: 'focus:ring-blue-400'   },
  green:  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', active: 'bg-green-600',  light: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', ring: 'focus:ring-green-400'  },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', active: 'bg-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', ring: 'focus:ring-purple-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', active: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', ring: 'focus:ring-orange-400' },
  teal:   { bg: 'bg-teal-100 dark:bg-teal-900/30',   text: 'text-teal-600 dark:text-teal-400',   active: 'bg-teal-600',   light: 'bg-teal-50 dark:bg-teal-900/20',   border: 'border-teal-200 dark:border-teal-800',   ring: 'focus:ring-teal-400'   },
  rose:   { bg: 'bg-rose-100 dark:bg-rose-900/30',   text: 'text-rose-600 dark:text-rose-400',   active: 'bg-rose-600',   light: 'bg-rose-50 dark:bg-rose-900/20',   border: 'border-rose-200 dark:border-rose-800',   ring: 'focus:ring-rose-400'   },
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ item, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-600 dark:text-red-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Delete Item</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
          Remove <strong className="text-gray-800 dark:text-white">"{item.label}"</strong> from the list? This won't affect existing records.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Single item row ───────────────────────────────────────────────────────────
function ItemRow({ item, color, onUpdated, onDeleted, onMove, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const inputRef = useRef(null);
  const c = COLOR[color];

  const startEdit = () => {
    if (!item.isUserAddable) return;
    setLabel(item.label);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelEdit = () => { setEditing(false); setLabel(item.label); };

  const saveEdit = async () => {
    if (!label.trim() || label.trim() === item.label) { cancelEdit(); return; }
    setSaving(true);
    try {
      const { data } = await updateMasterData(item._id, { label: label.trim() });
      onUpdated(data.data);
      setEditing(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleDelete = async () => {
    try {
      await deleteMasterData(item._id);
      onDeleted(item._id);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete');
    }
    setDeleteTarget(false);
  };

  return (
    <>
      {deleteTarget && (
        <DeleteModal item={item} onClose={() => setDeleteTarget(false)} onConfirm={handleDelete} />
      )}
      <div className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${c.border} bg-white dark:bg-slate-800 hover:shadow-sm`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
          {item.label[0]?.toUpperCase() || '?'}
        </div>

        {/* Label / Edit input */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-2 py-1 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 ${c.ring} text-gray-800 dark:text-white`}
            />
          ) : (
            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.label}</p>
          )}
        </div>

        {/* System badge */}
        {!item.isUserAddable && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-600 rounded-full px-2 py-0.5 flex-shrink-0">
            <Lock size={8} /> System
          </span>
        )}

        {/* Actions */}
        {editing ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={saveEdit} disabled={saving} className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40">
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600">
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {/* Reorder */}
            <button onClick={() => onMove(item._id, -1)} disabled={isFirst} className="p-1 rounded text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 disabled:opacity-0">
              <ChevronUp size={13} />
            </button>
            <button onClick={() => onMove(item._id, 1)} disabled={isLast} className="p-1 rounded text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 disabled:opacity-0">
              <ChevronDown size={13} />
            </button>
            {/* Edit */}
            {item.isUserAddable && (
              <button onClick={startEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                <Pencil size={13} />
              </button>
            )}
            {/* Delete */}
            {item.isUserAddable && (
              <button onClick={() => setDeleteTarget(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Tab content panel ─────────────────────────────────────────────────────────
function TabPanel({ tab }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const addInputRef = useRef(null);
  const c = COLOR[tab.color];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMasterData(tab.key);
      setItems(data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [tab.key]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showAdd) setTimeout(() => addInputRef.current?.focus(), 50);
  }, [showAdd]);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const { data } = await addMasterData({ type: tab.key, label: newLabel.trim() });
      setItems(prev => [...prev, data.data]);
      setNewLabel('');
      setShowAdd(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to add');
    } finally { setAdding(false); }
  };

  const handleUpdated = (updated) => {
    setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
  };

  const handleDeleted = (id) => {
    setItems(prev => prev.filter(i => i._id !== id));
  };

  const handleMove = async (id, dir) => {
    const idx = items.findIndex(i => i._id === id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const newItems = [...items];
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    setItems(newItems);
    // Persist order
    try {
      await Promise.all([
        updateMasterData(newItems[idx]._id, { order: idx }),
        updateMasterData(newItems[swapIdx]._id, { order: swapIdx }),
      ]);
    } catch {}
  };

  const filtered = items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));
  const userAddable = items.filter(i => i.isUserAddable).length;
  const systemCount = items.filter(i => !i.isUserAddable).length;

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className={`rounded-2xl ${c.light} border ${c.border} p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
              <tab.icon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{tab.label}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{tab.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
              {items.length} total
            </span>
            {systemCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                {systemCount} system
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab.label.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-slate-200"
          />
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white ${c.active} rounded-xl hover:opacity-90 transition-opacity`}
        >
          <Plus size={15} />
          Add {tab.label.replace(' / Dept.', '').replace('s', '')}
        </button>
      </div>

      {/* Inline add form */}
      {showAdd && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed ${c.border} ${c.light}`}>
          <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
            {newLabel[0]?.toUpperCase() || '+'}
          </div>
          <input
            ref={addInputRef}
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAdd(false); setNewLabel(''); } }}
            placeholder={tab.placeholder}
            className={`flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 ${c.ring} text-gray-700 dark:text-slate-200`}
          />
          <button onClick={handleAdd} disabled={adding || !newLabel.trim()}
            className={`px-4 py-1.5 text-sm font-semibold text-white ${c.active} rounded-lg disabled:opacity-50 hover:opacity-90`}>
            {adding ? 'Adding...' : 'Add'}
          </button>
          <button onClick={() => { setShowAdd(false); setNewLabel(''); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className={`w-14 h-14 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center mb-3`}>
              <tab.icon size={24} />
            </div>
            {search ? (
              <>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">No results for "{search}"</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">No {tab.label.toLowerCase()} yet</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  Click "Add" to add your first item, or{' '}
                  <button onClick={() => seedMasterData().then(load)} className={`${c.text} underline`}>seed defaults</button>
                </p>
              </>
            )}
          </div>
        ) : (
          filtered.map((item, idx, arr) => (
            <ItemRow
              key={item._id}
              item={item}
              color={tab.color}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onMove={handleMove}
              isFirst={idx === 0}
              isLast={idx === arr.length - 1}
            />
          ))
        )}
      </div>

      {/* Count footer */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center pt-1">
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          {search && ` matching "${search}"`}
          {userAddable > 0 && ` • ${userAddable} custom`}
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AcademicSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('program');
  const [counts, setCounts] = useState({});
  const [seeding, setSeeding] = useState(false);
  const { toasts, toast } = useToast();

  // Load counts for stats overview
  useEffect(() => {
    const loadCounts = async () => {
      const results = await Promise.allSettled(
        TABS.map(t => getMasterData(t.key).then(r => ({ key: t.key, count: r.data?.data?.length || 0 })))
      );
      const c = {};
      results.forEach(r => { if (r.status === 'fulfilled') c[r.value.key] = r.value.count; });
      setCounts(c);
    };
    loadCounts();
  }, []);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const { data } = await seedMasterData();
      toast(`Seeded ${data.seeded} default items`);
      // Reload counts
      const results = await Promise.allSettled(
        TABS.map(t => getMasterData(t.key).then(r => ({ key: t.key, count: r.data?.data?.length || 0 })))
      );
      const c = {};
      results.forEach(r => { if (r.status === 'fulfilled') c[r.value.key] = r.value.count; });
      setCounts(c);
    } catch (e) {
      toast(e.response?.data?.error || 'Seeding failed', 'error');
    } finally { setSeeding(false); }
  };

  const activeTabDef = TABS.find(t => t.key === activeTab);

  return (
    <>
      <Toasts toasts={toasts} />

      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/config/general')}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap size={20} className="text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Academic Settings</h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Manage programs, batches, streams and other academic reference data used across all modules
              </p>
            </div>
          </div>
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={seeding ? 'animate-spin' : ''} />
            {seeding ? 'Seeding...' : 'Seed Defaults'}
          </button>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TABS.map(tab => {
            const c = COLOR[tab.color];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center cursor-pointer hover:shadow-md
                  ${isActive ? `${c.light} ${c.border} shadow-sm` : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'}`}
              >
                {isActive && (
                  <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${c.active}`} />
                )}
                <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center`}>
                  <tab.icon size={18} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${isActive ? c.text : 'text-gray-900 dark:text-white'}`}>
                    {counts[tab.key] ?? '—'}
                  </p>
                  <p className={`text-[11px] font-medium ${isActive ? c.text : 'text-gray-500 dark:text-slate-400'}`}>
                    {tab.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab nav strip */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Tab buttons */}
          <div className="flex overflow-x-auto border-b border-gray-100 dark:border-slate-700 px-2 pt-2 gap-1">
            {TABS.map(tab => {
              const c = COLOR[tab.color];
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl whitespace-nowrap transition-colors border-b-2
                    ${isActive
                      ? `${c.text} border-current bg-gray-50 dark:bg-slate-900/40`
                      : 'text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {counts[tab.key] !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? `${c.bg} ${c.text}` : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                      {counts[tab.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab panel */}
          <div className="p-6">
            {activeTabDef && <TabPanel key={activeTab} tab={activeTabDef} />}
          </div>
        </div>

        {/* Info card */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Note:</strong> Items marked "System" are built-in defaults and cannot be deleted.
            Changes here are reflected immediately across all modules — student forms, fee management, hostel, library, and reports.
          </div>
        </div>
      </div>
    </>
  );
}
