import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Users, CheckCircle, Award,
  FileText, BarChart2, ScrollText, TrendingUp, CreditCard,
  Wallet, Banknote, ArrowLeftRight, ChevronDown,
  GraduationCap, X, Search, Receipt, PiggyBank, Settings,
  ShoppingCart, UserCheck, Building2,
  BookOpen, Home, UserSquare2, Package, CalendarDays, Clock, Cpu,
  Crown, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Super admin section (injected at top for superadmin role) ───────────────
const SUPER_ADMIN_SECTION = {
  section: 'Super Admin',
  items: [
    { label: 'All Institutions', icon: Crown, to: '/admin/super-admin' },
  ],
};

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
          { label: 'Certificates', icon: Award,      to: '/admin/certificates'         },
          { label: 'Forms',     icon: FileText,      to: '/admin/forms'                },
          { label: 'Reports',   icon: BarChart2,     to: '/admin/admissions/reports'   },
          { label: 'Logs',      icon: ScrollText,    to: '/admin/admissions/logs'      },
        ],
      },

      { label: 'Reports',          icon: BarChart2,  to: '/admin/reports'  },
      { label: 'Logs',             icon: ScrollText, to: '/admin/logs'     },
      { label: 'Promote Students', icon: TrendingUp, to: '/admin/promote'  },
    ],
  },
  {
    section: 'Fee Management',
    items: [
      {
        label: 'Fee Management',
        icon: CreditCard,
        prefix: '/admin/fee',
        children: [
          { label: 'Fee Tracker',    icon: Wallet,         to: '/admin/fee/tracker'       },
          { label: 'Collect Fee',    icon: Banknote,       to: '/admin/fee/collect'       },
          { label: 'Pay Records',    icon: Receipt,        to: '/admin/fee/pay-records'   },
          { label: 'Transactions',   icon: ArrowLeftRight, to: '/admin/fee/transactions'  },
          { label: 'Reports',        icon: BarChart2,      to: '/admin/fee/reports'       },
          { label: 'Configuration',  icon: Settings,       to: '/admin/fee/configuration' },
          { label: 'Logs',           icon: ScrollText,     to: '/admin/fee/logs'          },
        ],
      },
    ],
  },
  {
    section: 'General',
    items: [
      {
        label: 'General',
        icon: UserCheck,
        prefix: '/admin/general',
        children: [
          { label: 'Students',    icon: Users,      to: '/admin/general/students'    },
          { label: 'Scholarship', icon: Award,      to: '/admin/general/scholarship' },
          { label: 'Bank Loan',   icon: Building2,  to: '/admin/general/bank-loan'   },
          { label: 'Reports',     icon: BarChart2,  to: '/admin/general/reports'     },
          { label: 'Logs',        icon: ScrollText, to: '/admin/general/logs'        },
        ],
      },
    ],
  },
  {
    section: 'Billing',
    items: [
      {
        label: 'Billing',
        icon: PiggyBank,
        prefix: '/admin/billing',
        children: [
          { label: 'Customers',    icon: Users,         to: '/admin/billing/customers'    },
          { label: 'Orders',       icon: ShoppingCart,  to: '/admin/billing/orders'       },
          { label: 'Transactions', icon: ArrowLeftRight,to: '/admin/billing/transactions' },
          { label: 'Pay Records',  icon: Receipt,       to: '/admin/billing/pay-records'  },
          { label: 'Reports',      icon: BarChart2,     to: '/admin/billing/reports'      },
          { label: 'Logs',         icon: ScrollText,    to: '/admin/billing/logs'         },
        ],
      },
    ],
  },
  {
    section: 'Library',
    items: [
      {
        label: 'Library',
        icon: BookOpen,
        prefix: '/admin/library',
        children: [
          { label: 'Members',      icon: Users,          to: '/admin/library/members'      },
          { label: 'Transactions', icon: ArrowLeftRight,  to: '/admin/library/transactions' },
          { label: 'Fine Report',  icon: TrendingUp,      to: '/admin/library/fine-report'  },
          { label: 'Reports',      icon: BarChart2,       to: '/admin/library/reports'      },
          { label: 'Logs',         icon: ScrollText,      to: '/admin/library/logs'         },
        ],
      },
    ],
  },
  {
    section: 'Hostel',
    items: [
      {
        label: 'Hostel',
        icon: Home,
        prefix: '/admin/hostel',
        children: [
          { label: 'Members',      icon: Users,          to: '/admin/hostel/students'      },
          { label: 'Assets',       icon: Package,        to: '/admin/hostel/assets'        },
          { label: 'Events',       icon: CalendarDays,   to: '/admin/hostel/events'        },
          { label: 'Timesheet',    icon: Clock,          to: '/admin/hostel/timesheet'     },
          { label: 'Devices',      icon: Cpu,            to: '/admin/hostel/devices'       },
          { label: 'Transactions', icon: ArrowLeftRight,  to: '/admin/hostel/transactions'  },
          { label: 'Reports',      icon: BarChart2,       to: '/admin/hostel/reports'       },
          { label: 'Logs',         icon: ScrollText,      to: '/admin/hostel/logs'          },
        ],
      },
    ],
  },
  {
    section: 'Alumni',
    items: [
      {
        label: 'Alumni',
        icon: UserSquare2,
        prefix: '/admin/alumni',
        children: [
          { label: 'Directory',    icon: GraduationCap, to: '/admin/alumni/list'     },
          { label: 'Reports',      icon: BarChart2,     to: '/admin/alumni/reports'  },
          { label: 'Logs',         icon: ScrollText,    to: '/admin/alumni/logs'     },
        ],
      },
    ],
  },
  {
    section: 'Configuration',
    items: [
      {
        label: 'Configuration',
        icon: Settings,
        prefix: '/admin/config',
        children: [
          { label: 'General Setting',    icon: Building2,     to: '/admin/config/general'      },
          { label: 'Academic Setting',   icon: GraduationCap, to: '/admin/config/academic'     },
          { label: 'Student Onboarding', icon: UserCheck,     to: '/admin/config/onboarding'   },
          { label: 'Admission Setting',  icon: ClipboardList, to: '/admin/config/admission'    },
          { label: 'Fee Template',       icon: CreditCard,    to: '/admin/config/fee-template' },
          { label: 'User Management',    icon: Users,         to: '/admin/config/users'        },
          { label: 'Data Management',    icon: ScrollText,    to: '/admin/config/data'         },
          { label: 'Integration',        icon: ArrowLeftRight,to: '/admin/config/integration'  },
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || 'staff';

  const visibleNav = role === 'superadmin' ? [SUPER_ADMIN_SECTION, ...NAV] : NAV;

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-[#1a2332] flex flex-col transition-transform duration-300
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
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 sidebar-scroll">
          {visibleNav.map((section) => (
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${role === 'superadmin' ? 'bg-purple-600' : 'bg-blue-600'}`}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-slate-500 text-[10px] truncate capitalize">{role}</p>
            </div>
            <button onClick={() => { logout(); navigate('/login', { replace: true }); }} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
