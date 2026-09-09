  import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Layers,
  BookmarkCheck,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  ShieldCheck,
  History,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { leadService } from '../../services/leadService';
import { bookingService } from '../../services/bookingService';
import { propertyService } from '../../services/propertyService';

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const { leads, bookings, units, currentUser, employees = [], roles = [] } = useCrm();
  const { user } = useAuth();
  const activeUser = user || currentUser;
  const isAdmin = activeUser?.role === 'ADMIN';

  // Live counts and roles data from backend API
  const [liveCounts, setLiveCounts] = useState({
    leads: null,
    bookings: null,
    units: null,
    users: null,
    roles: null,
  });
  const [rolesList, setRolesList] = useState([]);

  const fetchCounts = async () => {
    try {
      const results = await Promise.allSettled([
        leadService.getLeads({ limit: 1 }),
        bookingService.getBookings({ limit: 1 }),
        // Fetch units to count AVAILABLE ones
        import('../../services/api').then((m) => m.default.get('/units', { params: { limit: 500 } })),
        userService.getUsers({ limit: 1 }),
        userService.getRoles(),
      ]);

      const [leadsRes, bookingsRes, unitsRes, usersRes, rolesRes] = results;

      // Leads: total active pipeline count
      const leadsTotal =
        leadsRes.status === 'fulfilled'
          ? (leadsRes.value?.pagination?.total ?? leadsRes.value?.leads?.length ?? null)
          : null;

      // Bookings: total count
      const bookingsTotal =
        bookingsRes.status === 'fulfilled'
          ? (bookingsRes.value?.pagination?.total ?? bookingsRes.value?.bookings?.length ?? null)
          : null;

      // Units: count of AVAILABLE status
      let availableUnits = null;
      if (unitsRes.status === 'fulfilled') {
        const unitsData = unitsRes.value;
        const allUnits = unitsData?.units || unitsData?.data || (Array.isArray(unitsData) ? unitsData : []);
        availableUnits = allUnits.filter((u) => u.status === 'AVAILABLE').length;
      }

      // Users:
      let usersTotal = null;
      if (usersRes.status === 'fulfilled') {
        const uVal = usersRes.value;
        usersTotal =
          uVal?.pagination?.total ??
          uVal?.users?.length ??
          (Array.isArray(uVal) ? uVal.length : null);
      }

      // Roles & live permissions from database
      let rolesTotal = null;
      if (rolesRes.status === 'fulfilled') {
        const rVal = rolesRes.value;
        const list = Array.isArray(rVal) ? rVal : (rVal?.data || []);
        setRolesList(list);
        rolesTotal = list.length;
      }

      setLiveCounts({
        leads: leadsTotal,
        bookings: bookingsTotal,
        units: availableUnits,
        users: usersTotal,
        roles: rolesTotal,
      });
    } catch (err) {
      console.warn('Failed to fetch live sidebar counts:', err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [location.pathname]);

  // Re-fetch when role permissions are modified in Roles Master
  useEffect(() => {
    const handlePermChange = () => fetchCounts();
    window.addEventListener('rolePermissionsChanged', handlePermChange);
    return () => window.removeEventListener('rolePermissionsChanged', handlePermChange);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Check permissions against database role definitions
  const currentRoleCode = activeUser?.role || 'SALES';
  const currentRoleObj = rolesList.find((r) => r.code === currentRoleCode);
  const currentPermissions = currentRoleObj?.permissions || (isAdmin ? ['*'] : []);

  const hasPermission = (permissionKey) => {
    if (isAdmin) return true;
    if (!permissionKey) return true;
    if (currentPermissions.includes('*')) return true;
    return currentPermissions.includes(permissionKey);
  };

  // Use live API count when available, fall back to CrmContext count
  const activeLeadsCount =
    liveCounts.leads !== null
      ? liveCounts.leads
      : (leads || []).filter((l) => l.stage !== 'BOOKED' && l.stage !== 'LOST').length;

  const availableUnitsCount =
    liveCounts.units !== null
      ? liveCounts.units
      : (units || []).filter((u) => u.status === 'AVAILABLE').length;

  const bookingsCount =
    liveCounts.bookings !== null ? liveCounts.bookings : (bookings || []).length;

  const usersCount =
    liveCounts.users !== null ? liveCounts.users : (employees || []).length;

  const rolesCount =
    liveCounts.roles !== null ? liveCounts.roles : (roles || []).length;

  const pipelineNavItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard:view',
    },
    {
      to: '/leads',
      label: 'Leads',
      icon: Users,
      badge: activeLeadsCount,
      permission: 'customer:read',
    },
    {
      to: '/properties',
      label: 'Properties',
      icon: Building2,
      permission: 'property:read',
    },
    {
      to: '/units',
      label: 'Units Inventory',
      icon: Layers,
      badge: `${availableUnitsCount} Avail`,
      badgeVariant: 'success',
      permission: 'property:read',
    },
    {
      to: '/bookings',
      label: 'Bookings',
      icon: BookmarkCheck,
      badge: bookingsCount,
      permission: 'transaction:read',
    },
  ];

  const adminNavItems = [
    {
      to: '/users',
      label: 'User Management',
      icon: UserCheck,
      badge: usersCount,
      permission: 'user:read',
    },
    {
      to: '/roles',
      label: 'Roles Master',
      icon: ShieldCheck,
      badge: rolesCount,
      permission: 'role:read',
    },
    {
      to: '/audit',
      label: 'Activity & Audit Logs',
      icon: History,
      badge: 'Live',
      badgeVariant: 'success',
      permission: 'audit:read',
    },
  ];

  const visiblePipelineNav = pipelineNavItems.filter((item) => hasPermission(item.permission));
  const visibleAdminNav = adminNavItems.filter((item) => hasPermission(item.permission));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Top Header */}
        <div>
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-bold text-white text-sm tracking-tight truncate">
                    REAL ESTATE CRM
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                    Enterprise Sales
                  </span>
                </div>
              )}
            </div>

            {/* Close on mobile */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 space-y-4">
            {/* 1. Sales Pipeline Section */}
            <div>
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Sales Pipeline
                </p>
              )}

              <nav className="space-y-1">
                {visiblePipelineNav.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.to ||
                    (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors group ${
                        isActive
                          ? 'bg-brand-600 text-white font-semibold shadow-subtle'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : item.badgeVariant === 'success'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* 2. Access & Security Master Section (Shown dynamically when user has granted permissions) */}
            {visibleAdminNav.length > 0 && (
              <div>
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Access & Security Master
                  </p>
                )}

                <nav className="space-y-1">
                  {visibleAdminNav.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.to || location.pathname.startsWith(item.to);

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors group ${
                          isActive
                            ? 'bg-brand-600 text-white font-semibold shadow-subtle'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                        {!isCollapsed && (
                          <>
                            <span className="truncate flex-1">{item.label}</span>
                            {item.badge !== undefined && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Active Persona & Desktop Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 space-y-2">
          {/* User Persona Card */}
          <div className={`p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 ${isCollapsed ? 'text-center' : ''}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(activeUser?.name)}
              </div>
              {!isCollapsed && (
                <div className="flex-1 truncate text-left">
                  <div className="text-xs font-semibold text-white truncate">{activeUser?.name || 'User'}</div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span>{activeUser?.role === 'ADMIN' ? 'System Admin' : 'Sales Representative'}</span>
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="truncate text-slate-400">{activeUser?.email}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[9px] font-semibold uppercase tracking-wider">
                  LIVE
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors text-xs gap-2"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium">Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
