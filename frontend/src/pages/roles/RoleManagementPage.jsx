import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Users,
  Building2,
  Layers,
  BookmarkCheck,
  UserCheck,
  History,
  LayoutDashboard,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const MENU_ICON_MAP = {
  mod_dashboard: LayoutDashboard,
  mod_leads: Users,
  mod_properties: Building2,
  mod_units: Layers,
  mod_bookings: BookmarkCheck,
  mod_users: UserCheck,
  mod_roles: ShieldCheck,
  mod_audit: History,
};

export function RoleManagementPage() {
  const {
    roles,
    permissionModules,
    employees,
    addRole,
    updateRole,
    deleteRole,
    toggleRolePermission,
    setRoleCategoryPermissions,
    currentUser,
  } = useCrm();

  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || 'role-superadmin');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  // New Role Form State
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    code: '',
    description: '',
    templateRoleId: 'role-executive',
  });

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // Users assigned to this role
  const assignedEmployees = useMemo(() => {
    if (!selectedRole) return [];
    return employees.filter(
      (emp) => emp.role === selectedRole.code || emp.roleName === selectedRole.name
    );
  }, [employees, selectedRole]);

  // Overall statistics
  const totalSystemRoles = roles.filter((r) => r.isSystem).length;
  const totalCustomRoles = roles.length - totalSystemRoles;
  const totalAllPermsCount = permissionModules.reduce(
    (sum, m) => sum + m.permissions.length,
    0
  );

  const handleSelectRole = (roleId) => {
    setSelectedRoleId(roleId);
    setSaveSuccessNotice(false);
  };

  const handleTogglePerm = (permKey) => {
    if (selectedRole?.isSystem && selectedRole.code === 'SUPER_ADMIN') return;
    toggleRolePermission(selectedRole.id, permKey);
    showTempSavedNotice();
  };

  const handleCategoryToggleAll = (permKeys, enableAll) => {
    if (selectedRole?.isSystem && selectedRole.code === 'SUPER_ADMIN') return;
    setRoleCategoryPermissions(selectedRole.id, permKeys, enableAll);
    showTempSavedNotice();
  };

  const showTempSavedNotice = () => {
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleOpenCreateModal = () => {
    setNewRoleData({
      name: '',
      code: '',
      description: '',
      templateRoleId: 'role-executive',
    });
    setCreateModalOpen(true);
  };

  const handleSaveNewRole = (e) => {
    e.preventDefault();
    if (!newRoleData.name.trim()) return;

    const templateRole = roles.find((r) => r.id === newRoleData.templateRoleId);
    const initialPerms = templateRole ? [...templateRole.permissions] : [];

    const created = addRole({
      name: newRoleData.name.trim(),
      code: (newRoleData.code || newRoleData.name).trim(),
      description: newRoleData.description.trim() || 'Custom organizational real estate role',
      permissions: initialPerms,
    });

    setCreateModalOpen(false);
    setSelectedRoleId(created.id);
  };

  const handleConfirmDelete = () => {
    if (!selectedRole || selectedRole.isSystem) return;
    deleteRole(selectedRole.id);
    setDeleteConfirmOpen(false);
    setSelectedRoleId(roles[0]?.id || '');
  };

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!permSearch.trim()) return permissionModules;
    const query = permSearch.toLowerCase();
    return permissionModules
      .map((mod) => {
        const matchesCategory = mod.category.toLowerCase().includes(query);
        const matchesMenu = mod.menuTitle?.toLowerCase().includes(query);
        const filteredPerms = mod.permissions.filter(
          (p) =>
            p.label.toLowerCase().includes(query) ||
            p.desc.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query)
        );
        if (matchesCategory || matchesMenu || filteredPerms.length > 0) {
          return {
            ...mod,
            permissions: matchesCategory || matchesMenu ? mod.permissions : filteredPerms,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [permissionModules, permSearch]);

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Roles & Permissions Master
            </h1>
            <Badge variant="brand" size="sm">
              Menu-Aligned RBAC
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Define organizational privilege profiles with granular permissions matched directly with CRM sidebar menus
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={handleOpenCreateModal}
          >
            Create Custom Role
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Defined Roles</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{roles.length} Roles</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {totalSystemRoles} System Core • {totalCustomRoles} Custom
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CRM Menu Modules</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <KeyRound className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{permissionModules.length} Menus</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {totalAllPermsCount} Granular Access Keys
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Staff</span>
            <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{employees.length} Users</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Mapped to organizational security profiles
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Selected</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {selectedRole?.name}
          </div>
          <div className="mt-1 text-[11px] text-brand-600 font-mono truncate font-semibold">
            {selectedRole?.code}
          </div>
        </div>
      </div>

      {/* Main 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Roles Directory Card List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Security Profiles ({roles.length})
            </h2>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              New Role
            </button>
          </div>

          <div className="space-y-2">
            {roles.map((role) => {
              const isSelected = role.id === selectedRole?.id;
              const permsCount = role.permissions?.length || 0;
              const mappedUsers = employees.filter(
                (e) => e.role === role.code || e.roleName === role.name
              ).length;
              const coveragePct = Math.round((permsCount / totalAllPermsCount) * 100);

              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white border-brand-600 shadow-md ring-1 ring-brand-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{role.name}</span>
                        {role.isSystem ? (
                          <span
                            title="Protected Core System Role"
                            className="p-1 rounded bg-slate-100 text-slate-500"
                          >
                            <Lock className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 font-semibold">
                        {role.code}
                      </div>
                    </div>

                    <Badge
                      variant={isSelected ? 'brand' : 'neutral'}
                      size="sm"
                    >
                      {mappedUsers} {mappedUsers === 1 ? 'User' : 'Users'}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        {permsCount} of {totalAllPermsCount} Permissions
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-brand-700">
                        {coveragePct}%
                      </span>
                    </div>

                    {/* Progress indicator bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          coveragePct === 100
                            ? 'bg-purple-600'
                            : coveragePct > 50
                            ? 'bg-brand-600'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${coveragePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Menu-Aligned Permissions Matrix Workspace (8 cols) */}
        {selectedRole && (
          <div className="lg:col-span-8 space-y-6">
            {/* Active Role Header Card */}
            <Card className="border border-slate-200 shadow-subtle bg-white">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">{selectedRole.name}</h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {selectedRole.code}
                      </span>
                      {selectedRole.isSystem ? (
                        <Badge variant="neutral" size="sm">
                          Core System Role
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Custom Real Estate Role
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{selectedRole.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {saveSuccessNotice && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all">
                        <Check className="w-3.5 h-3.5" />
                        Permissions Saved
                      </span>
                    )}

                    {!selectedRole.isSystem && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete Role
                      </Button>
                    )}
                  </div>
                </div>

                {/* Assigned Personnel Chips */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Mapped Staff ({assignedEmployees.length}):</span>
                  {assignedEmployees.length === 0 ? (
                    <span className="text-slate-400 italic">No staff members currently mapped</span>
                  ) : (
                    assignedEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                      >
                        <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] flex items-center justify-center font-bold">
                          {emp.avatar || emp.name[0]}
                        </span>
                        <span>{emp.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permissions Workspace Toolbar: Search & Explanations */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-subtle">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Filter permissions by menu or capability..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  isSearch
                  onClear={() => setPermSearch('')}
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                {selectedRole.code === 'SUPER_ADMIN' ? (
                  <span className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1 font-medium">
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    Super Admin perms are master unlocked
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Click any capability switch to toggle access in real-time
                  </span>
                )}
              </div>
            </div>

            {/* Menu-Aligned Permission Cards */}
            <div className="space-y-4">
              {filteredModules.map((module) => {
                const modulePermKeys = module.permissions.map((p) => p.id);
                const enabledCount = modulePermKeys.filter((k) =>
                  selectedRole.permissions.includes(k)
                ).length;
                const isAllSelected = enabledCount === modulePermKeys.length;
                const IconComponent = MENU_ICON_MAP[module.id] || Layers;

                return (
                  <Card
                    key={module.id}
                    className="border border-slate-200 shadow-subtle bg-white overflow-hidden"
                  >
                    {/* Module Card Header */}
                    <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{module.category}</h4>
                            <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                              Menu: {module.route}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                              enabledCount === module.permissions.length
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : enabledCount > 0
                                ? 'bg-brand-50 text-brand-700 border-brand-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {enabledCount} of {module.permissions.length} Active
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{module.description}</p>
                        </div>
                      </div>

                      {/* Quick Select / Deselect All per Menu */}
                      {selectedRole.code !== 'SUPER_ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleCategoryToggleAll(modulePermKeys, !isAllSelected)}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors self-start sm:self-auto shrink-0"
                        >
                          {isAllSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Permissions Grid */}
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {module.permissions.map((perm) => {
                        const isChecked = selectedRole.permissions.includes(perm.id);
                        const isLocked = selectedRole.code === 'SUPER_ADMIN';

                        return (
                          <div
                            key={perm.id}
                            onClick={() => !isLocked && handleTogglePerm(perm.id)}
                            className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 select-none ${
                              isChecked
                                ? 'bg-emerald-50/30 border-emerald-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            } ${isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                          >
                            {/* Label & Description */}
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-slate-900">
                                  {perm.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal">{perm.desc}</p>
                              <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                                {perm.id}
                              </div>
                            </div>

                            {/* Toggle Switch Component */}
                            <div className="pt-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={isLocked}
                                aria-label={`Toggle permission ${perm.label}`}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isChecked ? 'bg-emerald-600' : 'bg-slate-300'
                                } ${isLocked ? 'cursor-not-allowed' : ''}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    isChecked ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
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

      {/* MODAL 1: Create Custom Role Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Custom Security Role"
          description="Establish a new role profile and pre-populate permissions from an existing template"
          size="md"
        >
          <form onSubmit={handleSaveNewRole} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Display Name *
              </label>
              <Input
                required
                placeholder="e.g. Regional Marketing Lead"
                value={newRoleData.name}
                onChange={(e) =>
                  setNewRoleData({
                    ...newRoleData,
                    name: e.target.value,
                    code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Identification Code
              </label>
              <Input
                placeholder="e.g. MARKETING_LEAD"
                value={newRoleData.code}
                onChange={(e) => setNewRoleData({ ...newRoleData, code: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Description
              </label>
              <Input
                placeholder="Brief summary of duties and departmental scope"
                value={newRoleData.description}
                onChange={(e) =>
                  setNewRoleData({ ...newRoleData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pre-populate Permissions From Template
              </label>
              <Select
                value={newRoleData.templateRoleId}
                onChange={(e) =>
                  setNewRoleData({ ...newRoleData, templateRoleId: e.target.value })
                }
                options={roles.map((r) => ({
                  value: r.id,
                  label: `${r.name} (${r.permissions?.length || 0} perms)`,
                }))}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Create & Configure Role
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Delete Role Confirmation */}
      {deleteConfirmOpen && (
        <Modal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title={`Delete Security Role: ${selectedRole?.name}?`}
          description="Are you sure you want to delete this custom security role?"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-semibold">This action cannot be undone.</p>
                <p>
                  Any users assigned to this role will lose their custom menu permissions and should be reassigned to a standard profile.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Keep Role
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
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
