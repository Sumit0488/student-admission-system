import { useState } from 'react';
import { ChevronRight, BarChart2 } from 'lucide-react';
import ReportDetailPage from './ReportDetailPage';

/**
 * Reusable reports layout for all modules.
 *
 * Props:
 *   title       — page title e.g. "Library Reports"
 *   subtitle    — subheading e.g. "Generate and download library reports"
 *   icon        — lucide icon component (defaults to BarChart2)
 *   iconBg      — tailwind bg class for icon background (default 'bg-blue-600')
 *   sections    — array of { title: string, reports: [{ key: string, name: string }] }
 *   configs     — object keyed by report key: { name, description?, filters, columns, rowKeys, pdfColumns, apiPath, apiParams?, pdfMapper }
 *   storagePrefix — localStorage key prefix (e.g. 'lib_report')
 */
export default function ReportsLayout({
  title,
  subtitle,
  icon: Icon = BarChart2,
  iconBg = 'bg-blue-600',
  sections,
  configs,
  storagePrefix,
}) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    const cfg = configs[selected];
    return (
      <ReportDetailPage
        cfg={cfg}
        storageKey={`${storagePrefix}_${selected}`}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">{section.title}</h3>
            </div>
            <div className="p-2">
              {section.reports.map(r => (
                <button key={r.key} onClick={() => setSelected(r.key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors rounded-lg group">
                  <span className="group-hover:text-blue-600 transition-colors text-left">{r.name}</span>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
