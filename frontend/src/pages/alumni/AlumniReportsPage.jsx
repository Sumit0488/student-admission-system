import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Download, GraduationCap, Users, Briefcase, TrendingUp, MapPin } from 'lucide-react';
import { getAlumni, getAlumniStats } from '../../services/alumniApi';

export default function AlumniReportsPage() {
  const [alumni, setAlumni] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        getAlumni({ limit: 2000 }),
        getAlumniStats(),
      ]);
      setAlumni(listRes.data.data || []);
      setStats(statsRes.data);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const byProgram = alumni.reduce((acc, a) => { const k = a.program || 'Other'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const byYear = alumni.reduce((acc, a) => { const k = a.graduation_year || 'Unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const byIndustry = alumni.reduce((acc, a) => { const k = a.industry || 'Unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const byLocation = alumni.reduce((acc, a) => {
    if (!a.current_location) return acc;
    const city = a.current_location.split(',')[0].trim();
    acc[city] = (acc[city] || 0) + 1; return acc;
  }, {});
  const employed = alumni.filter(a => a.current_company).length;
  const higherEdu = alumni.filter(a => a.higher_education).length;
  const withLinkedin = alumni.filter(a => a.linkedin_url).length;

  const downloadCSV = (rows, filename) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = filename + '.csv'; a.click();
  };

  const exportAllAlumni = () => downloadCSV(
    alumni.map(a => ({
      'Alumni ID': a.alumni_id, 'Name': a.name, 'USN': a.usn, 'Email': a.personal_email || a.email,
      'Mobile': a.mobile_number, 'Program': a.program, 'Batch': a.batch, 'Grad Year': a.graduation_year,
      'CGPA': a.cgpa, 'Company': a.current_company, 'Designation': a.current_designation,
      'Industry': a.industry, 'Location': a.current_location, 'LinkedIn': a.linkedin_url,
      'Higher Education': a.higher_education ? 'Yes' : 'No', 'Institute': a.higher_education_institute,
      'Status': a.status,
    })),
    'alumni-directory'
  );

  const SectionHeader = ({ title, onDownload }) => (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{title}</h3>
      {onDownload && (
        <button onClick={onDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          <Download size={12} /> CSV
        </button>
      )}
    </div>
  );

  const BreakdownList = ({ data, total, color = 'bg-purple-500' }) => {
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return (
      <div className="p-4 space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />) :
          sorted.length === 0 ? <p className="text-center text-sm text-gray-400 py-6">No data</p> :
            sorted.map(([key, count]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-slate-300 truncate max-w-[60%]">{key}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{count} <span className="text-xs text-gray-400">({total ? Math.round((count / total) * 100) : 0}%)</span></span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full">
                  <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 size={22} className="text-purple-600" /> Alumni Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Alumni analytics, career trends, and directory insights</p>
        </div>
        <button onClick={exportAllAlumni}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Download size={15} /> Export All Alumni
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Alumni', value: alumni.length, color: 'bg-purple-600', icon: GraduationCap },
          { label: 'Active', value: alumni.filter(a => a.status === 'Active').length, color: 'bg-green-600', icon: Users },
          { label: 'Employed', value: employed, color: 'bg-blue-600', icon: Briefcase },
          { label: 'Higher Education', value: higherEdu, color: 'bg-orange-500', icon: TrendingUp },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{c.label}</p>
              <div className={`w-7 h-7 rounded-lg ${c.color} flex items-center justify-center`}>
                <c.icon size={14} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /> : c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Employment Rate', value: alumni.length ? `${Math.round((employed / alumni.length) * 100)}%` : '0%', sub: `${employed} of ${alumni.length} alumni`, color: 'text-blue-600' },
          { label: 'Higher Education Rate', value: alumni.length ? `${Math.round((higherEdu / alumni.length) * 100)}%` : '0%', sub: `${higherEdu} pursuing/pursued`, color: 'text-orange-500' },
          { label: 'LinkedIn Connected', value: alumni.length ? `${Math.round((withLinkedin / alumni.length) * 100)}%` : '0%', sub: `${withLinkedin} profiles linked`, color: 'text-blue-700' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{loading ? '—' : c.value}</p>
            <p className="text-xs font-medium text-gray-600 dark:text-slate-300 mt-1">{c.label}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Program */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <SectionHeader title="By Program" onDownload={() => downloadCSV(Object.entries(byProgram).map(([k, v]) => ({ Program: k, Count: v })), 'alumni-by-program')} />
          <BreakdownList data={byProgram} total={alumni.length} color="bg-purple-500" />
        </div>

        {/* By Graduation Year */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <SectionHeader title="By Graduation Year" onDownload={() => downloadCSV(Object.entries(byYear).sort((a, b) => b[0] - a[0]).map(([k, v]) => ({ Year: k, Count: v })), 'alumni-by-year')} />
          <div className="p-4 space-y-3">
            {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />) :
              Object.entries(byYear).length === 0 ? <p className="text-center text-sm text-gray-400 py-6">No data</p> :
                Object.entries(byYear).sort((a, b) => Number(b[0]) - Number(a[0])).slice(0, 8).map(([year, count]) => (
                  <div key={year}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-slate-300">Class of {year}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full">
                      <div className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${alumni.length ? (count / alumni.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* By Industry */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <SectionHeader title="By Industry" onDownload={() => downloadCSV(Object.entries(byIndustry).map(([k, v]) => ({ Industry: k, Count: v })), 'alumni-by-industry')} />
          <BreakdownList data={byIndustry} total={alumni.length} color="bg-green-500" />
        </div>

        {/* By Location */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <SectionHeader title="Top Locations" onDownload={() => downloadCSV(Object.entries(byLocation).map(([k, v]) => ({ City: k, Count: v })), 'alumni-by-location')} />
          <div className="p-4 space-y-3">
            {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />) :
              Object.keys(byLocation).length === 0 ? <p className="text-center text-sm text-gray-400 py-6">No location data</p> :
                Object.entries(byLocation).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => (
                  <div key={city} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">{city}</span>
                    </div>
                    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">{count}</span>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Full Alumni Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Alumni Placement List ({employed} placed)</h3>
          <button onClick={() => downloadCSV(
            alumni.filter(a => a.current_company).map(a => ({
              'Name': a.name, 'USN': a.usn, 'Program': a.program, 'Batch': a.batch,
              'Grad Year': a.graduation_year, 'Company': a.current_company,
              'Designation': a.current_designation, 'Industry': a.industry, 'Location': a.current_location,
            })),
            'alumni-placement-list'
          )}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={12} /> Placement List
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {['Name', 'Program / Batch', 'Grad Year', 'Company', 'Designation', 'Industry', 'Location'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>
              )) : alumni.filter(a => a.current_company).slice(0, 50).map(a => (
                <tr key={a._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700 dark:text-slate-200">{a.program || '—'}</div>
                    <div className="text-xs text-gray-400">{a.batch || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{a.graduation_year || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">{a.current_company}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{a.current_designation || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{a.industry || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{a.current_location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
