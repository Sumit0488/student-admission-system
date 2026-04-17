/**
 * EntityDropdown — searchable, API-driven select with optional cascading.
 *
 * Props:
 *   url          — API endpoint string, e.g. '/api/academic/streams'
 *   params       — extra query params object (used for cascading, e.g. { stream_code: 'CS' })
 *   labelKey     — field name to display as the option label (default 'name')
 *   valueKey     — field name to use as the option value (default '_id')
 *   value        — controlled value (string/number)
 *   onChange     — (value, item) => void
 *   placeholder  — placeholder text
 *   disabled     — boolean
 *   className    — extra class on the <select>
 *   allowBlank   — show an empty first option (default true)
 *   blankLabel   — label for blank option (default '— Select —')
 */
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function EntityDropdown({
  url,
  params = {},
  labelKey = 'name',
  valueKey = '_id',
  value = '',
  onChange,
  placeholder,
  disabled = false,
  className = '',
  allowBlank = true,
  blankLabel = '— Select —',
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Build a stable cache key from url + params
  const cacheKey = url + JSON.stringify(params);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    api.get(url, { params })
      .then(res => {
        if (cancelled) return;
        const data = res.data?.data || res.data || [];
        setOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (!cancelled) setOptions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const base =
    'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg ' +
    'text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed';

  // Normalise: strings → { label, value, raw } objects
  const normalised = options.map(o =>
    typeof o === 'string'
      ? { label: o, value: o, raw: o }
      : { label: o[labelKey] || o.name || o[valueKey], value: String(o[valueKey]), raw: o }
  );

  const handleChange = (e) => {
    const selected = normalised.find(o => o.value === e.target.value);
    // onChange(value, normalised, rawItem)
    onChange?.(e.target.value, selected || null, selected?.raw || null);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled || loading}
      className={`${base} ${className}`}
    >
      {loading ? (
        <option value="">Loading…</option>
      ) : (
        <>
          {allowBlank && <option value="">{blankLabel}</option>}
          {normalised.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
          {!loading && normalised.length === 0 && (
            <option value="" disabled>{placeholder || 'No options available'}</option>
          )}
        </>
      )}
    </select>
  );
}
