import { Link } from 'react-router-dom';
import {
  BarChart2, IndianRupee, FileText, ShoppingCart,
  BookOpen, Home, UserSquare2, ArrowRight, GraduationCap,
} from 'lucide-react';

const MODULE_REPORTS = [
  {
    label: 'Admissions Reports',
    to: '/admin/admissions/reports',
    icon: GraduationCap,
    color: 'bg-blue-600',
    desc: 'Student lists, enquiry summaries, schedule and approval reports',
    sections: ['Student Reports', 'Enquiry Reports', 'Approval Reports'],
  },
  {
    label: 'Fee Reports',
    to: '/admin/fee/reports',
    icon: IndianRupee,
    color: 'bg-green-600',
    desc: 'Demand collection, balance, daily and monthly fee reports',
    sections: ['Custom Reports', 'Demand Collection & Balance', 'Fee Collection', 'Financial & Abstract'],
  },
  {
    label: 'General Reports',
    to: '/admin/general/reports',
    icon: FileText,
    color: 'bg-slate-600',
    desc: 'Active/inactive students, scholarship and bank loan reports',
    sections: ['Student Reports', 'Scholarship Reports', 'Bank Loan Reports'],
  },
  {
    label: 'Billing Reports',
    to: '/admin/billing/reports',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    desc: 'Daily bank report, collection report, cancellation and refund',
    sections: ['Custom Reports', 'Pay Record', 'Fee Collection', 'Financial & Abstract'],
  },
  {
    label: 'Library Reports',
    to: '/admin/library/reports',
    icon: BookOpen,
    color: 'bg-emerald-600',
    desc: 'Day book, member list, fine collection and circulation reports',
    sections: ['Custom Reports', 'Member Reports', 'Fine & Circulation'],
  },
  {
    label: 'Hostel Reports',
    to: '/admin/hostel/reports',
    icon: Home,
    color: 'bg-cyan-600',
    desc: 'Resident list, occupancy, fee abstract and refund reports',
    sections: ['Custom Reports', 'Resident Reports', 'Financial Reports'],
  },
  {
    label: 'Alumni Reports',
    to: '/admin/alumni/reports',
    icon: UserSquare2,
    color: 'bg-purple-600',
    desc: 'Alumni directory, placement, program and industry breakdown',
    sections: ['Custom Reports', 'Academic Reports', 'Career Reports'],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <BarChart2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select a module to generate and download reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {MODULE_REPORTS.map(mod => (
          <Link key={mod.label} to={mod.to}
            className="flex flex-col p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-11 h-11 rounded-xl ${mod.color} flex items-center justify-center flex-shrink-0`}>
                <mod.icon size={20} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{mod.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{mod.desc}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mod.sections.map(s => (
                <span key={s} className="text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-full">{s}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
