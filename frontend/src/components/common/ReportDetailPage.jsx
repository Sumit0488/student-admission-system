import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, RefreshCw, Download, FileText } from 'lucide-react';
import { generatePDF } from '../../utils/pdfReport';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Shared filter components ──────────────────────────────────────────────────
function MultiCheckboxDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = (opt) => {
    if (opt === 'All') { onChange(['All']); return; }
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt && s !== 'All')
      : [...selected.filter(s => s !== 'All'), opt];
    onChange(next.length ? next : ['All']);
  };

  const displayLabel = selected.includes('All') || selected.length === 0
    ? label
    : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between gap-2 min-w-[180px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
        <span className="truncate">{displayLabel}</span>
        <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[220px] max-h-72 overflow-y-auto py-1">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
              <input type="checkbox"
                checked={selected.includes(opt) || (opt === 'All' && (selected.includes('All') || selected.length === 0))}
                onChange={() => toggle(opt)}
                className="rounded border-slate-300 text-blue-600"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectFilter({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[160px]">
      <label className="text-[10px] text-slate-500 uppercase tracking-wide px-0.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function DateFilter({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[160px]">
      <label className="text-[10px] text-slate-500 uppercase tracking-wide px-0.5">{label}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')} ${d.toLocaleString('en',{month:'short'})} ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${d.getHours()>=12?'PM':'AM'}`;
}

/**
 * Shared report drill-down page used by all module report pages.
 *
 * Props:
 *   cfg         — report config object { name, description, filters, columns, rowKeys, pdfColumns, apiPath, apiParams, pdfMapper }
 *   storageKey  — localStorage key for persisting generated rows
 *   onBack      — callback to return to section listing
 */
export default function ReportDetailPage({ cfg, storageKey, onBack }) {
  const { tenant } = useAuth();

  const initFilters = () => {
    const f = {};
    cfg.filters.forEach(fi => {
      if (fi.type === 'multi') f[fi.id] = ['All'];
      else if (fi.type === 'date') f[fi.id] = '';
      else f[fi.id] = fi.options[0];
    });
    return f;
  };

  const [filters, setFilters] = useState(initFilters);
  const [rows, setRows] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch { return []; }
  });
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);

  const saveRows = r => { setRows(r); localStorage.setItem(storageKey, JSON.stringify(r)); };

  const buildFilterSummary = f => {
    const summary = {};
    cfg.filters.forEach(fi => {
      const v = f[fi.id];
      if (v && v !== '' && !(Array.isArray(v) && v.includes('All')) && v !== 'All') {
        summary[fi.label] = Array.isArray(v) ? v.filter(x => x !== 'All').join(', ') : v;
      }
    });
    return summary;
  };

  const fetchAndBuildPdf = async filterSummary => {
    const params = { limit: 500, ...(cfg.apiParams || {}) };
    const { data: resp } = await api.get(cfg.apiPath, { params });
    const records = resp.data || resp || [];
    const pdfRows = cfg.pdfMapper(records);
    generatePDF({
      title: cfg.name,
      filters: filterSummary,
      columns: cfg.pdfColumns,
      rows: pdfRows,
      filename: `${cfg.name.replace(/\s+/g, '_')}_${Date.now()}`,
      institution: tenant?.name,
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const filterSummary = buildFilterSummary(filters);
      await fetchAndBuildPdf(filterSummary);

      const newRow = {
        id: Date.now(),
        name: cfg.name,
        report_type: 'PDF',
        _filterSummary: filterSummary,
        requested_at: fmtDate(new Date().toISOString()),
        generated_by: 'Admin',
        status: 'Download',
      };
      cfg.filters.forEach(fi => {
        const v = filters[fi.id];
        newRow[fi.id] = Array.isArray(v)
          ? (v.includes('All') ? 'All' : v.join(', '))
          : (v || 'All');
      });
      saveRows([newRow, ...rows]);
    } catch (err) {
      console.error(err);
      setError('Failed to generate report. Check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async row => {
    setDownloadingId(row.id);
    try { await fetchAndBuildPdf(row._filterSummary || {}); }
    catch { setError('Failed to download. Please try again.'); }
    finally { setDownloadingId(null); }
  };

  const filterRows = [];
  for (let i = 0; i < cfg.filters.length; i += 4) filterRows.push(cfg.filters.slice(i, i + 4));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{cfg.name}</h1>
            {cfg.description && <p className="text-xs text-slate-500">{cfg.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilters(initFilters())} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Reset filters">
            <RefreshCw size={15} />
          </button>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        {filterRows.map((row, ri) => (
          <div key={ri} className="flex flex-wrap gap-3">
            {row.map(fi => {
              if (fi.type === 'multi') return (
                <div key={fi.id} className="flex flex-col gap-0.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wide px-0.5">{fi.label}</label>
                  <MultiCheckboxDropdown
                    label={fi.label}
                    options={fi.options}
                    selected={filters[fi.id] || ['All']}
                    onChange={v => setFilters(f => ({ ...f, [fi.id]: v }))}
                  />
                </div>
              );
              if (fi.type === 'date') return (
                <DateFilter key={fi.id} label={fi.label} value={filters[fi.id] || ''}
                  onChange={v => setFilters(f => ({ ...f, [fi.id]: v }))} />
              );
              return (
                <SelectFilter key={fi.id} label={fi.label} options={fi.options}
                  value={filters[fi.id] || fi.options[0]}
                  onChange={v => setFilters(f => ({ ...f, [fi.id]: v }))} />
              );
            })}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-20 text-center">
            <FileText size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              Select filters above and click <span className="font-semibold">Generate</span> to create and download a report.
            </p>
            <p className="text-xs text-slate-400 mt-1">Reports are generated in PDF format and saved here for re-download.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {cfg.columns.map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    {cfg.rowKeys.map((key, i) => (
                      <td key={i} className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                        {key === 'status' ? (
                          <button onClick={() => handleDownload(row)} disabled={downloadingId === row.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                            <Download size={11} /> {downloadingId === row.id ? 'Downloading…' : 'Download'}
                          </button>
                        ) : key === 'name' ? (
                          <span className="font-medium text-slate-800">{row[key] ?? '—'}</span>
                        ) : key === 'report_type' ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">{row[key] ?? '—'}</span>
                        ) : (row[key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

