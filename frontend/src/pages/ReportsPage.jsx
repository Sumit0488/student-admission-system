import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, Home, UserSquare2, ShoppingCart,
  IndianRupee, TrendingUp, BarChart2, ArrowRight, FileText,
} from 'lucide-react';
import { getStudents } from '../services/studentApi';
import { getFeeOrders } from '../services/feeApi';
import { getLibraryStats } from '../services/libraryApi';
import { getHostelStats } from '../services/hostelApi';
import { getAlumniStats } from '../services/alumniApi';
import { getBillingStats } from '../services/billingApi';

function StatCard({ icon: Icon, color, label, value, sub, loading }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      {loading
        ? <span className="inline-block w-20 h-7 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        : <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>}
      {sub && !loading && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

const fmtCur = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

const MODULE_REPORTS = [
  { label: 'Fee Reports',     to: '/admin/fee/reports',      icon: IndianRupee, color: 'bg-blue-600',   desc: 'Fees collected, due, tracker breakdowns' },
  { label: 'General Reports', to: '/admin/general/reports',  icon: FileText,    color: 'bg-slate-600',  desc: 'Scholarships, bank loans, student overview' },
  { label: 'Billing Reports', to: '/admin/billing/reports',  icon: ShoppingCart,color: 'bg-orange-500', desc: 'Order status, revenue by category' },
  { label: 'Library Reports', to: '/admin/library/reports',  icon: BookOpen,    color: 'bg-emerald-600',desc: 'Members, fine collections, book usage' },
  { label: 'Hostel Reports',  to: '/admin/hostel/reports',   icon: Home,        color: 'bg-cyan-600',   desc: 'Occupancy, fee collected, room utilisation' },
  { label: 'Alumni Reports',  to: '/admin/alumni/reports',   icon: UserSquare2, color: 'bg-purple-600', desc: 'Placement rate, program breakdown, industry' },
];

export default function ReportsPage() {
  const [studStats, setStudStats] = useState({ total: 0, live: 0, completed: 0, detained: 0 });
  const [feeStats, setFeeStats]   = useState({ orderCount: 0, paid: 0, due: 0 });
  const [libStats, setLibStats]   = useState({ total: 0, active: 0, fineCollected: 0 });
  const [hosStats, setHosStats]   = useState({ total: 0, active: 0, feeCollected: 0 });
  const [alumStats, setAlumStats] = useState({ total: 0, active: 0 });
  const [billStats, setBillStats] = useState({ total: 0, collected: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getStudents(),
      getFeeOrders({ limit: 5000 }),
      getLibraryStats(),
      getHostelStats(),
      getAlumniStats(),
      getBillingStats(),
    ]).then(([sRes, fRes, lRes, hRes, aRes, bRes]) => {
      if (sRes.status === 'fulfilled') {
        const list = sRes.value.data?.data || [];
        setStudStats({
          total: list.length,
          live: list.filter(s => s.admissionStatus === 'Live' || s.status === 'Live').length,
          completed: list.filter(s => s.admissionStatus === 'Completed' || s.status === 'Completed').length,
          detained: list.filter(s => s.admissionStatus === 'Detained' || s.status === 'Detained').length,
        });
      }
      if (fRes.status === 'fulfilled') {
        const orders = fRes.value.data?.data || [];
        setFeeStats({
          orderCount: orders.length,
          paid: orders.reduce((s, o) => s + (o.fee_paid_amount || 0), 0),
          due: orders.reduce((s, o) => s + (o.fee_due_amount || 0), 0),
        });
      }
      if (lRes.status === 'fulfilled') setLibStats(lRes.value.data?.data || {});
      if (hRes.status === 'fulfilled') setHosStats(hRes.value.data?.data || {});
      if (aRes.status === 'fulfilled') setAlumStats(aRes.value.data?.data || {});
      if (bRes.status === 'fulfilled') setBillStats(bRes.value.data?.data || {});
    }).finally(() => setLoading(false));
  }, []);

  const summaryCards = [
    { icon: Users,       color: 'bg-blue-600',   label: 'Total Students',   value: studStats.total,  sub: `${studStats.live} live · ${studStats.completed} completed` },
    { icon: IndianRupee, color: 'bg-green-600',   label: 'Fee Collected',    value: fmtCur(feeStats.paid), sub: `${feeStats.orderCount} orders · ${fmtCur(feeStats.due)} due` },
    { icon: BookOpen,    color: 'bg-emerald-600', label: 'Library Members',  value: libStats.total,   sub: `${libStats.active} active · ${fmtCur(libStats.fineCollected || 0)} fines` },
    { icon: Home,        color: 'bg-cyan-600',    label: 'Hostel Residents', value: hosStats.total,   sub: `${hosStats.active} active · ${fmtCur(hosStats.feeCollected || 0)} collected` },
    { icon: UserSquare2, color: 'bg-purple-600',  label: 'Alumni',           value: alumStats.total,  sub: `${alumStats.active} active alumni` },
    { icon: ShoppingCart,color: 'bg-orange-500',  label: 'Billing Orders',   value: billStats.total,  sub: `${fmtCur(billStats.collected || 0)} collected · ${billStats.pending} pending` },
  ];

  const programMap = {};
  // Program breakdown will be derived from student data when available

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Institution-wide summary across all modules</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map(c => (
          <StatCard key={c.label} loading={loading} {...c} />
        ))}
      </div>

      {/* Student breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Users size={15} className="text-blue-600" /> Student Status Breakdown
          </h3>
          <Link to="/admin/admissions/students" className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 dark:divide-slate-700">
          {[
            { label: 'Total',     value: studStats.total,     color: 'text-gray-900 dark:text-white' },
            { label: 'Live',      value: studStats.live,      color: 'text-green-600 dark:text-green-400' },
            { label: 'Completed', value: studStats.completed, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Detained',  value: studStats.detained,  color: 'text-orange-500' },
          ].map(item => (
            <div key={item.label} className="p-5 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">{item.label}</p>
              {loading
                ? <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                : <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Fee & Billing side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <IndianRupee size={15} className="text-green-600" /> Fee Overview
            </h3>
            <Link to="/admin/fee/reports" className="text-xs text-blue-600 hover:underline font-medium">Details →</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {[
              { label: 'Total Orders',   value: feeStats.orderCount },
              { label: 'Amount Paid',    value: fmtCur(feeStats.paid) },
              { label: 'Amount Due',     value: fmtCur(feeStats.due) },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-gray-500 dark:text-slate-400">{r.label}</span>
                {loading ? <span className="inline-block w-16 h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  : <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.value}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ShoppingCart size={15} className="text-orange-500" /> Billing Overview
            </h3>
            <Link to="/admin/billing/reports" className="text-xs text-blue-600 hover:underline font-medium">Details →</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {[
              { label: 'Total Orders',   value: billStats.total },
              { label: 'Collected',      value: fmtCur(billStats.collected || 0) },
              { label: 'Pending Orders', value: billStats.pending },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-gray-500 dark:text-slate-400">{r.label}</span>
                {loading ? <span className="inline-block w-16 h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  : <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.value}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Reports Links */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <BarChart2 size={15} className="text-gray-500" /> Module Reports
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULE_REPORTS.map(mod => (
            <Link key={mod.label} to={mod.to}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center flex-shrink-0`}>
                <mod.icon size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{mod.label}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{mod.desc}</p>
              </div>
              <ArrowRight size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Detained warning */}
      {!loading && studStats.detained > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
          <TrendingUp size={16} className="text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700 dark:text-orange-400">
            <span className="font-semibold">{studStats.detained}</span> student{studStats.detained > 1 ? 's' : ''} currently detained — review before next promotion cycle.
          </p>
          <Link to="/admin/admissions/students" className="ml-auto text-xs font-medium text-orange-600 hover:underline whitespace-nowrap">Review →</Link>
        </div>
      )}
    </div>
  );
}
