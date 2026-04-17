import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search, X, ChevronLeft, User, Building2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getBillingCustomers, createBillingOrder, collectBillingPayment } from '../../services/billingApi';
import { getFeeHeads } from '../../services/feeApi';
import { useFeeCategories } from '../../hooks/useFeeCategories';
import { useToast } from '../../hooks/useToast';
import Toasts from '../../components/Toasts';

const PAY_METHODS = ['CASH', 'CHEQUE', 'DD', 'PO', 'RTGS/NEFT', 'BOOK ADJUSTMENT', 'WALLET', 'POS'];
const DEFAULT_BILLING_CATS = ['Service Charge', 'Product Fee', 'Registration Fee', 'Miscellaneous', 'Other'];
const genId = () => Math.random().toString(36).slice(2);

// ─── Customer Selector Modal ──────────────────────────────────────────────────
function CustomerModal({ onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (q) => {
    setLoading(true);
    try {
      const { data } = await getBillingCustomers({ q, limit: 30 });
      setCustomers(data.data || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(search); }, [search, fetch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Select Customer</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="px-5 pt-3">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <User size={12} /> Customer
          </span>
        </div>
        <div className="px-5 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID or phone..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-1.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))
          ) : customers.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">No customers found</p>
          ) : (
            customers.map(c => (
              <button
                key={c._id}
                onClick={() => onSelect(c)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                  {(c.name || c.customer_name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name || c.customer_name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{c.customer_id || c._id?.slice(-6)} · {c.phone || c.mobile || '—'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Collect Payment Modal ────────────────────────────────────────────────────
function CollectModal({ order, onClose, onCollected }) {
  const { toasts, toast } = useToast();
  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState(String(order.fee_due_amount ?? order.fee_order_amount ?? ''));
  const [refNo, setRefNo] = useState('');
  const [saving, setSaving] = useState(false);

  const remaining = order.fee_due_amount ?? order.fee_order_amount ?? 0;
  const amtNum = parseFloat(amount) || 0;
  const canCollect = !!method && amtNum > 0 && amtNum <= remaining + 0.01;

  const handleCollect = async () => {
    if (!canCollect) return;
    setSaving(true);
    try {
      const { data } = await collectBillingPayment(order._id, { amount: amtNum, method, reference_no: refNo });
      onCollected(data.data);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to collect payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Toasts toasts={toasts} />
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Collect Payment</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-5">
          {/* Left: form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Payee Name</label>
              <input readOnly value={order.customer_name || ''} className={`${inp} bg-gray-100 dark:bg-slate-600 cursor-default`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Fee Method *</label>
              <select value={method} onChange={e => setMethod(e.target.value)} className={inp}>
                {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Enter Amount *</label>
              <input
                type="number" step="0.01" min="0.01" max={remaining}
                value={amount} onChange={e => setAmount(e.target.value)}
                className={inp}
              />
              {amtNum > remaining + 0.01 && (
                <p className="text-xs text-red-500 mt-1">Exceeds remaining ₹{remaining.toLocaleString('en-IN')}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Reference No <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input value={refNo} onChange={e => setRefNo(e.target.value)} className={inp} placeholder="Cheque/DD/Transaction no." />
            </div>
          </div>
          {/* Right: summary */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Summary</p>
            {[
              { l: 'Subtotal', v: order.fee_order_amount || 0 },
              { l: 'Discount', v: order.fee_discount || 0 },
              { l: 'GST', v: 0 },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">{l}</span>
                <span className="font-medium text-gray-800 dark:text-white">₹{Number(v).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between text-sm font-bold">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-blue-600 dark:text-blue-400">₹{Number(order.fee_order_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Paid</span>
              <span className="font-medium text-green-600 dark:text-green-400">₹{Number(order.fee_paid_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-900 dark:text-white">Remaining</span>
              <span className="text-orange-600 dark:text-orange-400">₹{Number(remaining).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-700 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleCollect}
            disabled={!canCollect || saving}
            className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Collecting…' : 'Collect'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toasts, toast } = useToast();
  const { categories, loading: catLoading } = useFeeCategories('Billing', DEFAULT_BILLING_CATS);

  const [customer, setCustomer]           = useState(null);
  const [category, setCategory]           = useState('');
  const [description, setDescription]     = useState('');
  const [allowPartial, setAllowPartial]   = useState(false);
  const [onHold, setOnHold]               = useState(false);
  const [particulars, setParticulars]     = useState([{ id: genId(), name: '', amount: '' }]);
  const [discount, setDiscount]           = useState('');
  const [feeHeads, setFeeHeads]           = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCollectModal, setShowCollectModal]   = useState(false);
  const [createdOrder, setCreatedOrder]   = useState(null);
  const [saving, setSaving]               = useState(false);
  const [collectPending, setCollectPending] = useState(false);

  useEffect(() => {
    getFeeHeads({ status: 'active', limit: 100 })
      .then(res => setFeeHeads((res.data.data || []).map(h => h.fee_head || h.name).filter(Boolean)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!category && categories.length > 0) setCategory(categories[0]);
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = particulars.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const total    = Math.max(0, subtotal - (parseFloat(discount) || 0));
  const canCreate = !!customer && !!category && total > 0;
  const isBusy   = saving || collectPending;

  const addRow    = () => setParticulars(p => [...p, { id: genId(), name: '', amount: '' }]);
  const removeRow = (id) => setParticulars(p => p.filter(r => r.id !== id));
  const updateRow = (id, key, val) => setParticulars(p => p.map(r => r.id === id ? { ...r, [key]: val } : r));

  const buildPayload = () => ({
    customer_id:   customer?.customer_id || String(customer?._id),
    customer_name: customer?.name || customer?.customer_name,
    fee_category:  category,
    description,
    fee_particulars: particulars
      .filter(p => p.name || parseFloat(p.amount))
      .map(p => ({
        fee_head:        p.name,
        fee_head_amount: parseFloat(p.amount) || 0,
        fee_head_due:    parseFloat(p.amount) || 0,
      })),
    fee_order_amount: total,
    fee_due_amount:   total,
    fee_discount:     parseFloat(discount) || 0,
    order_status:     onHold ? 'hold' : 'created',
    notes:            allowPartial ? 'partial_allowed' : '',
  });

  const doCreate = async () => {
    setSaving(true);
    try {
      const { data } = await createBillingOrder(buildPayload());
      setCreatedOrder(data.data);
      toast('Order created successfully');
      return data.data;
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create order', 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    try { await doCreate(); } catch {}
  };

  const handleCreateAndCollect = async () => {
    if (createdOrder) { setShowCollectModal(true); return; }
    setCollectPending(true);
    try {
      const order = await doCreate();
      if (order) setShowCollectModal(true);
    } catch {} finally {
      setCollectPending(false);
    }
  };

  const handleCollected = ({ order }) => {
    setCreatedOrder(order);
    setShowCollectModal(false);
    toast(`Payment of ₹${Number(order.fee_paid_amount).toLocaleString('en-IN')} collected`);
    setTimeout(() => navigate('/admin/billing/orders'), 1500);
  };

  const inp = 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <>
      <Toasts toasts={toasts} />
      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onSelect={c => { setCustomer(c); setShowCustomerModal(false); }}
        />
      )}
      {showCollectModal && createdOrder && (
        <CollectModal
          order={createdOrder}
          onClose={() => setShowCollectModal(false)}
          onCollected={handleCollected}
        />
      )}

      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-slate-400"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Order</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">New billing order</p>
          </div>
          {createdOrder && (
            <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
              <Check size={12} /> Created · {createdOrder.order_id}
            </span>
          )}
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">From</p>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{tenant?.name || 'Institution'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{tenant?.address || tenant?.city || 'Address not set'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">To</p>
            {customer ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {(customer.name || customer.customer_name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{customer.name || customer.customer_name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {customer.customer_id || '—'} · {customer.phone || customer.mobile || 'No phone'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <User size={16} /> Select Customer *
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Order Details */}
          <div className="col-span-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-gray-700 dark:text-white">Order Details</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inp}>
                  {catLoading
                    ? <option>Loading…</option>
                    : categories.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Discount (₹)</label>
                <input
                  type="number" step="0.01" min="0" value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className={inp} placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description</label>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                rows={2} className={`${inp} resize-none`} placeholder="Optional description…"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={allowPartial} onChange={e => setAllowPartial(e.target.checked)} className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                <span className="text-sm text-gray-700 dark:text-slate-300">Allow Partial Payment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={onHold} onChange={e => setOnHold(e.target.checked)} className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                <span className="text-sm text-gray-700 dark:text-slate-300">On Hold</span>
              </label>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-sm font-bold text-gray-700 dark:text-white">Totals</p>
            {[
              { l: 'Subtotal', v: subtotal },
              { l: 'Discount', v: parseFloat(discount) || 0 },
              { l: 'GST', v: 0 },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">{l}</span>
                <span className="font-medium text-gray-800 dark:text-white">₹{Number(v).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">Total</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-base">₹{Number(total).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Particular Details */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700 dark:text-white">Particular Details</p>
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Plus size={13} /> Add Row
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_140px_36px] gap-2 px-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase">Particular</span>
              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase">Amount (₹)</span>
              <span />
            </div>
            {particulars.map(row => (
              <div key={row.id} className="grid grid-cols-[1fr_140px_36px] gap-2 items-center">
                {feeHeads.length > 0 ? (
                  <select value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)} className={inp}>
                    <option value="">— Select head —</option>
                    {feeHeads.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                ) : (
                  <input
                    value={row.name}
                    onChange={e => updateRow(row.id, 'name', e.target.value)}
                    className={inp}
                    placeholder="Particular name"
                  />
                )}
                <input
                  type="number" step="0.01" min="0"
                  value={row.amount}
                  onChange={e => updateRow(row.id, 'amount', e.target.value)}
                  className={inp} placeholder="0.00"
                />
                <button
                  onClick={() => removeRow(row.id)}
                  disabled={particulars.length === 1}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate || isBusy || !!createdOrder}
            className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving && !collectPending ? 'Creating…' : 'Create Order'}
          </button>
          <button
            onClick={handleCreateAndCollect}
            disabled={!canCreate || isBusy}
            className="px-6 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {collectPending ? 'Creating…' : createdOrder ? 'Collect Payment' : 'Create & Collect'}
          </button>
        </div>
      </div>
    </>
  );
}
