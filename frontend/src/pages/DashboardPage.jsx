import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  Layout,
} from 'lucide-react';
import { getStudents as apiGetStudents } from '../services/studentApi';
import { getCertificates, getTemplates } from '../services/admissionsApi';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certStats, setCertStats] = useState({ total: 0, pending: 0, generated: 0, templates: 0 });
  const [certLoading, setCertLoading] = useState(true);

  useEffect(() => {
    console.log('[Dashboard] GET /api/students');
    apiGetStudents()
      .then(({ data }) => {
        console.log('[Dashboard] Received:', data.data?.length, 'students');
        setStudents(data.data || []);
      })
      .catch((err) => console.error('[Dashboard] Fetch error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([getCertificates(), getTemplates()])
      .then(([certsRes, tmplRes]) => {
        const certs = certsRes.data?.data || certsRes.data || [];
        const templates = tmplRes.data?.data || tmplRes.data || [];
        setCertStats({
          total: certs.length,
          pending: certs.filter((c) => c.status === 'Pending').length,
          generated: certs.filter((c) => c.status === 'Generated').length,
          templates: templates.length,
        });
      })
      .catch((err) => console.error('[Dashboard] Cert stats error:', err.message))
      .finally(() => setCertLoading(false));
  }, []);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const total = students.length;
  const live = students.filter((s) => s.status === 'Live').length;
  const completed = students.filter((s) => s.status === 'Completed').length;
  const detained = students.filter((s) => s.status === 'Detained').length;
  const recent = students.slice(0, 6);

  const STAT_CARDS = [
    { label: 'Total Students', value: total, icon: Users, color: 'bg-blue-600' },
    { label: 'Live Students', value: live, icon: TrendingUp, color: 'bg-green-600' },
    { label: 'Completed', value: completed, icon: GraduationCap, color: 'bg-purple-600' },
    { label: 'Detained', value: detained, icon: ClipboardList, color: 'bg-orange-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold mb-1">Admin User 👋</h2>
        <p className="text-blue-100 text-sm">
          Here&apos;s what&apos;s happening at your institution today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                {card.label}
              </p>
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                <card.icon size={16} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? (
                <span className="inline-block w-10 h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : (
                card.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Certificate Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
            Certificate Overview
          </h3>
          <Link
            to="/admin/admissions/certificates"
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 dark:divide-slate-700">
          {[
            { label: 'Total Issued', value: certStats.total, icon: FileText, color: 'bg-blue-600' },
            { label: 'Pending', value: certStats.pending, icon: Clock, color: 'bg-amber-500' },
            {
              label: 'Generated',
              value: certStats.generated,
              icon: CheckCircle,
              color: 'bg-green-600',
            },
            {
              label: 'Templates',
              value: certStats.templates,
              icon: Layout,
              color: 'bg-purple-600',
            },
          ].map((card) => (
            <div key={card.label} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  {card.label}
                </p>
                <div
                  className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}
                >
                  <card.icon size={16} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {certLoading ? (
                  <span className="inline-block w-10 h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert */}
      {detained > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
          <AlertCircle
            size={18}
            className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {detained} student{detained > 1 ? 's' : ''} currently detained
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Review detained students and update their status as needed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              console.log('[Dashboard] Review detained clicked');
              navigate('/admin/admissions/students');
            }}
            className="ml-auto text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap cursor-pointer"
          >
            Review →
          </button>
        </div>
      )}

      {/* Recent Students */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Recent Students</h3>
          <Link
            to="/admin/admissions/students"
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            View all →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50">
              {['USN', 'Name', 'Program', 'Semester', 'Status'].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-6 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : recent.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-400 dark:text-slate-500"
                >
                  No students yet.{' '}
                  <Link to="/admin/admissions/students" className="text-blue-600 hover:underline">
                    Add the first one →
                  </Link>
                </td>
              </tr>
            ) : (
              recent.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/admin/admissions/students/${s.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">
                    {s.student_id}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-6 py-3 text-gray-500 dark:text-slate-400">
                    {s.program || '—'}
                  </td>
                  <td className="px-6 py-3 text-gray-500 dark:text-slate-400">Sem {s.semester}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
