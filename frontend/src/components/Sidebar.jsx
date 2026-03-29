import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Users, CheckCircle, Award,
  FileText, BarChart2, ScrollText, TrendingUp, CreditCard,
  Wallet, Banknote, ArrowLeftRight, ChevronDown,
  GraduationCap, X, Search,
} from 'lucide-react';

// ─── Nav structure ────────────────────────────────────────────────────────────
const NAV = [
  {
    section: 'Main Menu',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },

      // ── Admissions parent (collapsible) ──
      {
        label: 'Admissions',
        icon: ClipboardList,
        prefix: '/admin/admissions',
        children: [
          { label: 'Enquiry',   icon: Search,       to: '/admin/admissions/enquiry'   },
          { label: 'Students',  icon: Users,         to: '/admin/admissions/students'  },
          { label: 'Approvals', icon: CheckCircle,   to: '/admin/admissions/approvals' },
        ],
      },

      { label: 'Certificates', icon: Award,    to: '/admin/certificates' },
      { label: 'Forms',        icon: FileText, to: '/admin/forms'        },
    ],
  },
  {
    section: 'Reports & Tools',
    items: [
      { label: 'Reports',          icon: BarChart2,  to: '/admin/reports'  },
      { label: 'Logs',             icon: ScrollText, to: '/admin/logs'     },
      { label: 'Promote Students', icon: TrendingUp, to: '/admin/promote'  },
    ],
  },
  {
    section: 'Finance',
    items: [
      {
        label: 'Fee Management',
        icon: CreditCard,
        prefix: '/admin/fee',
        children: [
          { label: 'Fee Tracker',  icon: Wallet,         to: '/admin/fee/tracker'      },
          { label: 'Collect Fee',  icon: Banknote,       to: '/admin/fee/collect'      },
          { label: 'Transactions', icon: ArrowLeftRight, to: '/admin/fee/transactions' },
        ],
      },
    ],
  },
];

// ─── Collapsible parent item ───────────────────────────────────────────────────
function ParentItem({ item, onClose }) {
  const location = useLocation();
  const isChildActive = location.pathname.startsWith(item.prefix);

  // Auto-open if current route is inside this parent (survives refresh)
  const [open, setOpen] = useState(isChildActive);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors
          ${isChildActive
            ? 'bg-blue-600/15 text-blue-400'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
      >
        <span className="flex items-center gap-3">
          <item.icon size={16} />
          {item.label}
        </span>
        <ChevronDown
          size={14}
          className={`opacity-60 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      {/* Animated children */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? `${item.children.length * 44}px` : '0px' }}
      >
        <ul className="mt-0.5 ml-4 pl-3 border-l border-slate-700/60 space-y-0.5 pb-1">
          {item.children.map((child) => {
            const active = location.pathname === child.to ||
              location.pathname.startsWith(child.to + '/');
            return (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors
                    ${active
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <child.icon size={13} />
                  {child.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-[#0f172a] flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">EduAdmin</p>
              <p className="text-slate-500 text-xs">Admission Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
          {NAV.map((section) => (
            <div key={section.section}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {section.section}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) =>
                  item.children ? (
                    <ParentItem key={item.label} item={item} onClose={onClose} />
                  ) : (
                    <li key={item.label}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                          ${isActive(item.to)
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </NavLink>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom user info */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">Admin User</p>
              <p className="text-slate-500 text-[10px] truncate">admin@college.edu</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
