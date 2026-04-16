import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, Clock, FileText, X, Mail, MessageCircle, Download } from 'lucide-react';
import { getAllCertificateRequests, updateCertificateRequest } from '../../services/admissionsApi';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';
import qc from '../../services/queryCache';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

const STATUS_STYLE = {
  Pending: 'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400',
  Approved: 'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400',
  Rejected: 'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',
};
const STATUS_ICON = {
  Pending: <Clock size={12} />,
  Approved: <CheckCircle size={12} />,
  Rejected: <XCircle size={12} />,
};
const normalizeStatus = (s) => {
  if (!s) return 'Pending';
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return ['Pending', 'Approved', 'Rejected'].includes(cap) ? cap : s;
};

function RejectModal({ onConfirm, onCancel, loading }) {
  const [remarks, setRemarks] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Reject Request</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
            Remarks (optional)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-slate-700">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(remarks)} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            <XCircle size={14} />
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentRequestsTab({ toast }) {
  const [urlParams, setUrlParams] = useUrlFilters({ status: 'All', q: '' });
  const statusFilter = urlParams.status;
  const search       = urlParams.q;
  const debouncedSearch = useDebounce(search, 350);

  const [requests, setRequests] = useState(() => qc.get('certRequests')?.data || []);
  const [loading, setLoading] = useState(() => !qc.has('certRequests'));
  const [updating, setUpdating] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchData = useCallback(async () => {
    const isDefault = statusFilter === 'All' && debouncedSearch === '';
    if (!isDefault || !qc.has('certRequests')) setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await getAllCertificateRequests(params);
      setRequests(data.data || []);
    } catch {
      toast('Failed to load student requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    setUpdating(id);
    try {
      const { data } = await updateCertificateRequest(id, { status: 'Approved' });
      setRequests((p) => p.map((r) => (r._id === id ? data.data : r)));
      toast('Request approved');
    } catch {
      toast('Approval failed', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (remarks) => {
    const id = rejectTarget;
    setRejectTarget(null);
    setUpdating(id);
    try {
      const { data } = await updateCertificateRequest(id, { status: 'Rejected', remarks });
      setRequests((p) => p.map((r) => (r._id === id ? data.data : r)));
      toast('Request rejected');
    } catch {
      toast('Rejection failed', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const COLS = ['Student Name', 'USN', 'Certificate Type', 'Reason', 'Delivery', 'Requested', 'Status', 'Actions'];

  return (
    <>
      {rejectTarget && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
          loading={updating === rejectTarget}
        />
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Status filter tabs */}
        <div className="flex items-center px-5 border-b border-gray-100 dark:border-slate-700 gap-0">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setUrlParams({ status: f }, { replace: false })}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${statusFilter === f
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                }`}>
              {f}
              {f !== 'All' && STATUS_ICON[f]}
            </button>
          ))}
        </div>

        {/* Search + Actions bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setUrlParams({ q: e.target.value })}
              placeholder="Search by name or USN..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
            <span className="font-semibold text-gray-700 dark:text-slate-300">{requests.length.toLocaleString()}</span> requests
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" title="Send Email" className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Mail size={15} /></button>
            <button type="button" title="Send WhatsApp" className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><MessageCircle size={15} /></button>
            <button type="button" title="Download" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><Download size={15} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {COLS.map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: COLS.length }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="px-6 py-16 text-center">
                    <FileText size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">
                      {statusFilter === 'All' ? 'No student requests yet' : `No ${statusFilter.toLowerCase()} requests`}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const status = normalizeStatus(r.status);
                  return (
                    <tr key={r._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{r.usn}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{r.certificateType}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs max-w-[160px] truncate" title={r.reason}>
                        {r.reason || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${r.deliveryType === 'Hard Copy'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                          {r.deliveryType || 'Download'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs whitespace-nowrap">
                        {new Date(r.requestedDate || r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
                          {STATUS_ICON[status]} {status}
                        </span>
                        {r.remarks && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 max-w-[120px] truncate" title={r.remarks}>
                            {r.remarks}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {status === 'Pending' && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleApprove(r._id)} disabled={updating === r._id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                              <CheckCircle size={12} />
                              {updating === r._id ? '...' : 'Approve'}
                            </button>
                            <button onClick={() => setRejectTarget(r._id)} disabled={updating === r._id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 disabled:opacity-50 transition-colors">
                              <XCircle size={12} />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && requests.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Showing <span className="font-semibold text-gray-600 dark:text-slate-300">{requests.length}</span> result{requests.length !== 1 ? 's' : ''}
              {statusFilter !== 'All' && ` · filter: ${statusFilter}`}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default function ApprovalsPage() {
  const { toasts, toast } = useToast();

  return (
    <>
      <Toasts toasts={toasts} />

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Approvals</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Review and action certificate requests from students
          </p>
        </div>

        <StudentRequestsTab toast={toast} />
      </div>
    </>
  );
}
