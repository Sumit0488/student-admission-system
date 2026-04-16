import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Search, MoreVertical, X, ChevronLeft, ChevronRight, Mail, MessageCircle, Download } from 'lucide-react';
import { getBankLoans, createBankLoan, updateBankLoan, deleteBankLoan } from '../../services/generalApi';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useDebounce } from '../../hooks/useDebounce';

const LOAN_TYPES = ['Student Loan', 'Education Loan', 'Personal Loan', 'Other'];

const LIMIT = 20;

const emptyForm = {
  student_name: '',
  bank_name: '',
  account_number: '',
  reference_number: '',
  loan_date: '',
  amount: '',
  loan_type: 'Student Loan',
  notes: '',
};

export default function BankLoanPage() {
  const [urlParams, setUrlParams] = useUrlFilters({ q: '', page: '1' });
  const search = urlParams.q;
  const page   = Number(urlParams.page) || 1;
  const debouncedSearch = useDebounce(search, 350);

  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBankLoans({ page, limit: LIMIT, search: debouncedSearch || undefined });
      setLoans(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (loan) => {
    setForm({
      student_name: loan.student_name || '',
      bank_name: loan.bank_name || '',
      account_number: loan.account_number || '',
      reference_number: loan.reference_number || '',
      loan_date: loan.loan_date ? loan.loan_date.slice(0, 10) : '',
      amount: loan.amount || '',
      loan_type: loan.loan_type || 'Student Loan',
      notes: loan.notes || '',
    });
    setEditId(loan._id);
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bank loan record?')) return;
    try { await deleteBankLoan(id); fetchLoans(); } catch { /* ignore */ }
    setMenuOpen(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.student_name || !form.bank_name || !form.amount) return;
    setSaving(true);
    try {
      if (editId) await updateBankLoan(editId, form);
      else await createBankLoan(form);
      setShowModal(false);
      fetchLoans();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatAmount = (a) =>
    a !== undefined && a !== null
      ? '₹ ' + Number(a).toLocaleString('en-IN')
      : '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bank Loan</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage student bank loan records</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Bank Loan
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Search + Actions bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student or bank name..."
              value={search}
              onChange={(e) => setUrlParams({ q: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
            from <span className="font-semibold text-gray-700 dark:text-slate-300">{total.toLocaleString()}</span> Bank Loans
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" title="Send Email" className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Mail size={15} /></button>
            <button type="button" title="Send WhatsApp" className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><MessageCircle size={15} /></button>
            <button type="button" title="Download" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><Download size={15} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Bank Name</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Account Number</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Reference Number</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Loan Type</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Building2 size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">No bank loan records found</p>
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{loan.student_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{loan.bank_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-slate-300">{loan.account_number || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-slate-300">{loan.reference_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{formatDate(loan.loan_date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatAmount(loan.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{loan.loan_type || '—'}</td>
                    <td className="px-4 py-3 relative">
                      <button onClick={() => setMenuOpen(menuOpen === loan._id ? null : loan._id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                        <MoreVertical size={14} />
                      </button>
                      {menuOpen === loan._id && (
                        <div className="absolute right-4 top-8 z-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg w-32 py-1">
                          <button onClick={() => openEdit(loan)} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Edit</button>
                          <button onClick={() => handleDelete(loan._id)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Page <span className="font-semibold text-gray-600 dark:text-slate-300">{page}</span> · {total} total
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setUrlParams({ page: String(page - 1) }, { resetPage: false })}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Prev</button>
              <button disabled={page === totalPages} onClick={() => setUrlParams({ page: String(page + 1) }, { resetPage: false })}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>


      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">{editId ? 'Edit Bank Loan' : '+ Bank Loan'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Student Name *</label>
                  <input required value={form.student_name} onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Student name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bank Name *</label>
                  <input required value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. SBI, HDFC" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Account Number</label>
                  <input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Account number" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reference Number</label>
                  <input value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Reference number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Loan Date</label>
                  <input type="date" value={form.loan_date} onChange={e => setForm(f => ({ ...f, loan_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Amount (₹) *</label>
                  <input required type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Loan Type</label>
                <select value={form.loan_type} onChange={e => setForm(f => ({ ...f, loan_type: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : editId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
