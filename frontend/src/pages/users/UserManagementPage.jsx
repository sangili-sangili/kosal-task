import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Briefcase,
  Users,
  Award,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  KeyRound,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const ROLE_BADGE_VARIANTS = {
  SUPER_ADMIN: 'danger',
  ADMIN: 'brand',
  SALES_MANAGER: 'brand',
  SALES_EXECUTIVE: 'success',
  CHANNEL_PARTNER: 'warning',
};

export function UserManagementPage() {
  const navigate = useNavigate();
  const {
    employees,
    roles,
    projects,
    leads,
    bookings,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
  } = useCrm();

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editUserModal, setEditUserModal] = useState(null);
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [pwdResetSuccess, setPwdResetSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'SALES_EXECUTIVE',
    title: 'Property Sales Specialist',
    status: 'ACTIVE',
    assignedProjects: ['Prestige Falcon City'],
  });

  // Calculate live dynamic metrics for each employee
  const enrichedUsers = useMemo(() => {
    return employees.map((emp) => {
      const empLeads = leads.filter((l) => l.assignedToId === emp.id || l.assignedToName === emp.name);
      const activeLeads = empLeads.filter((l) => l.stage !== 'BOOKED' && l.stage !== 'LOST');
      const empBookings = bookings.filter((b) => b.bookedBy === emp.name && b.status !== 'CANCELLED');
      const matchedRole = roles.find((r) => r.code === emp.role);

      return {
        ...emp,
        computedActiveLeads: activeLeads.length,
        computedBookingsCount: empBookings.length,
        roleName: matchedRole?.name || emp.roleName || emp.role,
        assignedProjects: emp.assignedProjects || ['Prestige Falcon City'],
      };
    });
  }, [employees, leads, bookings, roles]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter((user) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (user.name || '').toLowerCase().includes(q);
        const matchesEmail = (user.email || '').toLowerCase().includes(q);
        const matchesPhone = (user.phone || '').includes(q);
        const matchesTitle = (user.title || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesTitle) return false;
      }

      if (roleFilter && user.role !== roleFilter) return false;
      if (statusFilter && user.status !== statusFilter) return false;
      if (
        projectFilter &&
        !user.assignedProjects.some((p) => p.toLowerCase().includes(projectFilter.toLowerCase()))
      ) {
        return false;
      }

      return true;
    });
  }, [enrichedUsers, searchQuery, roleFilter, statusFilter, projectFilter]);

  // Overall Stats
  const totalActiveUsers = employees.filter((e) => e.status === 'ACTIVE').length;
  const totalActivePipeline = leads.filter((l) => l.stage !== 'BOOKED' && l.stage !== 'LOST').length;

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'SALES_EXECUTIVE',
      title: 'Property Sales Specialist',
      status: 'ACTIVE',
      assignedProjects: ['Prestige Falcon City'],
    });
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditUserModal(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      title: user.title,
      status: user.status,
      assignedProjects: [...(user.assignedProjects || ['Prestige Falcon City'])],
    });
  };

  const handleProjectToggle = (projectName) => {
    const current = formData.assignedProjects || [];
    if (current.includes(projectName)) {
      if (current.length === 1) return; // keep at least 1
      setFormData({ ...formData, assignedProjects: current.filter((p) => p !== projectName) });
    } else {
      setFormData({ ...formData, assignedProjects: [...current, projectName] });
    }
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    addUser(formData);
    setAddModalOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editUserModal || !formData.name.trim()) return;
    updateUser(editUserModal.id, formData);
    if (currentUser.id === editUserModal.id) {
      setCurrentUser({ ...currentUser, ...formData });
    }
    setEditUserModal(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteUserModal) return;
    deleteUser(deleteUserModal.id);
    setDeleteUserModal(null);
  };

  const handleResetPassword = () => {
    setPwdResetSuccess(true);
    setTimeout(() => {
      setPwdResetSuccess(false);
      setResetPwdUser(null);
    }, 1800);
  };

  const hasActiveFilters = Boolean(searchQuery || roleFilter || statusFilter || projectFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              User Management
            </h1>
            <Badge variant="neutral" size="sm">
              {employees.length} Users
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Administer system user accounts, project access rights, and security role mappings
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/roles">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<KeyRound className="w-4 h-4 text-brand-600" />}
            >
              Roles Master ({roles.length})
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
          >
            Add New User
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Accounts</span>
            <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{employees.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{totalActiveUsers} Active</span> •{' '}
            {employees.length - totalActiveUsers} Inactive
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Defined Roles Master</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{roles.length} Roles</div>
          <div className="mt-1 text-[11px] text-brand-600 font-medium">
            <Link to="/roles" className="hover:underline flex items-center gap-0.5">
              Manage Roles & Permissions →
            </Link>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Pipeline Leads</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalActivePipeline} Leads</div>
          <div className="mt-1 text-[11px] text-slate-500">Assigned across sales executives</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Current Persona</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {currentUser.name}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {currentUser.role} ({currentUser.title})
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-slate-200 shadow-none bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-4">
              <Input
                placeholder="Search user name, email, phone or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                isClearable
                onClear={() => setSearchQuery('')}
              />
            </div>

            <div className="lg:col-span-3">
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="lg:col-span-3">
              <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          </div>

          {/* Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Active Filters:</span>
                {searchQuery && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    Query: "{searchQuery}"
                  </span>
                )}
                {roleFilter && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    Role: {roles.find((r) => r.code === roleFilter)?.name || roleFilter}
                  </span>
                )}
                {projectFilter && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    Project: {projectFilter}
                  </span>
                )}
                {statusFilter && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    Status: {statusFilter}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('');
                  setProjectFilter('');
                  setStatusFilter('');
                }}
                className="text-brand-600 hover:text-brand-700 font-medium underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Data Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasActiveFilters ? 'No users match your filters' : 'No user accounts found'}
          description="Try clearing your search query or role filter to view all user accounts."
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add New User'}
          onAction={
            hasActiveFilters
              ? () => {
                  setSearchQuery('');
                  setRoleFilter('');
                  setProjectFilter('');
                  setStatusFilter('');
                }
              : handleOpenAddModal
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Security Role</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Assigned Projects</th>
                  <th className="py-3 px-4">Pipeline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((user) => {
                  const roleVariant = ROLE_BADGE_VARIANTS[user.role] || 'neutral';
                  const isCurrent = currentUser.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isCurrent ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border border-brand-200 font-bold flex items-center justify-center text-xs shrink-0">
                            {user.avatar || user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-brand-600 text-white text-[9px] font-bold tracking-wider uppercase">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {user.title}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Security Role */}
                      <td className="py-3.5 px-4">
                        <Link to="/roles" className="hover:opacity-80">
                          <Badge variant={roleVariant} size="sm">
                            {user.roleName || user.role}
                          </Badge>
                        </Link>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                      </td>

                      {/* Assigned Projects */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.assignedProjects?.map((proj) => (
                            <span
                              key={proj}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80"
                            >
                              {proj}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Pipeline */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {user.computedActiveLeads}
                          </span>
                          <span className="text-slate-400 text-xs">active leads</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {user.computedBookingsCount} bookings
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user.id)}
                          className="focus:outline-none"
                          title="Click to toggle status"
                        >
                          <Badge
                            variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}
                            size="sm"
                            withDot
                          >
                            {user.status}
                          </Badge>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-brand-600 hover:bg-brand-50"
                              onClick={() => setCurrentUser(user)}
                              title="Test CRM as this user"
                            >
                              Act As
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="xs"
                            leftIcon={<Edit2 className="w-3 h-3" />}
                            onClick={() => handleOpenEditModal(user)}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            title="Reset password"
                            onClick={() => setResetPwdUser(user)}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          </Button>

                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => setDeleteUserModal(user)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Add New User */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Onboard New User Account"
          size="md"
        >
          <form onSubmit={handleSaveAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email *
                </label>
                <Input
                  required
                  type="email"
                  placeholder="name@crm.realestate"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone *
                </label>
                <Input
                  required
                  placeholder="+91 98450 XXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Title
                </label>
                <Input
                  placeholder="e.g. Senior Portfolio Consultant"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Role *
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>

            {/* Project Access Multi-Checkbox */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assigned Developments / Projects
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                {projects.map((proj) => {
                  const isChecked = formData.assignedProjects?.includes(proj.name);
                  return (
                    <label
                      key={proj.id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleProjectToggle(proj.name)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span className="truncate">{proj.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Register User
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Edit User */}
      {editUserModal && (
        <Modal
          isOpen={Boolean(editUserModal)}
          onClose={() => setEditUserModal(null)}
          title={`Edit User: ${editUserModal.name}`}
          size="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Role
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>

            {/* Project Access */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assigned Developments
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                {projects.map((proj) => {
                  const isChecked = formData.assignedProjects?.includes(proj.name);
                  return (
                    <label
                      key={proj.id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleProjectToggle(proj.name)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span className="truncate">{proj.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" type="button" onClick={() => setEditUserModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Reset Password Mock Modal */}
      {resetPwdUser && (
        <Modal
          isOpen={Boolean(resetPwdUser)}
          onClose={() => setResetPwdUser(null)}
          title={`Reset Credentials: ${resetPwdUser.name}`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Generate a temporary password reset token and send instructions to{' '}
              <strong>{resetPwdUser.email}</strong>.
            </p>

            {pwdResetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password reset link sent successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setResetPwdUser(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResetPassword}
                disabled={pwdResetSuccess}
              >
                Send Reset Link
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: Delete User Confirmation */}
      {deleteUserModal && (
        <Modal
          isOpen={Boolean(deleteUserModal)}
          onClose={() => setDeleteUserModal(null)}
          title="Decommission User Account"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{deleteUserModal.name}</strong>? Their assigned
              leads can be redistributed to other sales agents in the Leads directory.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setDeleteUserModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
                Confirm Removal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UserManagementPage;
