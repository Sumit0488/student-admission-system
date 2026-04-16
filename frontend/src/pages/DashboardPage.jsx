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
  IndianRupee,
  Wallet,
  CircleDollarSign,
  BarChart3,
  BookOpen,
  Home,
  UserSquare2,
  ShoppingCart,
} from 'lucide-react';
import { getStudents as apiGetStudents } from '../services/studentApi';
import { getCertificates, getTemplates } from '../services/admissionsApi';
import { getFeeOrders } from '../services/feeApi';
import { getLibraryStats } from '../services/libraryApi';
import { getHostelStats } from '../services/hostelApi';
import { getAlumniStats } from '../services/alumniApi';
import { getBillingStats } from '../services/billingApi';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certStats, setCertStats] = useState({ total: 0, pending: 0, generated: 0, templates: 0 });
  const [certLoading, setCertLoading] = useState(true);
  const [feeStats, setFeeStats] = useState({ totalAmount: 0, paidAmount: 0, dueAmount: 0, orderCount: 0 });
  const [feeLoading, setFeeLoading] = useState(true);
  const [libraryStats, setLibraryStats] = useState({ total: 0, active: 0, fineCollected: 0 });
  const [hostelStats, setHostelStats] = useState({ total: 0, active: 0, feeCollected: 0 });
  const [alumniStats, setAlumniStats] = useState({ total: 0, active: 0 });
  const [billingStats, setBillingStats] = useState({ total: 0, collected: 0, pending: 0 });
  const [moduleStatsLoading, setModuleStatsLoading] = useState(true);

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
    getFeeOrders({ limit: 2000 })
      .then(({ data }) => {
        const orders = data.data || [];
        const totalAmount = orders.reduce((s, o) => s + (o.fee_order_amount || 0), 0);
        const paidAmount = orders.reduce((s, o) => s + (o.fee_paid_amount || 0), 0);
        const dueAmount = orders.reduce((s, o) => s + (o.fee_due_amount || 0), 0);
        setFeeStats({ totalAmount, paidAmount, dueAmount, orderCount: orders.length });
      })
      .catch(() => {})
      .finally(() => setFeeLoading(false));
  }, []);

  useEffect(() => {
    Promise.allSettled([getLibraryStats(), getHostelStats(), getAlumniStats(), getBillingStats()])
      .then(([libRes, hosRes, alumRes, billRes]) => {
        if (libRes.status === 'fulfilled') setLibraryStats(libRes.value.data?.data || {});
        if (hosRes.status === 'fulfilled') setHostelStats(hosRes.value.data?.data || {});
        if (alumRes.status === 'fulfilled') setAlumniStats(alumRes.value.data?.data || {});
        if (billRes.status === 'fulfilled') setBillingStats(billRes.value.data?.data || {});
      })
      .finally(() => setModuleStatsLoading(false));
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
    <div className="space-y-6">
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

      {/* Fee Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Fee Overview</h3>
          <Link to="/admin/fee/tracker" className="text-xs text-blue-600 font-medium hover:underline">
            Fee Tracker →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 dark:divide-slate-700">
          {[
            {
              label: 'Total Orders',
              value: feeStats.orderCount,
              sub: null,
              icon: ClipboardList,
              color: 'bg-slate-700',
            },
            {
              label: 'Total Fee Amount',
              value: `₹${(feeStats.totalAmount / 1000).toFixed(1)}K`,
              sub: feeStats.totalAmount >= 100000 ? `₹${(feeStats.totalAmount / 100000).toFixed(2)}L` : null,
              icon: IndianRupee,
              color: 'bg-blue-600',
            },
            {
              label: 'Amount Collected',
              value: `₹${(feeStats.paidAmount / 1000).toFixed(1)}K`,
              sub: feeStats.totalAmount > 0 ? `${((feeStats.paidAmount / feeStats.totalAmount) * 100).toFixed(1)}% collected` : null,
              icon: Wallet,
              color: 'bg-green-600',
            },
            {
              label: 'Pending Amount',
              value: `₹${(feeStats.dueAmount / 1000).toFixed(1)}K`,
              sub: feeStats.totalAmount > 0 ? `${((feeStats.dueAmount / feeStats.totalAmount) * 100).toFixed(1)}% pending` : null,
              icon: CircleDollarSign,
              color: 'bg-orange-500',
            },
          ].map((card) => (
            <div key={card.label} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  {card.label}
                </p>
                <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon size={16} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {feeLoading ? (
                  <span className="inline-block w-16 h-7 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
              {card.sub && !feeLoading && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{card.sub}</p>
              )}
            </div>
          ))}
        </div>
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

      {/* Module Stats — Library, Hostel, Alumni, Billing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Library */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                <BookOpen size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Library</span>
            </div>
            <Link to="/admin/library/members" className="text-xs text-emerald-600 font-medium hover:underline">View →</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {[
              { label: 'Total Members', value: libraryStats.total },
              { label: 'Active Members', value: libraryStats.active },
              { label: 'Fine Collected', value: `₹${Number(libraryStats.fineCollected || 0).toLocaleString('en-IN')}` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500 dark:text-slate-400">{row.label}</span>
                {moduleStatsLoading
                  ? <span className="inline-block w-10 h-3.5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  : <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.value}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Hostel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Home size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Hostel</span>
            </div>
            <Link to="/admin/hostel/members" className="text-xs text-blue-600 font-medium hover:underline">View →</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {[
              { label: 'Total Residents', value: hostelStats.total },
              { label: 'Active Residents', value: hostelStats.active },
              { label: 'Fee Collected', value: `₹${Number(hostelStats.feeCollected || 0).toLocaleString('en-IN')}` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500 dark:text-slate-400">{row.label}</span>
                {moduleStatsLoading
                  ? <span className="inline-block w-10 h-3.5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  : <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.value}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Alumni */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
                <UserSquare2 size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Alumni</span>
            </div>
            <Link to="/admin/alumni/list" className="text-xs text-purple-600 font-medium hover:underline">View →</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {[
              { label: 'Total Alumni', value: alumniStats.total },
              { label: 'Active', value: alumniStats.active },
              { label: 'Inactive', value: (alumniStats.total || 0) - (alumniStats.active || 0) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500 dark:text-slate-400">{row.label}</span>
                {moduleStatsLoading
                  ? <span className="inline-block w-10 h-3.5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  : <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.value}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                <ShoppingCart size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Billing</span>
            </div>
            <Link to="/admin/billing/orders" className="text-xs text-orange-600 font-medium hover:underline">View →</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {[
              { label: 'Total Orders', value: billingStats.total },
              { label: 'Collected', value: `₹${Number(billingStats.collected || 0).toLocaleString('en-IN')}` },
              { label: 'Pending Orders', value: billingStats.pending },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500 dark:text-slate-400">{row.label}</span>
                {moduleStatsLoading
                  ? <span className="inline-block w-10 h-3.5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  : <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.value}</span>}
              </div>
            ))}
          </div>
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
