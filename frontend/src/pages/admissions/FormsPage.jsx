import { useState, useEffect, useCallback } from 'react';
import { Plus, X, ChevronRight, MoreVertical, FileText, Trash2, Edit2 } from 'lucide-react';
import { getForms, createForm, updateForm, deleteForm } from '../../services/formApi';

const STATUS_STYLE = {
  live: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' - ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function AddModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState({ name: '', description: '', content: '', status: 'live', ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{initial ? 'Edit Form' : 'Add Form'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Form Name *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="live">Live</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TemplateDrawer({ form, onClose, onSave }) {
  const [content, setContent] = useState(form.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form._id, { content }); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-xl h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
              <ChevronRight size={18} />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-white">{form.name}</h3>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="flex border-b border-gray-100 dark:border-slate-700">
          <button className="px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600">
            Notes
          </button>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
            Use variables like <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{{student_name}}'}</code>, <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{{father_name}}'}</code>, <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{{program}}'}</code>, <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{{admission_year}}'}</code>
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={24}
            placeholder="Enter form template content here. Use {{variable_name}} for dynamic fields."
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono"
          />
        </div>
      </div>
    </div>
  );
}

function RowMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((p) => !p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg py-1 w-36">
            <button onClick={() => { setOpen(false); onEdit(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              <Edit2 size={13} /> Edit
            </button>
            <button onClick={() => { setOpen(false); onDelete(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [viewForm, setViewForm] = useState(null);
  const [tab, setTab] = useState('Forms');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getForms();
      setForms(data.data || []);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (payload) => {
    const { data } = await createForm(payload);
    setForms((p) => [data.data, ...p]);
  };

  const handleUpdate = async (id, payload) => {
    const { data } = await updateForm(id, payload);
    setForms((p) => p.map((f) => (f._id === id ? data.data : f)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this form?')) return;
    await deleteForm(id);
    setForms((p) => p.filter((f) => f._id !== id));
  };

  return (
    <>
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={handleCreate} />}
      {editForm && (
        <AddModal
          initial={editForm}
          onClose={() => setEditForm(null)}
          onSave={(payload) => handleUpdate(editForm._id, payload)}
        />
      )}
      {viewForm && (
        <TemplateDrawer
          form={viewForm}
          onClose={() => setViewForm(null)}
          onSave={async (id, payload) => {
            await handleUpdate(id, payload);
            setViewForm(null);
          }}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Forms</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Welcome to your Forms board! Here you can store and manage all of your Forms
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
            <Plus size={15} /> Add
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-slate-700">
          {['Forms', 'Timeline'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}>
              <FileText size={14} /> {t}
            </button>
          ))}
        </div>

        {tab === 'Forms' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Search bar */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <input placeholder="Search By Form Name"
                className="w-72 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="w-10 px-4 py-3.5"><input type="checkbox" className="rounded" /></th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Name</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Description</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Date & Time</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Created By</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="w-10 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : forms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <FileText size={36} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No Templates Found</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Click "+ Add" to create your first form template</p>
                    </td>
                  </tr>
                ) : (
                  forms.map((f) => (
                    <tr key={f._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewForm(f)}
                            title="Quick view"
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <FileText size={16} />
                          </button>
                          <span className="font-medium text-gray-900 dark:text-white">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-sm">{f.description || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap">{fmtDate(f.created_at)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-sm">{f.created_by || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${STATUS_STYLE[f.status] || STATUS_STYLE.draft}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RowMenu
                          onEdit={() => setEditForm(f)}
                          onDelete={() => handleDelete(f._id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'Timeline' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 text-center">
            <FileText size={36} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No timeline activity yet</p>
          </div>
        )}
      </div>
    </>
  );
}
