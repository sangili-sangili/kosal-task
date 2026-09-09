import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield, ShieldCheck, KeyRound, Lock, Unlock, Plus, Trash2,
  Check, CheckCircle2, Users, Building2, Layers, BookmarkCheck,
  UserCheck, History, LayoutDashboard, AlertCircle, AlertTriangle,
  RotateCcw, Sparkles, Search, XCircle, Copy,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { auditService } from '../../services/auditService';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

// ── Permission modules — sourced from backend constants ──────────────────────
const PERMISSION_MODULES = [
  {
    id: 'mod_dashboard',
    category: 'Dashboard',
    route: '/dashboard',
    description: 'Access to overview metrics, KPI cards and analytics widgets',
    icon: LayoutDashboard,
    permissions: [
      { id: 'dashboard:view',    label: 'View Dashboard',    desc: 'Access overview metrics and KPI cards' },
      { id: 'dashboard:export',  label: 'Export Reports',    desc: 'Download dashboard data as Excel or PDF' },
    ],
  },
  {
    id: 'mod_leads',
    category: 'Leads Management',
    route: '/leads',
    description: 'Manage customer prospects, site visits, follow-ups and pipeline',
    icon: Users,
    permissions: [
      { id: 'customer:create', label: 'Create Leads',   desc: 'Register new prospect and walk-in leads' },
      { id: 'customer:read',   label: 'View Leads',     desc: 'Browse and search lead pipeline records' },
      { id: 'customer:update', label: 'Update Leads',   desc: 'Edit lead details, stage and assignment' },
      { id: 'customer:delete', label: 'Delete Leads',   desc: 'Permanently remove lead records' },
    ],
  },
  {
    id: 'mod_properties',
    category: 'Properties & Units',
    route: '/properties',
    description: 'Manage real estate projects, buildings and unit inventory',
    icon: Building2,
    permissions: [
      { id: 'property:create', label: 'Add Properties',  desc: 'Create new projects, buildings and units' },
      { id: 'property:read',   label: 'View Properties', desc: 'Browse project and unit inventory' },
      { id: 'property:update', label: 'Edit Properties', desc: 'Update prices, floor plans and availability' },
      { id: 'property:delete', label: 'Delete Properties',desc: 'Remove projects or units from catalog' },
    ],
  },
  {
    id: 'mod_bookings',
    category: 'Bookings & Transactions',
    route: '/bookings',
    description: 'Create and manage unit allotments, token receipts and cancellations',
    icon: BookmarkCheck,
    permissions: [
      { id: 'transaction:create', label: 'Create Bookings',  desc: 'Register new unit bookings with token' },
      { id: 'transaction:read',   label: 'View Bookings',    desc: 'View booking records and receipts' },
      { id: 'booking:update',     label: 'Update Status',    desc: 'Change booking lifecycle status' },
      { id: 'booking:cancel',     label: 'Cancel Bookings',  desc: 'Cancel bookings and release unit inventory' },
    ],
  },
  {
    id: 'mod_users',
    category: 'User Management',
    route: '/users',
    description: 'Administer CRM user accounts, credentials and account status',
    icon: UserCheck,
    permissions: [
      { id: 'user:create', label: 'Create Users',   desc: 'Add new CRM user accounts' },
      { id: 'user:read',   label: 'View Users',     desc: 'View user directory and profiles' },
      { id: 'user:update', label: 'Update Users',   desc: 'Edit user details, role and status' },
      { id: 'user:delete', label: 'Delete Users',   desc: 'Remove user accounts from the system' },
    ],
  },
  {
    id: 'mod_roles',
    category: 'Roles & Permissions',
    route: '/roles',
    description: 'Configure role profiles and granular access permissions',
    icon: ShieldCheck,
    permissions: [
      { id: 'role:read',   label: 'View Roles',   desc: 'View role definitions and permission matrix' },
      { id: 'role:manage', label: 'Manage Roles', desc: 'Create, edit and delete security roles' },
    ],
  },
  {
    id: 'mod_audit',
    category: 'Audit Logs',
    route: '/audit',
    description: 'View system activity logs and user action history',
    icon: History,
    permissions: [
      { id: 'audit:read', label: 'View Audit Logs', desc: 'Access system activity and change history' },
    ],
  },
];

// All available permission IDs
const ALL_PERM_IDS = PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => p.id));

// Default permissions per role
const DEFAULT_PERMISSIONS = {
  ADMIN: ALL_PERM_IDS,                                   // full access
  SALES: ['customer:read', 'customer:create', 'customer:update',
          'property:read', 'transaction:read', 'transaction:create',
          'dashboard:view', 'booking:update'],            // limited access
};

const EMPTY_NEW_ROLE = { name: '', code: '', description: '', templateCode: 'SALES' };

// ── Component ─────────────────────────────────────────────────────────────────
export function RoleManagementPage() {
  // ── Live data from API ───────────────────────────────────────────────────────
  const [apiRoles,     setApiRoles]     = useState([]);   // raw from backend
  const [apiUsers,     setApiUsers]     = useState([]);   // raw from backend
  const [customRoles,  setCustomRoles]  = useState([]);   // locally created
  const [isLoading,    setIsLoading]    = useState(true);
  const [fetchError,   setFetchError]   = useState(null);

  // ── Local permission state ────────────────────────────────────────────────────
  const [rolePermissions, setRolePermissions] = useState({}); // { roleCode: [permId, ...] }

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [selectedRoleCode, setSelectedRoleCode] = useState('');
  const [permSearch,       setPermSearch]        = useState('');
  const [saveNotice,       setSaveNotice]        = useState(false);

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [createModalOpen,  setCreateModalOpen]  = useState(false);
  const [deleteModalRole,  setDeleteModalRole]  = useState(null); // custom role to delete
  const [newRoleForm,      setNewRoleForm]      = useState({ ...EMPTY_NEW_ROLE });
  const [newRoleError,     setNewRoleError]     = useState('');
  const [feedback,         setFeedback]         = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const showSaved = () => {
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  };

  // ── Fetch roles and users from API ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [rolesRes, usersRes] = await Promise.allSettled([
        userService.getRoles(),
        userService.getUsers({ limit: 200 }),
      ]);

      let roles = [];
      if (rolesRes.status === 'fulfilled') {
        const rd = rolesRes.value;
        roles = rd?.data || (Array.isArray(rd) ? rd : []);
      }

      let users = [];
      if (usersRes.status === 'fulfilled') {
        const ud = usersRes.value;
        const data = ud?.data || ud;
        users = data?.users || (Array.isArray(data) ? data : []);
      }

      setApiRoles(roles);
      setApiUsers(users);

      // Initialize permissions — use defaults
      const perms = {};
      roles.forEach((r) => {
        perms[r.code] = DEFAULT_PERMISSIONS[r.code] || [];
      });
      setRolePermissions(perms);
      if (roles.length > 0 && !selectedRoleCode) {
        setSelectedRoleCode(roles[0].code);
      }
    } catch (err) {
      setFetchError(err?.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  }, []);  // eslint-disable-line

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived state ────────────────────────────────────────────────────────────
  // Merge system roles (API) + custom roles (local)
  const allRoles = useMemo(() => [
    ...apiRoles.map((r) => ({ ...r, isSystem: true })),
    ...customRoles,
  ], [apiRoles, customRoles]);

  const selectedRole = allRoles.find((r) => r.code === selectedRoleCode);

  const usersForRole = useMemo(() =>
    apiUsers.filter((u) => u.role === selectedRoleCode),
    [apiUsers, selectedRoleCode]
  );

  const selectedPerms = useMemo(() =>
    rolePermissions[selectedRoleCode] || [],
    [rolePermissions, selectedRoleCode]
  );

  const totalAllPerms = ALL_PERM_IDS.length;

  // ── Custom role CRUD ─────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setNewRoleForm({ ...EMPTY_NEW_ROLE });
    setNewRoleError('');
    setCreateModalOpen(true);
  };

  const handleCreateRole = (e) => {
    e.preventDefault();
    const name = newRoleForm.name.trim();
    const code = (newRoleForm.code || name).toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const desc = newRoleForm.description.trim() || 'Custom organizational role';

    if (!name) { setNewRoleError('Role name is required.'); return; }
    if (allRoles.some((r) => r.code === code)) {
      setNewRoleError(`Role code "${code}" already exists. Choose a different name.`);
      return;
    }

    // Clone permissions from template role
    const templatePerms = rolePermissions[newRoleForm.templateCode] || [];

    const newRole = {
      id:          `custom_${Date.now()}`,
      code,
      name,
      description: desc,
      label:       name,
      isSystem:    false,
    };

    setCustomRoles((prev) => [...prev, newRole]);
    setRolePermissions((prev) => ({ ...prev, [code]: [...templatePerms] }));
    setSelectedRoleCode(code);
    setCreateModalOpen(false);
    showFeedback(`Role "${name}" created with ${templatePerms.length} permissions cloned from template.`);

    auditService.createAuditLog({
      action: 'SECURITY',
      entityType: 'ROLE',
      entityId: code,
      entityTitle: `${name} (${code})`,
      summary: `New custom security profile "${name}" created with ${templatePerms.length} permissions cloned from ${newRoleForm.templateCode || 'scratch'}.`,
      severity: 'SUCCESS',
      details: {
        code,
        name,
        description: desc,
        clonedFrom: newRoleForm.templateCode || null,
        permissionsCount: templatePerms.length,
      },
    }).catch((err) => console.error('Failed to log role creation:', err));
  };

  const handleDeleteCustomRole = () => {
    if (!deleteModalRole) return;
    const code = deleteModalRole.code;
    setCustomRoles((prev) => prev.filter((r) => r.code !== code));
    setRolePermissions((prev) => { const n = { ...prev }; delete n[code]; return n; });
    setSelectedRoleCode(allRoles.find((r) => r.code !== code)?.code || '');
    setDeleteModalRole(null);
    showFeedback(`Role "${deleteModalRole.name}" has been deleted.`);

    auditService.createAuditLog({
      action: 'DELETE',
      entityType: 'ROLE',
      entityId: deleteModalRole.code,
      entityTitle: `${deleteModalRole.name} (${deleteModalRole.code})`,
      summary: `Custom security role "${deleteModalRole.name}" was permanently removed.`,
      severity: 'WARNING',
      details: {
        code: deleteModalRole.code,
        name: deleteModalRole.name,
      },
    }).catch((err) => console.error('Failed to log role deletion:', err));
  };

  // ── Permission toggle handlers ────────────────────────────────────────────────
  const handleTogglePerm = (permId) => {
    const cur = rolePermissions[selectedRoleCode] || [];
    const next = cur.includes(permId)
      ? cur.filter((p) => p !== permId)
      : [...cur, permId];
    setRolePermissions((prev) => ({ ...prev, [selectedRoleCode]: next }));
    showSaved();

    auditService.createAuditLog({
      action: 'SECURITY',
      entityType: 'ROLE',
      entityId: selectedRoleCode,
      entityTitle: `${selectedRole?.name || selectedRoleCode} Permissions`,
      summary: `Permission access matrix updated for role "${selectedRole?.name || selectedRoleCode}". Total active permissions: ${next.length}.`,
      severity: 'INFO',
      details: {
        role: selectedRoleCode,
        permissionsCount: next.length,
      },
    }).catch((err) => console.error('Failed to log permission change:', err));
  };

  const handleModuleToggleAll = (modulePermIds, enableAll) => {
    const cur = rolePermissions[selectedRoleCode] || [];
    const next = enableAll
      ? Array.from(new Set([...cur, ...modulePermIds]))
      : cur.filter((p) => !modulePermIds.includes(p));
    setRolePermissions((prev) => ({ ...prev, [selectedRoleCode]: next }));
    showSaved();

    auditService.createAuditLog({
      action: 'SECURITY',
      entityType: 'ROLE',
      entityId: selectedRoleCode,
      entityTitle: `${selectedRole?.name || selectedRoleCode} Permissions`,
      summary: `${enableAll ? 'Granted' : 'Revoked'} all module permissions for role "${selectedRole?.name || selectedRoleCode}". Total active permissions: ${next.length}.`,
      severity: 'INFO',
      details: {
        role: selectedRoleCode,
        modulePermIds,
        enableAll,
        permissionsCount: next.length,
      },
    }).catch((err) => console.error('Failed to log module permission change:', err));
  };

  // ── Filtered modules ──────────────────────────────────────────────────────────
  const filteredModules = useMemo(() => {
    if (!permSearch.trim()) return PERMISSION_MODULES;
    const q = permSearch.toLowerCase();
    return PERMISSION_MODULES.map((mod) => {
      const matchesCat = mod.category.toLowerCase().includes(q);
      const filteredPerms = mod.permissions.filter(
        (p) => p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      );
      if (matchesCat || filteredPerms.length > 0) {
        return { ...mod, permissions: matchesCat ? mod.permissions : filteredPerms };
      }
      return null;
    }).filter(Boolean);
  }, [permSearch]);

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const adminCount  = apiUsers.filter((u) => u.role === 'ADMIN').length;
  const salesCount  = apiUsers.filter((u) => u.role === 'SALES').length;
  const systemCount = apiRoles.length;
  const customCount = customRoles.length;

  // ── Render ────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading roles & permissions...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-slate-800">{fetchError}</p>
        <Button variant="secondary" size="sm" onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {feedback && (
        <div className={`fixed top-20 right-6 z-50 text-white text-xs px-4 py-3 rounded-xl shadow-modal flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${feedback.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'}`}>
          {feedback.type === 'error'
            ? <AlertTriangle className="w-4 h-4 shrink-0" />
            : <CheckCircle2  className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Roles &amp; Permissions
            </h1>
            <Badge variant="brand" size="xs">RBAC Matrix</Badge>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Define granular access controls for each CRM role across all modules
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          Create Custom Role
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'System Roles',   value: systemCount,   icon: Shield,      color: 'indigo',  sub: `${customCount} custom roles` },
          { label: 'Permission Keys',value: totalAllPerms, icon: KeyRound,    color: 'emerald', sub: 'Granular access controls' },
          { label: 'Administrators', value: adminCount,    icon: ShieldCheck, color: 'brand',   sub: 'Full access accounts' },
          { label: 'Sales Execs',    value: salesCount,    icon: Users,       color: 'amber',   sub: 'Sales team accounts' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
              <span className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-600`}>
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-900">{value}</div>
            <div className="mt-1 text-[11px] text-slate-500">{sub}</div>
          </div>
        ))}
      </div>

      {/* Main 2-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Left: Role List ────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          <div className="px-1 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Security Profiles ({apiRoles.length})
            </h2>
          </div>

          <div className="space-y-2">
            {allRoles.map((role) => {
              const isSelected = role.code === selectedRoleCode;
              const perms      = rolePermissions[role.code] || [];
              const pct        = Math.round((perms.length / totalAllPerms) * 100);
              const mapped     = apiUsers.filter((u) => u.role === role.code).length;
              const isSystem   = role.isSystem !== false; // treat undefined as system

              return (
                <div
                  key={role.code}
                  onClick={() => setSelectedRoleCode(role.code)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-brand-600 shadow-md ring-1 ring-brand-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">{role.name}</span>
                        {isSystem ? (
                          <span className="p-1 rounded bg-slate-100 text-slate-500 shrink-0" title="System role — protected">
                            <Lock className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 font-semibold">{role.code}</div>
                    </div>
                    <Badge variant={isSelected ? 'brand' : 'neutral'} size="xs">
                      {mapped} {mapped === 1 ? 'User' : 'Users'}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {role.description ||
                      (role.code === 'ADMIN'
                        ? 'Full system access with all CRM modules and settings.'
                        : 'Sales team access for leads, bookings and property viewing.')}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        {perms.length} of {totalAllPerms} Permissions
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-brand-700">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct === 100 ? 'bg-purple-600' : pct > 50 ? 'bg-brand-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Permission Matrix ───────────────────────────────────────── */}
        {selectedRole && (
          <div className="lg:col-span-8 space-y-5">
            {/* Role Header Card */}
            <Card className="border border-slate-200 shadow-subtle bg-white">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">{selectedRole.name}</h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {selectedRole.code}
                      </span>
                      {selectedRole.isSystem === false
                        ? <Badge variant="warning" size="xs">Custom Role</Badge>
                        : <Badge variant="neutral" size="xs">System Role</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedRole.description ||
                        (selectedRole.code === 'ADMIN'
                          ? 'Super administrator with full unrestricted access to all CRM modules.'
                          : 'Sales executive with access to lead management, bookings and properties.')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {saveNotice && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Check className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                    {/* Delete only for custom roles */}
                    {selectedRole.isSystem === false && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={(e) => { e.stopPropagation(); setDeleteModalRole(selectedRole); }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Role
                      </Button>
                    )}
                  </div>
                </div>

                {/* Assigned Users Chips */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Assigned Users ({usersForRole.length}):</span>
                  {usersForRole.length === 0 ? (
                    <span className="text-slate-400 italic">No users mapped to this role</span>
                  ) : (
                    usersForRole.slice(0, 8).map((u) => (
                      <div
                        key={u.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                      >
                        <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] flex items-center justify-center font-bold">
                          {(u.name || 'U').slice(0, 1).toUpperCase()}
                        </span>
                        <span>{u.name}</span>
                      </div>
                    ))
                  )}
                  {usersForRole.length > 8 && (
                    <span className="text-slate-400 text-[11px]">+{usersForRole.length - 8} more</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Search + hint bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-subtle">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Search permissions by module or capability..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  isSearch
                  isClearable
                  onClear={() => setPermSearch('')}
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Toggle any permission switch — changes are saved instantly in session
              </span>
            </div>

            {/* Permission Module Cards */}
            <div className="space-y-4">
              {filteredModules.map((mod) => {
                const modPermIds   = mod.permissions.map((p) => p.id);
                const enabledCount = modPermIds.filter((id) => selectedPerms.includes(id)).length;
                const isAllOn      = enabledCount === modPermIds.length;
                const Icon         = mod.icon;

                return (
                  <Card key={mod.id} className="border border-slate-200 shadow-subtle bg-white">
                    {/* Module Header */}
                    <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{mod.category}</h4>
                            <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {mod.route}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              enabledCount === modPermIds.length
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : enabledCount > 0
                                ? 'bg-brand-50 text-brand-700 border-brand-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {enabledCount}/{modPermIds.length} Active
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{mod.description}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleModuleToggleAll(modPermIds, !isAllOn)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors shrink-0"
                      >
                        {isAllOn ? 'Revoke All' : 'Grant All'}
                      </button>
                    </div>

                    {/* Permissions Grid */}
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mod.permissions.map((perm) => {
                        const isOn = selectedPerms.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => handleTogglePerm(perm.id)}
                            className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer select-none ${
                              isOn
                                ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex-1 space-y-0.5">
                              <div className="font-semibold text-xs text-slate-900">{perm.label}</div>
                              <p className="text-[11px] text-slate-500 leading-normal">{perm.desc}</p>
                              <div className="text-[10px] font-mono text-slate-400 pt-0.5">{perm.id}</div>
                            </div>

                            {/* Toggle Switch */}
                            <div className="pt-0.5 shrink-0">
                              <button
                                type="button"
                                aria-label={`Toggle ${perm.label}`}
                                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                  isOn ? 'bg-emerald-600' : 'bg-slate-300'
                                }`}
                              >
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                                  isOn ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* ── MODAL: Create Custom Role ─────────────────────────────────── */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Custom Role"
          description="Define a new security profile and clone permissions from an existing role template"
          size="md"
        >
          <form onSubmit={handleCreateRole} className="space-y-4">
            {newRoleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {newRoleError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Display Name *</label>
              <Input
                required
                placeholder="e.g. Channel Partner Manager"
                value={newRoleForm.name}
                onChange={(e) => setNewRoleForm({
                  ...newRoleForm,
                  name: e.target.value,
                  code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
                })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Code (auto-generated)</label>
              <Input
                placeholder="e.g. CHANNEL_PARTNER_MGR"
                value={newRoleForm.code}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
              />
              <p className="text-[11px] text-slate-400 mt-1">Used internally — uppercase letters, numbers and underscores only.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <Input
                placeholder="Brief summary of this role's responsibilities..."
                value={newRoleForm.description}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clone Permissions From Template</label>
              <select
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700"
                value={newRoleForm.templateCode}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, templateCode: e.target.value })}
              >
                <option value="">No template — start with 0 permissions</option>
                {allRoles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name} — {rolePermissions[r.code]?.length || 0} permissions
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">You can fine-tune permissions after creating the role.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Create Role
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: Delete Custom Role ─────────────────────────────────── */}
      {deleteModalRole && (
        <Modal
          isOpen={Boolean(deleteModalRole)}
          onClose={() => setDeleteModalRole(null)}
          title={`Delete Role: ${deleteModalRole.name}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">This action cannot be undone.</p>
                <p className="mt-0.5 text-rose-700/90">
                  The custom role <strong>"{deleteModalRole.name}"</strong> and all its permission settings will be permanently removed.
                  Any users assigned to this role should be reassigned.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setDeleteModalRole(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDeleteCustomRole} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                Delete Role
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default RoleManagementPage;
