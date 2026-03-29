import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, ChevronDown, Search } from 'lucide-react';

export default function Navbar({ darkMode, setDarkMode, onMenuClick, title = 'Dashboard' }) {
  const navigate = useNavigate();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ── Notification data ──────────────────────────────────────────────────────
  // Each item has a `route` — clicking it navigates there and closes the dropdown
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'admission', text: 'New admission request from Rahul Verma',     time: '2m ago',  unread: true,  route: '/admin/approvals' },
    { id: 2, type: 'admission', text: 'Approval pending for 3 students',            time: '15m ago', unread: true,  route: '/admin/approvals' },
    { id: 3, type: 'payment',   text: 'Fee payment received – Sneha Reddy',         time: '1h ago',  unread: false, route: '/admin/finance'   },
    { id: 4, type: 'promotion', text: 'Semester promotion complete for Batch 2020', time: '3h ago',  unread: false, route: '/admin/admissions/students'  },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNotifClick = (notif) => {
    console.log('[Navbar] Notification clicked:', notif.id, notif.type, '→', notif.route);

    // Mark this notification as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );

    setNotifOpen(false);
    navigate(notif.route);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    console.log('[Navbar] Marking all notifications as read');
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleViewAll = () => {
    console.log('[Navbar] View all notifications clicked');
    setNotifOpen(false);
    navigate('/admin/approvals');
  };

  return (
    <header className="sticky top-0 z-10 h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 sm:px-6 gap-4">
      {/* Hamburger (mobile) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-800 dark:text-white truncate">{title}</h1>
      </div>

      {/* Search – desktop */}
      <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 w-56">
        <Search size={15} className="text-gray-400 dark:text-slate-400 flex-shrink-0" />
        <input
          placeholder="Quick search..."
          className="bg-transparent text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 outline-none w-full"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">

        {/* Dark mode */}
        <button
          type="button"
          onClick={() => setDarkMode((v) => !v)}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            className="relative p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
            )}
          </button>

          {notifOpen && (
            <>
              {/* Backdrop — clicking outside closes dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />

              <div className="absolute right-0 mt-1 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>

                {/* Notification items */}
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 text-xs border-b border-gray-50 dark:border-slate-700
                          hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer
                          ${n.unread ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                      >
                        {/* Unread dot */}
                        <div className="flex items-start gap-2">
                          {n.unread && (
                            <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                          <div className={n.unread ? '' : 'ml-4'}>
                            <p className={`leading-snug ${n.unread ? 'text-gray-800 dark:text-white font-medium' : 'text-gray-500 dark:text-slate-400'}`}>
                              {n.text}
                            </p>
                            <p className="text-gray-400 dark:text-slate-500 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="px-4 py-2.5 text-center border-t border-gray-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handleViewAll}
                    className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              AD
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-slate-200">Admin</span>
            <ChevronDown size={14} className="text-gray-400 dark:text-slate-500" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {['Profile', 'Settings', 'Help'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      console.log('[Navbar] Profile menu clicked:', item);
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {item}
                  </button>
                ))}
                <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('[Navbar] Sign out clicked');
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
