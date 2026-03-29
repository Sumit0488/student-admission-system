import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, Calendar, CheckSquare, Award } from 'lucide-react';

const TABS = [
  { label: 'Enquiry',             path: '/admin/admissions/enquiry',   icon: ClipboardList },
  { label: 'Admission Schedules', path: '/admin/admissions/schedules', icon: Calendar      },
  { label: 'Approvals',           path: '/admin/admissions/approvals', icon: CheckSquare   },
  { label: 'Certificates',        path: '/admin/certificates',         icon: Award         },
];

// Sub-layout: just the admissions tab strip + outlet.
// The full page shell (sidebar, navbar, dark mode) is provided by the parent Layout.
export default function AdmissionsLayout() {
  return (
    <div className="flex flex-col min-h-0">
      {/* Tab strip */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
            {TABS.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                   ${isActive
                     ? 'bg-blue-600 text-white shadow-sm'
                     : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                   }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
}
