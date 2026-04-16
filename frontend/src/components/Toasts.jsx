import { CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Shared toast notification display.
 * @param {{ id, msg, type }[]} toasts
 * @param {function} [onRemove]  - optional manual-close handler (receives id)
 */
export default function Toasts({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto
            ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {t.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {t.msg}
          {onRemove && (
            <button
              onClick={() => onRemove(t.id)}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
