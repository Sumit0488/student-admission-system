import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const PAGE_TITLES = {
  '/admin/dashboard':                'Dashboard',
  '/admin/admissions/enquiry':       'Enquiry',
  '/admin/admissions/students':      'Students',
  '/admin/admissions/approvals':     'Approvals',
  '/admin/certificates':             'Certificates',
  '/admin/forms':                    'Forms',
  '/admin/reports':                  'Reports',
  '/admin/logs':                     'Activity Logs',
  '/admin/promote':                  'Promote Students',
  '/admin/fee/tracker':              'Fee Tracker',
  '/admin/fee/collect':              'Collect Fee',
  '/admin/fee/transactions':         'Transactions',
};

export default function Layout() {
  const [darkMode, setDarkMode]   = useState(() => localStorage.getItem('darkMode') === 'true');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Apply / remove 'dark' class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const title = PAGE_TITLES[location.pathname] ?? 'EduAdmin';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main column — offset by sidebar width on large screens */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
