import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ShoppingCart, X, Mail, MessageCircle, Download as DownloadIcon, Eye } from 'lucide-react';
import QuickViewDrawer from '../../components/common/QuickViewDrawer';
import EntityDropdown from '../../components/common/EntityDropdown';
import { getBillingOrders, createBillingOrder } from '../../services/billingApi';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';
import { useFeeCategories } from '../../hooks/useFeeCategories';

const STATUS_STYLE = {
  paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  created: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

const COLS = ['Customer ID', 'Customer Name', 'Entity', 'Order ID', 'Fee Category', 'Amount (₹)', 'Attempts', 'Created At', 'Status', ''];
const EMPTY_FORM = { customer_name: '', customer_id: '', entity: 'billing_order', fee_category: '', fee_order_amount: '', _customerId: '' };

const LIMIT = 20;

const DEFAULT_BILLING_CATS = ['Service Charge', 'Product Fee', 'Registration Fee', 'Miscellaneous', 'Other'];

function AddModal({ onClose, onSave }) {
  const { categories: configCategories, loading: catLoading } = useFeeCategories('Billing', DEFAULT_BILLING_CATS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    if (!form.fee_category && configCategories.length > 0) {
      setForm(f => ({ ...f, fee_category: configCategories[0] }));
    }
  }, [configCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name) return;
    setSaving(true);
    try {
      const { _customerId, ...payload } = form;
      await onSave({ ...payload, fee_order_amount: parseFloat(form.fee_order_amount) || 0 });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Customer *</label>
            <EntityDropdown
              url="/api/billing/customers"
              labelKey="name"
              valueKey="_id"
              value={form._customerId || ''}
              onChange={(val, _norm, rawItem) => {
                setSelectedCustomer(rawItem);
                setForm(f => ({
                  ...f,
                  _customerId: val,
                  customer_name: rawItem?.name || '',
                  customer_id: rawItem?.customer_id || val,
                }));
              }}
              blankLabel="— Select Customer —"
            />
            {selectedCustomer && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                ID: {selectedCustomer.customer_id} · {selectedCustomer.mobile_number || 'no mobile'}
              </p>
            )}
            {!form._customerId && (
              <input
                value={form.customer_name}
                onChange={(e) => set('customer_name', e.target.value)}
                placeholder="Or type customer name manually"
                className={`${inp} mt-2`}
              />
            )}
          </div>

          {/* Fee Category — from Configuration */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
              Fee Category * <span className="text-gray-400 font-normal">(from Fee Configuration)</span>
            </label>
            <select required value={form.fee_category} onChange={(e) => set('fee_category', e.target.value)} className={inp}>
              {catLoading ? <option>Loading categories…</option> :
                configCategories.length === 0
                  ? <option value="">— No categories configured —</option>
                  : configCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {!catLoading && configCategories.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">
                No Billing categories found. Go to Fee Management → Configuration → Fee Category and create categories for "Billing" module.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Amount (₹) *</label>
            <input required type="number" step="0.01" min="0" value={form.fee_order_amount} onChange={(e) => set('fee_order_amount', e.target.value)} className={inp} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BillingOrdersPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useUrlFilters({ q: '', page: '1' });
  const search = urlParams.q;
  const page   = Number(urlParams.page) || 1;
  const debouncedSearch = useDebounce(search, 350);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const { toasts, toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (debouncedSearch) params.q = debouncedSearch;
      const { data } = await getBillingOrders(params);
      setOrders(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (payload) => {
    try {
      const { data } = await createBillingOrder(payload);
      setOrders((p) => [data.data, ...p]);
      toast('Order created');
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed', 'error');
      throw err;
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtAmt = (n) => n ? `₹ ${Number(n).toLocaleString('en-IN')}` : '—';

  return (
    <>
      <Toasts toasts={toasts} />
      {quickView && <QuickViewDrawer entityType="orders" entityId={quickView} onClose={() => setQuickView(null)} title="Order" />}
      {showModal && <AddModal onClose={() => setShowModal(false)} onSave={handleCreate} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Billing orders management</p>
          </div>
          <button onClick={() => navigate('/admin/billing/create-order')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Order
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Search + Actions bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-slate-700/50 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setUrlParams({ q: e.target.value })}
                placeholder="Search by customer name or order ID..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
              from <span className="font-semibold text-gray-700 dark:text-slate-300">{total.toLocaleString()}</span> Orders
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" title="Send Email" className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Mail size={15} /></button>
              <button type="button" title="Send WhatsApp" className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><MessageCircle size={15} /></button>
              <button type="button" title="Download" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><DownloadIcon size={15} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50">
                  {COLS.map((h) => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <tr key={i}>{COLS.map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>)}</tr>)
                ) : orders.length === 0 ? (
                  <tr><td colSpan={COLS.length} className="px-6 py-16 text-center">
                    <ShoppingCart size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">No orders found</p>
                  </td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{o.customer_id || o.customer_crm_id || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{o.customer_name || o.student_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{o.entity}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{o.order_id}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{o.fee_category}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmtAmt(o.fee_order_amount)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{o.attempts}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[o.order_status] || STATUS_STYLE.created}`}>
                          {o.order_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setQuickView(o._id)} title="Quick View" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Eye size={13} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && total > LIMIT && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Page <span className="font-semibold text-gray-600 dark:text-slate-300">{page}</span> · {total} total
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setUrlParams({ page: String(Math.max(1, page - 1)) }, { resetPage: false })} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Prev</button>
                <button onClick={() => setUrlParams({ page: String(page + 1) }, { resetPage: false })} disabled={page * LIMIT >= total}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
