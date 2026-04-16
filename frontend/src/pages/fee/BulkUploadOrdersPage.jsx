import { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import { bulkUploadOrders } from '../../services/feeApi';

const STEPS = ['Select File', 'Verify Data', 'Finish Import'];

const THINGS_TO_NOTE = [
  'Please ensure the data uploading are the right one.',
  'Fee Heads can be added in columns file with same as below',
];
const FEE_HEAD_EXAMPLES = [
  '1. Development fee',
  '2. Tuition fee',
  '3. Other fee',
  '4. Application & Admission fee',
  '5. University Reg fee',
  '6. College Fee',
];

const REQUIRED_COLUMNS = ['usn', 'student_name', 'program', 'fee_order_amount'];

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

function Step1({ onNext, scheduleId }) {
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
        const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
        if (missing.length > 0) {
          setParseError(`Missing columns: ${missing.join(', ')}`);
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
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleExport = () => {
    const header = 'usn,student_name,program,fee_order_amount\n';
    const blob = new Blob([header], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_orders_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Download a sample format or .xls format file and compare it with your import file to ensure that the file is ready to import.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-slate-300">Student data to export :</span>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              EXPORT
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            className="hidden"
            onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <FileText size={56} className="text-blue-500" />
              <button
                onClick={() => inputRef.current.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-lg font-bold"
              >
                +
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white text-lg">Select files</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Drop files here or click{' '}
                <button
                  onClick={() => inputRef.current.click()}
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  browse
                </button>{' '}
                thorough your machine
              </p>
            </div>
            {file && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                <CheckCircle size={14} />
                {file.name}
              </div>
            )}
            {parseError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                <AlertCircle size={14} />
                {parseError}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button className="px-5 py-2 text-sm font-medium text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg">
            PREVIOUS
          </button>
          <button
            onClick={() => parsed && onNext(parsed)}
            disabled={!parsed}
            className="px-5 py-2 text-sm font-semibold bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-300 rounded-lg disabled:opacity-50 hover:bg-blue-600 hover:text-white disabled:hover:bg-gray-300 disabled:hover:text-gray-500 transition-colors"
          >
            NEXT
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-white">Things to note</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300">{THINGS_TO_NOTE[0]}</p>
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{THINGS_TO_NOTE[1]}</p>
          <ul className="mt-2 space-y-1">
            {FEE_HEAD_EXAMPLES.map((ex) => (
              <li key={ex} className="text-sm text-gray-600 dark:text-slate-300">{ex}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Step2({ parsed, onNext, onBack, scheduleId }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    setUploading(true);
    setError('');
    try {
      const { data } = await bulkUploadOrders(scheduleId, parsed.rows);
      setResult(data.data);
      onNext(data.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
            {parsed.rows.length} rows to import
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {parsed.headers.map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {parsed.rows.slice(0, 10).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30">
                  {parsed.headers.map((h) => (
                    <td key={h} className="px-4 py-2 text-gray-700 dark:text-slate-300">{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {parsed.rows.length > 10 && (
            <div className="px-4 py-2 text-xs text-gray-400 dark:text-slate-500">
              ... and {parsed.rows.length - 10} more rows
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="px-5 py-2 text-sm font-medium text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
          PREVIOUS
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Importing...' : 'IMPORT'}
        </button>
      </div>
    </div>
  );
}

function Step3({ result, scheduleId }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle size={40} className="text-green-600" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Import Complete!</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
          Successfully created <strong>{result?.created}</strong> orders.
          {result?.errors?.length > 0 && (
            <> <span className="text-red-500">{result.errors.length} errors</span> occurred.</>
          )}
        </p>
      </div>
      {result?.errors?.length > 0 && (
        <div className="w-full max-w-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Errors:</p>
          <ul className="space-y-1 text-xs text-red-600 dark:text-red-400">
            {result.errors.slice(0, 5).map((e, i) => (
              <li key={i}>{e.usn}: {e.error}</li>
            ))}
            {result.errors.length > 5 && <li>... and {result.errors.length - 5} more</li>}
          </ul>
        </div>
      )}
      <button
        onClick={() => navigate(`/admin/fee/tracker/${scheduleId}`)}
        className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Schedule
      </button>
    </div>
  );
}

export default function BulkUploadOrdersPage() {
  const { id: scheduleId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState(null);
  const [result, setResult] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bulk Upload - Student Orders</h1>
      </div>

      {/* Steps */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    i < step
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : i === step
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                  }`}
                >
                  {i < step ? <CheckCircle size={18} /> : (
                    i === 0 ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                    ) : i === 1 ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.35C18 2.55 15.45 0 12.33 0c-1.74 0-3.41.81-4.5 2.09L6 4 4.67 2.09C3.59.81 1.93 0 .33 0 .15 0 0 .15 0 .33v4.33C0 5.48.56 6 1.25 6H4v14h16V6zm-8 11l-4-4h3V9h2v4h3l-4 4z"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    )
                  )}
                </div>
                <p className={`mt-2 text-xs font-medium whitespace-nowrap ${i === step ? 'text-blue-600 dark:text-blue-400' : i < step ? 'text-gray-600 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'}`}>
                  {s}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-24 h-0.5 mx-2 mb-5 ${i < step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <Step1
            scheduleId={scheduleId}
            onNext={(p) => { setParsed(p); setStep(1); }}
          />
        )}
        {step === 1 && (
          <Step2
            parsed={parsed}
            scheduleId={scheduleId}
            onNext={(r) => { setResult(r); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step3 result={result} scheduleId={scheduleId} />
        )}
      </div>
    </div>
  );
}
