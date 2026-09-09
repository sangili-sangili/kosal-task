import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronDown,
  Shield,
  LogOut,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  UserCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { leadService } from '../../services/leadService';

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
  '/audit': { title: 'Activity & Audit Logs', breadcrumb: 'Home / Audit Trail' },
};

const STAGE_COLORS = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-indigo-100 text-indigo-700',
  SITE_VISIT: 'bg-amber-100 text-amber-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  INTERESTED: 'bg-purple-100 text-purple-700',
  BOOKED: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-rose-100 text-rose-700',
};

export function Header({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Dynamic follow-up and new lead data from backend
  const [followUps, setFollowUps] = useState([]);
  const [newLeads, setNewLeads] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifFetched, setNotifFetched] = useState(false);

  // Refs for click/touch outside detection
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // ── Auto-close dropdowns on route changes ─────────────────────────────────
  useEffect(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // ── Click / Touch / Keydown outside closes both dropdowns ─────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ── Fetch pending follow-ups from backend API ─────────────────────────────
  const fetchFollowUps = useCallback(async () => {
    setNotifLoading(true);
    try {
      const result = await leadService.getLeads({ limit: 100 });
      const allLeads = result?.leads || [];

      // Support both snake_case (backend) and camelCase properties
      const pending = allLeads.filter((l) => {
        const date = l.follow_up_date || l.followupDate;
        return date && l.stage !== 'BOOKED' && l.stage !== 'LOST';
      });

      // Sort by urgency: earliest/overdue dates first
      pending.sort((a, b) => {
        const dateA = new Date(a.follow_up_date || a.followupDate).getTime();
        const dateB = new Date(b.follow_up_date || b.followupDate).getTime();
        return dateA - dateB;
      });

      // Fresh leads waiting for initial contact
      const fresh = allLeads.filter((l) => l.stage === 'NEW');

      setFollowUps(pending);
      setNewLeads(fresh);
    } catch (err) {
      console.warn('Notification fetch failed:', err);
      setFollowUps([]);
      setNewLeads([]);
    } finally {
      setNotifLoading(false);
      setNotifFetched(true);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Re-fetch dynamically whenever notification dropdown is opened
  useEffect(() => {
    if (notificationsOpen) {
      fetchFollowUps();
    }
  }, [notificationsOpen, fetchFollowUps]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setProfileOpen(false);
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

  const badgeCount = followUps.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-[72px] w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs gap-3">

      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col justify-center py-1 min-w-0">
          <div className="text-[10px] font-semibold text-slate-400 hidden sm:block tracking-wide uppercase truncate">
            {currentMeta.breadcrumb}
          </div>
          <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none sm:mt-0.5 truncate">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-2 shrink-0">

        {/* ── Notifications Bell ────────────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((p) => !p);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {badgeCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white leading-none">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              {/* Mobile Backdrop: Tapping anywhere outside instantly closes */}
              <div
                className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-xs sm:hidden"
                onClick={() => setNotificationsOpen(false)}
                aria-hidden="true"
              />

              {/* Notification Card: Fixed centered on mobile (never overflows), absolute anchored on desktop */}
              <div
                className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-16 sm:top-full mt-1 sm:mt-2 z-50 animate-in fade-in zoom-in-95
                           w-auto sm:w-96 sm:max-w-[420px]
                           rounded-2xl bg-white border border-slate-200/90 overflow-hidden
                           shadow-2xl sm:shadow-[0_8px_32px_rgba(0,0,0,0.14)] flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[32rem]"
              >
                {/* Notif Header */}
                <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                      <Bell className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate">Follow-up Alerts</span>
                    {badgeCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        {badgeCount} Pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fetchFollowUps(); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${notifLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link
                      to="/leads"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-brand-600 hover:underline whitespace-nowrap px-1"
                    >
                      All Leads
                    </Link>
                    {/* Universal close button */}
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title="Close"
                      aria-label="Close notifications"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notif Body */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {notifLoading && !notifFetched ? (
                    <div className="py-8 flex flex-col items-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
                      Loading follow-ups…
                    </div>
                  ) : followUps.length === 0 && newLeads.length === 0 ? (
                    <div className="py-10 px-4 flex flex-col items-center gap-2 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="text-xs font-bold text-slate-800">All caught up!</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        No pending follow-ups right now. Keep up the good work!
                      </p>
                      <Link
                        to="/leads/new"
                        onClick={() => setNotificationsOpen(false)}
                        className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
                      >
                        + Create New Lead
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Follow-up Alerts */}
                      {followUps.slice(0, 8).map((lead) => {
                        const rawDate = lead.follow_up_date || lead.followupDate;
                        const leadDate = rawDate ? new Date(rawDate) : null;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isOverdue = leadDate && leadDate < today;
                        const isToday = leadDate && leadDate.toDateString() === new Date().toDateString();

                        return (
                          <button
                            key={`followup-${lead.id}`}
                            type="button"
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate(`/leads/${lead.id}`);
                            }}
                            className="w-full p-3.5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold shrink-0 border border-brand-200">
                                  {(lead.name || 'L').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-slate-900 truncate block">{lead.name}</span>
                                  <span className="text-[10px] text-slate-400 truncate block">{lead.phone || lead.email || 'Lead'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {isOverdue && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    Overdue
                                  </span>
                                )}
                                {isToday && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Today
                                  </span>
                                )}
                                {!isOverdue && !isToday && leadDate && (
                                  <span className="text-[9px] font-mono text-slate-400">
                                    {leadDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 mt-1 truncate pl-9">
                              {lead.followupNote || lead.notes?.[0]?.content || `Follow up on prospect`}
                            </p>

                            <div className="mt-1.5 pl-9 flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${STAGE_COLORS[lead.stage] || 'bg-slate-100 text-slate-600'}`}>
                                {lead.stage}
                              </span>
                              {(lead.assignedSalesEmployee?.name || lead.assignedTo?.name || lead.assignedToName) && (
                                <span className="text-[10px] text-slate-400 truncate">
                                  → {lead.assignedSalesEmployee?.name || lead.assignedTo?.name || lead.assignedToName}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {/* If no follow-ups but fresh leads exist, show them */}
                      {followUps.length === 0 && newLeads.length > 0 && (
                        <>
                          <div className="px-3.5 py-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            New Prospects Requiring Outreach ({newLeads.length})
                          </div>
                          {newLeads.slice(0, 5).map((lead) => (
                            <button
                              key={`new-${lead.id}`}
                              type="button"
                              onClick={() => {
                                setNotificationsOpen(false);
                                navigate(`/leads/${lead.id}`);
                              }}
                              className="w-full p-3 hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {(lead.name || 'L').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 truncate">{lead.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{lead.phone || lead.email}</p>
                                  </div>
                                </div>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  New Lead
                                </span>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Notif Footer */}
                {followUps.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 shrink-0">
                    <Link
                      to="/leads"
                      onClick={() => setNotificationsOpen(false)}
                      className="block text-center text-[11px] font-semibold text-brand-600 hover:underline"
                    >
                      View all {followUps.length} pending follow-ups →
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── User Profile Dropdown ──────────────────────────────────────────── */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((p) => !p);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-subtle shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight max-w-[120px] truncate">
                {user?.name || 'Authenticated User'}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Sales Rep'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <>
              {/* Mobile Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-xs sm:hidden"
                onClick={() => setProfileOpen(false)}
                aria-hidden="true"
              />

              <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-1 sm:mt-2 w-[calc(100vw-1rem)] max-w-[260px] sm:w-60 rounded-xl bg-white p-2 shadow-2xl sm:shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-slate-200 z-50 animate-in fade-in zoom-in-95">
                {/* User Info Block */}
                <div className="px-3 py-3 border-b border-slate-100 mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow shrink-0">
                      {getInitials(user?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'User'}</div>
                      <div className="text-[10px] text-slate-500 truncate">{user?.email || ''}</div>
                      <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        <Shield className="w-2.5 h-2.5" />
                        {user?.role === 'ADMIN' ? 'System Admin' : 'Sales Representative'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu item: Audit */}
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); navigate('/audit'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                >
                  <UserCircle2 className="w-3.5 h-3.5 text-slate-500" />
                  Activity & Audit
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  id="header-dropdown-logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  Sign Out / Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* Direct Logout Button */}
        <button
          type="button"
          id="header-logout-btn"
          onClick={handleLogout}
          title="Sign Out"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/60 transition-all ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-semibold">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
