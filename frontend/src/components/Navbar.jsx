import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, ChevronDown, HelpCircle, Settings, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ACADEMIC_YEARS = ['2023-24', '2024-25', '2025-26', '2026-27'];

export default function Navbar({ darkMode, setDarkMode, onMenuClick }) {
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState('2025-26');

  // ── Notification data ──────────────────────────────────────────────────────
  // Each item has a `route` — clicking it navigates there and closes the dropdown
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'admission',
      text: 'New admission request from Rahul Verma',
      time: '2m ago',
      unread: true,
      route: '/admin/approvals',
    },
    {
      id: 2,
      type: 'admission',
      text: 'Approval pending for 3 students',
      time: '15m ago',
      unread: true,
      route: '/admin/approvals',
    },
    {
      id: 3,
      type: 'payment',
      text: 'Fee payment received – Sneha Reddy',
      time: '1h ago',
      unread: false,
      route: '/admin/finance',
    },
    {
      id: 4,
      type: 'promotion',
      text: 'Semester promotion complete for Batch 2020',
      time: '3h ago',
      unread: false,
      route: '/admin/admissions/students',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNotifClick = (notif) => {
    console.log('[Navbar] Notification clicked:', notif.id, notif.type, '→', notif.route);

    // Mark this notification as read
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n)));

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
    <header className="sticky top-0 z-10 h-14 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 sm:px-5 gap-3">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        <Menu size={19} />
      </button>

      {/* Institution name + dropdown */}
      <button type="button" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={13} className="text-white" />
        </div>
        <span className="hidden sm:block font-semibold text-sm text-gray-900 dark:text-white truncate max-w-[140px]">
          {tenant?.name || 'EduAdmin'}
        </span>
        <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Academic Year selector */}
      <select
        value={academicYear}
        onChange={(e) => setAcademicYear(e.target.value)}
        className="hidden sm:block text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
      >
        {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>

      {/* Right actions */}
      <div className="flex items-center gap-0.5">
        {/* Dark mode */}
        <button
          type="button"
          onClick={() => setDarkMode((v) => !v)}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Help */}
        <button
          type="button"
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Help"
        >
          <HelpCircle size={17} />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => navigate('/admin/config/users')}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Settings"
        >
          <Settings size={17} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
            )}
          </button>

          {notifOpen && (
            <>
              {/* Backdrop — clicking outside closes dropdown */}
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />

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
                            <p
                              className={`leading-snug ${n.unread ? 'text-gray-800 dark:text-white font-medium' : 'text-gray-500 dark:text-slate-400'}`}
                            >
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
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <ChevronDown size={13} className="text-gray-400 dark:text-slate-500 hidden sm:block" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
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
                      setProfileOpen(false);
                      logout();
                      navigate('/login', { replace: true });
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
