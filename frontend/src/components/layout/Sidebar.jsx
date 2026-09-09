import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  X,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

export function Sidebar({ isOpen, onClose }) {
  const { hasRole, user } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: '/users',
      label: 'User Management',
      icon: Users,
      show: hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]),
    },
    {
      to: '/customers',
      label: 'Customers & Transactions',
      icon: Briefcase,
      show: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">Enterprise Pro</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Navigation
            </p>
            <nav className="space-y-1">
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-brand-600 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
            </nav>

            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-8 mb-3">
              Developer Resources
            </p>
            <a
              href="http://localhost:5000/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition-colors"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Swagger API Docs</span>
              <span className="ml-auto text-[10px] bg-slate-800 text-brand-400 px-1.5 py-0.5 rounded border border-slate-700">
                v1.0
              </span>
            </a>
          </div>
        </div>

        {/* User Info Bottom Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[11px] text-slate-400 truncate">{user?.roles?.[0] || 'User'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
