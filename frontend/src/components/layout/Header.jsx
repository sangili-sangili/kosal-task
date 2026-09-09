  import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  Shield,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  LogOut,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../hooks/useAuth';

const routeTitles = {
  '/dashboard': { title: 'Sales Dashboard', breadcrumb: 'Home / Dashboard' },
  '/leads': { title: 'Leads Directory', breadcrumb: 'Home / Leads' },
  '/leads/new': { title: 'New Opportunity', breadcrumb: 'Home / Leads / Create' },
  '/leads/create': { title: 'New Opportunity', breadcrumb: 'Home / Leads / Create' },
  '/properties': { title: 'Property Projects', breadcrumb: 'Home / Properties' },
  '/units': { title: 'Unit Inventory', breadcrumb: 'Home / Properties / Units' },
  '/bookings': { title: 'Bookings Management', breadcrumb: 'Home / Bookings' },
  '/bookings/new': { title: 'New Unit Booking', breadcrumb: 'Home / Bookings / Create' },
  '/users': { title: 'User Management', breadcrumb: 'Home / User Management' },
  '/roles': { title: 'Roles & Permissions Master', breadcrumb: 'Home / Roles Master' },
};

export function Header({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, leads } = useCrm();
  const { user, logout } = useAuth();

  const activeUser = user || currentUser;

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Compute active route title
  let currentMeta = routeTitles[location.pathname];
  if (!currentMeta) {
    if (location.pathname.startsWith('/leads/')) {
      currentMeta = { title: 'Lead Profile Details', breadcrumb: 'Home / Leads / Profile' };
    } else if (location.pathname.startsWith('/properties/')) {
      currentMeta = { title: 'Project Details', breadcrumb: 'Home / Properties / Project' };
    } else if (location.pathname.startsWith('/bookings/')) {
      currentMeta = { title: 'Booking Overview', breadcrumb: 'Home / Bookings / Detail' };
    } else {
      currentMeta = { title: 'CRM Portal', breadcrumb: 'Home' };
    }
  }

  // Today's & Overdue Follow-ups for notification badge
  const actionableFollowups = leads.filter(
    (l) => l.followupDate && l.stage !== 'BOOKED' && l.stage !== 'LOST'
  );

  return (
    <header className="sticky top-0 z-30 flex h-18 sm:h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 sm:px-8 shadow-xs">
      {/* Left: Mobile Toggle & Page Title/Breadcrumbs */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col justify-center py-1">
          <div className="text-[11px] font-semibold text-slate-400 hidden sm:block tracking-wide uppercase">
            {currentMeta.breadcrumb}
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none sm:mt-1">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {actionableFollowups.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setNotificationsOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-dropdown border border-slate-200 z-30 animate-in fade-in zoom-in-95 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Follow-up Alerts</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      {actionableFollowups.length} Pending
                    </span>
                  </div>
                  <Link
                    to="/leads"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] font-semibold text-brand-600 hover:underline"
                  >
                    View All Leads
                  </Link>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {actionableFollowups.slice(0, 5).map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate(`/leads/${lead.id}`);
                      }}
                      className="p-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{lead.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {lead.followupTime || '10:00 AM'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        {lead.followupNote || `Follow up on ${lead.preferredProject}`}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Lead Stage: <strong className="text-slate-700">{lead.stage}</strong></span>
                        <span>•</span>
                        <span>Assigned: {lead.assignedToName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-subtle">
              {getInitials(activeUser?.name)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {activeUser?.name || 'Authenticated User'}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight">
                {activeUser?.role === 'ADMIN' ? 'Administrator' : 'Sales Representative'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setProfileOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-2 shadow-dropdown border border-slate-200 z-30 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <div className="text-xs font-bold text-slate-900">{activeUser?.name || 'User'}</div>
                  <div className="text-[11px] text-slate-500 truncate">{activeUser?.email || ''}</div>
                  <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    <Shield className="w-3 h-3" />
                    {activeUser?.role === 'ADMIN' ? 'System Administrator' : 'Sales Representative'}
                  </span>
                </div>

                <button
                  type="button"
                  id="header-dropdown-logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  Sign Out / Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* Header Direct Logout Button */}
        <button
          type="button"
          id="header-logout-btn"
          onClick={handleLogout}
          title="Sign Out"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/60 transition-all ml-1"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
          <span className="hidden sm:inline font-semibold">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
