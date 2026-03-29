import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMISSION_STATUSES = ['APPLIED', 'APPROVED', 'REJECTED', 'ENROLLED'];

const STATUS_TRANSITIONS = {
  APPLIED: ['APPLIED', 'APPROVED', 'REJECTED'],
  APPROVED: ['APPROVED', 'ENROLLED', 'REJECTED'],
  REJECTED: ['REJECTED', 'APPLIED'],
  ENROLLED: ['ENROLLED'],
};

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  program: '',
  department: '',
  admissionStatus: 'APPLIED',
  batch: '',
  term: '',
  remarks: '',
};

export default function StudentForm({ initialValues, onSubmit, loading, submitLabel = 'Save' }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setForm({
        fullName: initialValues.fullName || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        program: initialValues.program || '',
        department: initialValues.department || '',
        admissionStatus: initialValues.admissionStatus || 'APPLIED',
        batch: initialValues.batch || '',
        term: initialValues.term ?? '',
        remarks: initialValues.remarks || '',
      });
    }
  }, [initialValues]);

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 2) newErrors.fullName = 'Min 2 characters';

    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Invalid email address';

    if (form.phone && !/^[+\d\s\-()]{7,20}$/.test(form.phone))
      newErrors.phone = 'Invalid phone number';

    if (form.term && (isNaN(form.term) || form.term < 1 || form.term > 20))
      newErrors.term = 'Term must be between 1 and 20';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = { ...form };
    if (data.term === '' || data.term === null) delete data.term;
    else data.term = parseInt(data.term);

    // Strip empty strings
    Object.keys(data).forEach((k) => {
      if (data[k] === '') data[k] = null;
    });

    onSubmit(data);
  };

  const allowedStatuses = initialValues
    ? STATUS_TRANSITIONS[initialValues.admissionStatus] || ADMISSION_STATUSES
    : ADMISSION_STATUSES;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`input ${errors.fullName ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. John Smith"
            />
            {errors.fullName && <p className="error-text">{errors.fullName}</p>}
          </div>

          <div>
            <label className="label">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              className={`input ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. john@example.com"
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              className={`input ${errors.phone ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. +1 555 000 0000"
            />
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </div>
        </div>
      </section>

      {/* Academic Info */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Academic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Program</label>
            <input
              className="input"
              name="program"
              value={form.program}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
            />
          </div>

          <div>
            <label className="label">Department</label>
            <input
              className="input"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. Engineering"
            />
          </div>

          <div>
            <label className="label">Batch</label>
            <input
              className="input"
              name="batch"
              value={form.batch}
              onChange={handleChange}
              placeholder="e.g. 2024-Fall"
            />
          </div>

          <div>
            <label className="label">Term</label>
            <input
              className={`input ${errors.term ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
              name="term"
              type="number"
              min="1"
              max="20"
              value={form.term}
              onChange={handleChange}
              placeholder="e.g. 1"
            />
            {errors.term && <p className="error-text">{errors.term}</p>}
          </div>

          <div>
            <label className="label">Admission Status</label>
            <select
              className="input"
              name="admissionStatus"
              value={form.admissionStatus}
              onChange={handleChange}
            >
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {initialValues && (
              <p className="text-xs text-gray-500 mt-1">
                Only valid transitions from current status are shown.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Remarks */}
      <section>
        <label className="label">Remarks</label>
        <textarea
          className="input resize-none"
          name="remarks"
          rows={3}
          value={form.remarks}
          onChange={handleChange}
          placeholder="Optional notes about this student..."
        />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
