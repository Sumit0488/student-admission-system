import { useState } from 'react';
import { GraduationCap, ChevronRight, FileText, Users, BarChart2, Calendar, BookOpen, Layers } from 'lucide-react';

const REPORT_SECTIONS = [
  {
    title: 'Custom Reports',
    icon: FileText,
    color: 'bg-blue-600',
    reports: [
      { label: 'Daily Admission Report', desc: 'Admissions received today with full student details' },
      { label: 'Admission Summary Report', desc: 'Summarised count of admissions by date range' },
    ],
  },
  {
    title: 'Student Reports',
    icon: Users,
    color: 'bg-green-600',
    reports: [
      { label: 'Student List Report', desc: 'Complete list of all admitted students' },
      { label: 'Active Students Report', desc: 'Students currently active in the system' },
      { label: 'Inactive Students Report', desc: 'Students who are inactive or withdrawn' },
    ],
  },
  {
    title: 'Academic Reports',
    icon: GraduationCap,
    color: 'bg-purple-600',
    reports: [
      { label: 'Program-wise Report', desc: 'Student count and details grouped by program' },
      { label: 'Semester-wise Report', desc: 'Student distribution across semesters' },
      { label: 'Batch-wise Report', desc: 'Student list grouped by admission batch' },
    ],
  },
];

function ReportCard({ report, onSelect }) {
  return (
    <button
      onClick={() => onSelect(report.label)}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all group text-left"
    >
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {report.label}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{report.desc}</p>
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-3" />
    </button>
  );
}

export default function AdmissionsReportsPage() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Reports
          </button>
          <span className="text-gray-300 dark:text-slate-600">/</span>
          <span className="text-sm text-gray-600 dark:text-slate-400">{selected}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-10 text-center">
          <BarChart2 size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
          <p className="text-base font-semibold text-gray-700 dark:text-white">{selected}</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            Report generation coming soon. Use filters above to narrow results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admissions Reports</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Generate and download admission-related reports
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {REPORT_SECTIONS.map((section) => (
          <div key={section.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-slate-700/60">
              <div className={`w-8 h-8 rounded-lg ${section.color} flex items-center justify-center flex-shrink-0`}>
                <section.icon size={15} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">{section.title}</h2>
              <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">
                {section.reports.length} reports
              </span>
            </div>

            {/* Report list */}
            <div className="p-4 space-y-2">
              {section.reports.map((report) => (
                <ReportCard key={report.label} report={report} onSelect={setSelected} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
