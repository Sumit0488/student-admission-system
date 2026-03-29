import { useState, useEffect } from 'react';
import { getMasterData, createMasterData } from '../services/masterDataApi';

/**
 * DynamicSelect — fetches options from /api/master-data?type=<type>
 *
 * Props:
 *   type        — master-data type key (e.g. "gender", "blood_group")
 *   value       — controlled value (the label string)
 *   onChange    — (newLabel: string) => void
 *   placeholder — placeholder text (default "Select...")
 *   allowAdd    — show "+ Add New" option (default false, overrides isUserAddable from server)
 *   disabled    — boolean
 *   className   — extra classes for the <select>
 *   id / name   — forwarded to <select>
 */
export default function DynamicSelect({
  type,
  value = '',
  onChange,
  placeholder = 'Select...',
  allowAdd = false,
  disabled = false,
  className = '',
  id,
  name,
}) {
  const [options,    setOptions]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [newLabel,   setNewLabel]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const load = async () => {
    if (!type) return;
    setLoading(true);
    try {
      const data = await getMasterData(type);
      // Deduplicate by label (safety net in case DB still has stale dupes)
      const seen = new Set();
      const unique = data.filter((item) => {
        if (seen.has(item.label)) return false;
        seen.add(item.label);
        return true;
      });
      setOptions(unique);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [type]);

  const handleChange = (e) => {
    if (e.target.value === '__add_new__') {
      setNewLabel('');
      setError('');
      setShowModal(true);
      return;
    }
    onChange?.(e.target.value);
  };

  const handleSave = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) { setError('Label is required'); return; }
    setSaving(true);
    setError('');
    try {
      const item = await createMasterData({ type, label: trimmed });
      await load();
      onChange?.(item.label);
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const baseClass =
    'w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm ' +
    'bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <>
      <select
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        className={`${baseClass} ${className}`}
      >
        <option value="">{loading ? 'Loading...' : placeholder}</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt.label}>{opt.label}</option>
        ))}
        {allowAdd && <option value="__add_new__">+ Add New</option>}
      </select>

      {/* Add New modal — only rendered when allowAdd=true */}
      {allowAdd && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Add New Option
              <span className="ml-2 text-xs font-normal text-gray-400 capitalize">
                ({type?.replace(/_/g, ' ')})
              </span>
            </h3>
            <input
              autoFocus
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setShowModal(false);
              }}
              placeholder="Enter value..."
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 mt-4 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
