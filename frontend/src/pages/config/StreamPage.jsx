import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { getMasterData, addMasterData, deleteMasterData } from '../../services/configApi';

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3500);
  }, []);
  return { toasts, toast: add };
}

function Toasts({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      ))}
    </div>
  );
}

export default function StreamPage() {
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [query, setQuery] = useState('');
  const [newStream, setNewStream] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, toast } = useToast();

  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMasterData('stream');
      setStreams(response.data?.data || []);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to load streams', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!newStream.trim()) return;
    setSaving(true);

    try {
      const response = await addMasterData({ type: 'stream', label: newStream.trim() });
      setStreams((prev) => [...prev, response.data?.data]);
      setNewStream('');
      toast('Stream added successfully');
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to add stream', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMasterData(id);
      setStreams((prev) => prev.filter((stream) => stream._id !== id));
      toast('Stream removed successfully');
    } catch {
      toast('Failed to remove stream', 'error');
    }
  };

  const filteredStreams = useMemo(
    () => streams.filter((stream) => stream.label.toLowerCase().includes(query.toLowerCase())),
    [streams, query]
  );

  return (
    <div className="space-y-6">
      <Toasts toasts={toasts} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/config/academic')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Academic Streams</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Create and manage academic streams used across admissions, fees and schedules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2">Total streams</p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{streams.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2">Visible results</p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{filteredStreams.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Add new stream</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Add a stream name used in academic configuration.</p>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Stream name</label>
            <input
              value={newStream}
              onChange={(e) => setNewStream(e.target.value)}
              placeholder="Enter stream name"
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={saving || !newStream.trim()}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Plus size={16} /> Add Stream
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stream list</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Search, view and delete streams.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search streams"
                className="w-full sm:w-72 pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="grid grid-cols-[1fr_auto] gap-4 p-4 text-sm font-semibold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-900">
              <span>Stream name</span>
              <span className="text-right">Actions</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400 dark:text-slate-500">Loading streams...</div>
            ) : filteredStreams.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-slate-500">No streams found.</div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredStreams.map((stream) => (
                  <li key={stream._id} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{stream.label}</span>
                    {stream.isUserAddable ? (
                      <button
                        onClick={() => handleDelete(stream._id)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    ) : (
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                        system
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
