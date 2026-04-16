/**
 * NewScheduleWizard — shared 4-step fee-schedule creation wizard.
 * Used in: FeeConfigPage (Configuration > Fee > Fee Schedule)
 *          FeeTrackerPage (Fee Tracker > New Schedule button)
 *
 * Props:
 *   onClose()              — called when user cancels
 *   onCreated(schedule)    — called with the new schedule document after save
 *   toast(msg, type?)      — toast notification callback
 */
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import {
  getFeeCategories,
  getFeeHeads,
  createFeeSchedule,
} from '../services/feeApi';
import { getMasterData } from '../services/configApi';

const STEPS = ['Fee Type', 'Stream Info', 'Academic Info', 'Schedule Info'];

const SEMESTERS = [
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester',
];

const inputCls =
  'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';
const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1';

export default function NewScheduleWizard({ onClose, onCreated, toast }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Dropdown option lists
  const [categories, setCategories] = useState([]);
  const [streams, setStreams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);

  // Form state
  const [form, setForm] = useState({
    fee_category: '',
    stream_id: '',
    stream_name: '',
    academic_year: '',
    semester: '',
    notify_sms: false,
    notify_email: false,
    min_amount: '',
    payment_type: 'partial',
    start_date: '',
    end_date: '',
    fee_particulars: [], // [{ fee_head, fee_head_amount }]
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Fetch all dropdown data on mount
  useEffect(() => {
    getFeeCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
    getMasterData('stream')
      .then(({ data }) => setStreams(data.data || []))
      .catch(() => {});
    getMasterData('academic_year')
      .then(({ data }) => setAcademicYears(data.data || []))
      .catch(() => {});
    getFeeHeads()
      .then(({ data }) => setFeeHeads(data.data || []))
      .catch(() => {});
  }, []);

  // Fee-head row helpers
  const addFeeHead = () =>
    setForm((p) => ({
      ...p,
      fee_particulars: [...p.fee_particulars, { fee_head: '', fee_head_amount: '' }],
    }));

  const removeFeeHead = (i) =>
    setForm((p) => ({
      ...p,
      fee_particulars: p.fee_particulars.filter((_, idx) => idx !== i),
    }));

  const updateFeeHead = (i, k, v) =>
    setForm((p) => {
      const arr = [...p.fee_particulars];
      arr[i] = { ...arr[i], [k]: v };
      return { ...p, fee_particulars: arr };
    });

  const canNext = () => {
    if (step === 0) return !!form.fee_category;
    if (step === 1) return !!form.stream_id;
    if (step === 2) return !!form.academic_year && !!form.semester;
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        fee_category: form.fee_category,
        stream_id: form.stream_id,
        stream: { stream_name: form.stream_name, stream_code: form.stream_id },
        academic_year: form.academic_year,
        semester: form.semester,
        notify_sms: form.notify_sms,
        notify_email: form.notify_email,
        min_amount: parseFloat(form.min_amount) || 0,
        payment_type: form.payment_type,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        fee_particulars: form.fee_particulars
          .filter((fp) => fp.fee_head)
          .map((fp, i) => ({
            fee_head: fp.fee_head,
            fee_head_priority: i + 1,
            fee_head_amount: parseFloat(fp.fee_head_amount) || 0,
          })),
        fee_sched_status: 'draft',
        entity: 'fee_schedule',
      };
      const { data } = await createFeeSchedule(payload);
      onCreated(data.data);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create schedule', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">New Fee Schedule</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex px-5 pt-4 gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Step 0: Fee Type (Category) ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Select the fee category for this schedule.
              </p>
              <div>
                <label className={labelCls}>Fee Category *</label>
                <select
                  value={form.fee_category}
                  onChange={(e) => set('fee_category', e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Select fee category —</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.fee_category}>
                      {c.fee_category}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    No fee categories found. Add one in Fee Configuration → Fee Category.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Stream Info ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Select the stream for this fee schedule.
              </p>
              <div>
                <label className={labelCls}>Stream *</label>
                <select
                  value={form.stream_id}
                  onChange={(e) => {
                    const opt = streams.find((s) => s.value === e.target.value);
                    set('stream_id', e.target.value);
                    set('stream_name', opt?.label || e.target.value);
                  }}
                  className={inputCls}
                >
                  <option value="">— Select stream —</option>
                  {streams.map((s) => (
                    <option key={s._id} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {streams.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    No streams found. Add streams in Configuration → Academic Setting → Stream.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Academic Info ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Select the academic year and semester.
              </p>
              <div>
                <label className={labelCls}>Academic Year *</label>
                <select
                  value={form.academic_year}
                  onChange={(e) => set('academic_year', e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Select academic year —</option>
                  {academicYears.map((y) => (
                    <option key={y._id} value={y.label}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Semester *</label>
                <select
                  value={form.semester}
                  onChange={(e) => set('semester', e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Select semester —</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Step 3: Schedule Info ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Notifications */}
              <div>
                <p className={labelCls}>Notifications</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notify_sms}
                      onChange={(e) => set('notify_sms', e.target.checked)}
                      className="rounded"
                    />
                    Send notification in SMS
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notify_email}
                      onChange={(e) => set('notify_email', e.target.checked)}
                      className="rounded"
                    />
                    Send notification in Email
                  </label>
                </div>
              </div>

              {/* Minimum Amount */}
              <div>
                <label className={labelCls}>Minimum Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.min_amount}
                  onChange={(e) => set('min_amount', e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </div>

              {/* Payment Type — Partial / Full only */}
              <div>
                <p className={labelCls}>Payment Type</p>
                <div className="flex gap-6">
                  {['partial', 'full'].map((pt) => (
                    <label
                      key={pt}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="payment_type"
                        value={pt}
                        checked={form.payment_type === pt}
                        onChange={() => set('payment_type', pt)}
                      />
                      {pt.charAt(0).toUpperCase() + pt.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => set('start_date', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => set('end_date', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Additional Fee Heads */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={`${labelCls} mb-0`}>Additional Fee Heads</p>
                  <button
                    type="button"
                    onClick={addFeeHead}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={12} /> Add Head
                  </button>
                </div>
                {form.fee_particulars.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                    No fee heads added yet. Click "+ Add Head" to add.
                  </p>
                )}
                <div className="space-y-2">
                  {form.fee_particulars.map((fp, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={fp.fee_head}
                        onChange={(e) => updateFeeHead(i, 'fee_head', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">— Select head —</option>
                        {feeHeads.map((h) => (
                          <option key={h._id} value={h.fee_head}>
                            {h.fee_head}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={fp.fee_head_amount}
                        onChange={(e) => updateFeeHead(i, 'fee_head_amount', e.target.value)}
                        className="w-28 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeeHead(i)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
