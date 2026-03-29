import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, FileText, CheckCircle, AlertCircle, Clock,
  Award, Plus, MoreVertical, Trash2, Eye, XCircle, Activity,
} from 'lucide-react';
import {
  getCertificates, getTemplates, deleteTemplate,
  approveCertificate, rejectCertificate, downloadCertificate,
} from '../../services/admissionsApi';

// ─── Toast ────────────────────────────────────────────────────────────────────
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
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto
          ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CLS = {
  Pending:   'bg-amber-100  text-amber-700',
  Approved:  'bg-blue-100   text-blue-700',
  Generated: 'bg-green-100  text-green-700',
  Rejected:  'bg-red-100    text-red-600',
};
const STATUS_ICON = {
  Pending:   <Clock size={11} />,
  Approved:  <CheckCircle size={11} />,
  Generated: <CheckCircle size={11} />,
  Rejected:  <XCircle size={11} />,
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_ICON[status]} {status}
    </span>
  );
}

// ─── Template status pill ─────────────────────────────────────────────────────
function TmplBadge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide
      ${status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRows({ cols, rows = 4 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>{Array.from({ length: cols }).map((__, j) => (
      <td key={j} className="px-4 py-3">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" />
      </td>
    ))}</tr>
  ));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyRow({ cols, icon: Icon, text }) {
  return (
    <tr><td colSpan={cols} className="px-6 py-16 text-center">
      <Icon size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
      <p className="text-sm text-gray-400 dark:text-slate-500">{text}</p>
    </td></tr>
  );
}

// ─── Three-dot action menu ────────────────────────────────────────────────────
function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((p) => !p)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl min-w-[140px] py-1 overflow-hidden">
            {items.map(({ label, icon: Icon, onClick: handle, danger }) => (
              <button key={label}
                onClick={() => { setOpen(false); handle(); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors
                  ${danger ? 'text-red-500' : 'text-gray-700 dark:text-slate-300'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TABS = ['Issued', 'Templates', 'Approvals', 'Timeline'];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CertificatesPage() {
  const navigate          = useNavigate();
  const { toasts, toast } = useToast();
  const [activeTab, setActiveTab] = useState('Issued');

  // ── Data ──────────────────────────────────────────────────────────────────
  const [certs,     setCerts]     = useState([]);
  const [templates, setTemplates] = useState([]);
  const [certLoad,  setCertLoad]  = useState(true);
  const [tmplLoad,  setTmplLoad]  = useState(true);
  const [dlId,      setDlId]      = useState(null);

  const fetchCerts = useCallback(async () => {
    setCertLoad(true);
    try { const { data } = await getCertificates(); setCerts(data.data || []); }
    catch { toast('Failed to load certificates', 'error'); }
    finally { setCertLoad(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTemplates = useCallback(async () => {
    setTmplLoad(true);
    try { const { data } = await getTemplates(); setTemplates(data.data || []); }
    catch { toast('Failed to load templates', 'error'); }
    finally { setTmplLoad(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCerts(); fetchTemplates(); }, [fetchCerts, fetchTemplates]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDownload = async (cert) => {
    if (cert.status !== 'Approved' && cert.status !== 'Generated') return;
    setDlId(cert._id);
    try {
      const response = await downloadCertificate(cert._id);
      const filename = `${cert.type.replace(/\s+/g, '_')}_${cert.usn}.pdf`;
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast(`Downloaded "${filename}"`);
    } catch (err) {
      const msg = err?.response?.data?.error || 'PDF generation failed';
      toast(msg, 'error');
    }
    finally { setDlId(null); }
  };

  const handleApprove = async (cert) => {
    try {
      await approveCertificate(cert._id);
      setCerts((p) => p.map((c) => c._id === cert._id ? { ...c, status: 'Approved' } : c));
      toast('Certificate approved');
    } catch { toast('Failed to approve', 'error'); }
  };

  const handleReject = async (cert) => {
    try {
      await rejectCertificate(cert._id);
      setCerts((p) => p.map((c) => c._id === cert._id ? { ...c, status: 'Rejected' } : c));
      toast('Certificate rejected', 'error');
    } catch { toast('Failed to reject', 'error'); }
  };

  const handleDeleteTemplate = async (tmpl) => {
    if (!confirm(`Delete template "${tmpl.name}"?`)) return;
    try {
      await deleteTemplate(tmpl._id);
      setTemplates((p) => p.filter((t) => t._id !== tmpl._id));
      toast('Template deleted');
    } catch { toast('Failed to delete template', 'error'); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const pendingCerts = certs.filter((c) => c.status === 'Pending');

  // ── Timeline events ───────────────────────────────────────────────────────
  const timelineEvents = [...certs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .map((c) => ({
      id:    c._id,
      label: `${c.type} — ${c.studentName} (${c.usn})`,
      date:  new Date(c.createdAt),
      status: c.status,
    }));

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Toasts toasts={toasts} />

      <div className="space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Certificates</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Manage templates, issue certificates and track approvals
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/certificates/templates/new')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Add Template
          </button>
        </div>

        {/* ── Summary cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Issued',  value: certs.length,                                  color: 'blue'  },
            { label: 'Pending',       value: pendingCerts.length,                            color: 'amber' },
            { label: 'Generated',     value: certs.filter((c) => c.status === 'Generated').length, color: 'green' },
            { label: 'Templates',     value: templates.length,                               color: 'purple'},
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 text-${color}-600 dark:text-${color}-400`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">

          <div className="flex border-b border-gray-100 dark:border-slate-700 px-1 pt-1">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors relative
                  ${activeTab === tab
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}>
                {tab}
                {tab === 'Approvals' && pendingCerts.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                    {pendingCerts.length}
                  </span>
                )}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t" />
                )}
              </button>
            ))}
          </div>

          {/* ── ISSUED TAB ──────────────────────────────────────────────── */}
          {activeTab === 'Issued' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900/50">
                    {['Student Name', 'USN', 'Certificate', 'Requested', 'Generated', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {certLoad ? <SkeletonRows cols={7} /> : certs.length === 0
                    ? <EmptyRow cols={7} icon={Award} text="No certificates issued yet" />
                    : certs.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{c.usn}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.type}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(c.requestedDate)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {c.generatedDate ? fmtDate(c.generatedDate) : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDownload(c)}
                          disabled={dlId === c._id || (c.status !== 'Approved' && c.status !== 'Generated')}
                          title={
                            c.status === 'Rejected'                                    ? 'Certificate rejected — cannot download' :
                            c.status !== 'Approved' && c.status !== 'Generated'        ? 'Awaiting approval before download' : 'Download PDF'
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                            ${(c.status === 'Approved' || c.status === 'Generated')
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                            }`}
                        >
                          {dlId === c._id
                            ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            : <Download size={13} />
                          }
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TEMPLATES TAB ───────────────────────────────────────────── */}
          {activeTab === 'Templates' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900/50">
                    {['Name', 'Description', 'Fields', 'Created', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {tmplLoad ? <SkeletonRows cols={6} /> : templates.length === 0
                    ? <EmptyRow cols={6} icon={FileText} text='No templates yet — click "+ Add Template" to create one' />
                    : templates.map((t) => (
                    <tr key={t._id}
                      onClick={() => navigate(`/admin/certificates/templates/${t._id}`)}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{t.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 max-w-[220px] truncate">{t.description || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400">
                        {(t.fieldCount ?? t.fields?.length ?? 0)} fields
                        {(t.fieldCount ?? 0) === 0 && (t.fields?.length ?? 0) > 0 && (
                          <span className="ml-1.5 text-[10px] text-amber-500 font-semibold">(content empty)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(t.createdAt)}</td>
                      <td className="px-4 py-3"><TmplBadge status={t.status} /></td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu items={[
                          { label: 'Edit',   icon: Eye,   onClick: () => navigate(`/admin/certificates/templates/${t._id}`) },
                          { label: 'Delete', icon: Trash2, onClick: () => handleDeleteTemplate(t), danger: true },
                        ]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── APPROVALS TAB ───────────────────────────────────────────── */}
          {activeTab === 'Approvals' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900/50">
                    {['Student Name', 'USN', 'Certificate Type', 'Requested', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {certLoad ? <SkeletonRows cols={6} /> : certs.length === 0
                    ? <EmptyRow cols={6} icon={CheckCircle} text="No certificate requests" />
                    : certs.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.usn}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.type}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(c.requestedDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        {c.status === 'Pending' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(c)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                              Approve
                            </button>
                            <button onClick={() => handleReject(c)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TIMELINE TAB ────────────────────────────────────────────── */}
          {activeTab === 'Timeline' && (
            <div className="p-6">
              {certLoad ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-slate-700 mt-1 animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                        <div className="h-2 bg-gray-100 dark:bg-slate-700/60 rounded animate-pulse w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Activity size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400">No activity yet</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200 dark:bg-slate-700" />
                  <div className="space-y-5">
                    {timelineEvents.map((ev) => (
                      <div key={ev.id} className="flex gap-4 items-start">
                        <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ring-2 ring-white dark:ring-slate-800
                          ${ev.status === 'Generated' ? 'bg-green-500' :
                            ev.status === 'Approved'  ? 'bg-blue-500'  :
                            ev.status === 'Rejected'  ? 'bg-red-500'   : 'bg-amber-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{ev.label}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            {fmtDateTime(ev.date)} · <StatusBadge status={ev.status} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
