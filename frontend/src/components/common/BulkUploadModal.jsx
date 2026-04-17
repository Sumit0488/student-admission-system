import { useState, useRef, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const STEPS = ['Select File', 'Validate File', 'Completed'];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

function StepIndicator({ current }) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      {STEPS.map((s, i) => (
        <div key={s} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${i === current ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            i < current ? 'bg-blue-700 text-white' : i === current ? 'bg-blue-700 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
          }`}>
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          <span className={`text-sm font-medium ${i === current ? 'text-blue-700 dark:text-blue-400' : i < current ? 'text-gray-700 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'}`}>
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}

function Step1({ requiredColumns, sampleHeaders, sampleFilename, onNext }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState('');
  const inputRef = useRef();

  const handleFile = useCallback((f) => {
    setFile(f);
    setParseError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { headers, rows } = parseCSV(e.target.result);
        const missing = requiredColumns.filter((c) => !headers.includes(c));
        if (missing.length > 0) {
          setParseError(`Missing required columns: ${missing.join(', ')}`);
          setParsed(null);
          return;
        }
        setParsed({ headers, rows });
      } catch {
        setParseError('Failed to parse file. Ensure it is a valid CSV.');
        setParsed(null);
      }
    };
    reader.readAsText(f);
  }, [requiredColumns]);

  const downloadSample = () => {
    const blob = new Blob([sampleHeaders.join(',') + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sampleFilename || 'sample_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-slate-300">sample file :</span>
        <button onClick={downloadSample}
          className="px-4 py-1.5 text-sm font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors">
          Download
        </button>
      </div>

      <div
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <FileText size={52} className="text-blue-400" />
            <button onClick={() => inputRef.current.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              +
            </button>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white">Select files</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Drop files here or click{' '}
              <button onClick={() => inputRef.current.click()} className="text-blue-600 dark:text-blue-400 underline">browse</button>
              {' '}from your device
            </p>
          </div>
          {file && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
              <CheckCircle size={13} /> {file.name}
            </div>
          )}
          {parseError && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              <AlertCircle size={13} /> {parseError}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button disabled className="px-5 py-2 text-sm font-medium text-gray-400 border border-gray-200 dark:border-slate-600 rounded-lg">
          Cancel
        </button>
        <button onClick={() => parsed && onNext(parsed)} disabled={!parsed}
          className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-40 transition-colors">
          Upload
        </button>
      </div>
    </div>
  );
}

function Step2({ parsed, uploadFn, errorKey, onNext, onBack }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    setUploading(true);
    setError('');
    try {
      const { data } = await uploadFn(parsed.rows);
      onNext(data.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{parsed.rows.length} rows ready to import</p>
        </div>
        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-800">
                {parsed.headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {parsed.rows.slice(0, 8).map((row, i) => (
                <tr key={i}>
                  {parsed.headers.map((h) => (
                    <td key={h} className="px-3 py-2 text-gray-700 dark:text-slate-300 text-xs">{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {parsed.rows.length > 8 && (
            <p className="px-4 py-2 text-xs text-gray-400 dark:text-slate-500">...and {parsed.rows.length - 8} more rows</p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onBack} className="px-5 py-2 text-sm font-medium text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
          Cancel
        </button>
        <button onClick={handleUpload} disabled={uploading}
          className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {uploading ? 'Importing...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

function Step3({ result, errorKey, onClose, onSuccess }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle size={34} className="text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Import Complete!</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          <strong>{result?.created ?? 0}</strong> records created successfully.
          {result?.errors?.length > 0 && (
            <> <span className="text-red-500">{result.errors.length} error{result.errors.length > 1 ? 's' : ''}</span> skipped.</>
          )}
        </p>
      </div>
      {result?.errors?.length > 0 && (
        <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-left">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5">Errors (invalid rows were skipped):</p>
          <ul className="space-y-0.5 text-xs text-red-600 dark:text-red-400">
            {result.errors.slice(0, 5).map((e, i) => (
              <li key={i}>{e[errorKey] || e.name || e.usn || `Row ${i + 1}`}: {e.error}</li>
            ))}
            {result.errors.length > 5 && <li>...and {result.errors.length - 5} more</li>}
          </ul>
        </div>
      )}
      <button onClick={() => { onSuccess?.(result); onClose(); }}
        className="px-6 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
        Done
      </button>
    </div>
  );
}

export default function BulkUploadModal({
  title,
  uploadFn,
  sampleHeaders = [],
  sampleFilename = 'sample_template.csv',
  requiredColumns = [],
  notes = [],
  errorKey = 'name',
  onClose,
  onSuccess,
}) {
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState(null);
  const [result, setResult] = useState(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-6 p-6">
          <StepIndicator current={step} />
          <div className="flex-1 min-w-0">
            {step === 0 && (
              <Step1
                requiredColumns={requiredColumns}
                sampleHeaders={sampleHeaders}
                sampleFilename={sampleFilename}
                onNext={(p) => { setParsed(p); setStep(1); }}
              />
            )}
            {step === 1 && (
              <Step2
                parsed={parsed}
                uploadFn={uploadFn}
                errorKey={errorKey}
                onNext={(r) => { setResult(r); setStep(2); }}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <Step3 result={result} errorKey={errorKey} onClose={onClose} onSuccess={onSuccess} />
            )}
          </div>
        </div>

        {notes.length > 0 && step < 2 && (
          <div className="px-6 pb-5 pt-0">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/40 rounded-xl p-3">
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Note:</p>
              {notes.map((n, i) => <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400">{n}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
