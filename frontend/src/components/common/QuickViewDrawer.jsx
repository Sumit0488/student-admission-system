/**
 * QuickViewDrawer — right-side slide-in drawer for entity details.
 *
 * Props:
 *   entityType — string: 'students', 'customers', 'orders', etc. (used in API path)
 *   entityId   — string: MongoDB _id of the record
 *   title      — optional heading override
 *   onClose    — () => void
 *
 * Fetches GET /api/{entityType}/{entityId} and renders all fields.
 */
import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

// Fields to skip in auto-render
const SKIP_KEYS = new Set(['__v', 'tenantId', 'institution_id', 'app_type']);

function formatValue(val) {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return val.toLocaleString('en-IN');
  if (typeof val === 'string') {
    // ISO date
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
      return new Date(val).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return val;
  }
  if (Array.isArray(val)) return val.length ? `${val.length} item(s)` : '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function humanLabel(key) {
  return key
    .replace(/_id$/, ' ID')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Determine API base path from entityType
function apiPath(entityType) {
  const MAP = {
    students:     '/api/students',
    'general-students': '/api/general/students',
    customers:    '/api/billing/customers',
    orders:       '/api/billing/orders',
    transactions: '/api/billing/transactions',
    'pay-records':'/api/billing/pay-records',
    'hostel-students': '/api/hostel/students',
    'library-members': '/api/library/members',
    alumni:       '/api/alumni',
  };
  return MAP[entityType] || `/api/${entityType}`;
}

export default function QuickViewDrawer({ entityType, entityId, title, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!entityType || !entityId) return;
    setLoading(true);
    setError('');
    api.get(`${apiPath(entityType)}/${entityId}`)
      .then(res => {
        const payload = res.data?.data || res.data;
        setData(typeof payload === 'object' && !Array.isArray(payload) ? payload : null);
      })
      .catch(() => setError('Failed to load details.'))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  const entries = data
    ? Object.entries(data).filter(([k]) => !SKIP_KEYS.has(k) && !k.startsWith('__'))
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-white capitalize">
            {title || humanLabel(entityType)} Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <p className="text-sm text-gray-500 dark:text-slate-400">Loading…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-red-500">
              <AlertCircle size={24} />
              <p className="text-sm">{error}</p>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data available</p>
          ) : (
            <dl className="space-y-3">
              {entries.map(([key, val]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    {humanLabel(key)}
                  </dt>
                  <dd className="text-sm text-gray-800 dark:text-slate-200 break-words">
                    {formatValue(val)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </>
  );
}
