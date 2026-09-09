import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UserPlus, Search, Edit2, Trash2, Shield, Briefcase, Users, Phone, Mail,
  CheckCircle2, XCircle, KeyRound, ShieldCheck, MoreVertical, RotateCcw,
  AlertTriangle, AlertCircle, Sparkles, Download,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

// ─── Role styling ─────────────────────────────────────────────────────────────
const ROLE_META = {
  ADMIN: { variant: 'brand',   label: 'Administrator' },
  SALES: { variant: 'success', label: 'Sales Executive' },
};

const EMPTY_FORM = {
  name:      '',
  email:     '',
  role:      'SALES',
  is_active: true,
  password:  'Welcome@123',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function UserManagementPage() {
  // ── Data ────────────────────────────────────────────────────────────────────
  const [users,      setUsers]      = useState([]);
  const [roles,      setRoles]      = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [searchQuery,     setSearchQuery]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter,      setRoleFilter]      = useState('');
  const [statusFilter,    setStatusFilter]    = useState('');
  const [sortBy,          setSortBy]          = useState('name-asc');

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [currentPage,   setCurrentPage]   = useState(1);
  const [pageSize,      setPageSize]      = useState(15);
  const [totalRecords,  setTotalRecords]  = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [addModalOpen,    setAddModalOpen]    = useState(false);
  const [editUser,        setEditUser]        = useState(null);
  const [deleteUser,      setDeleteUser]      = useState(null);
  const [resetPwdUser,    setResetPwdUser]    = useState(null);
  const [newPassword,     setNewPassword]     = useState('Welcome@123');

  // ── Action states ────────────────────────────────────────────────────────────
  const [isSaving,    setIsSaving]    = useState(false);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // ── Three-dot dropdown ───────────────────────────────────────────────────────
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // ── Form ─────────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ── Debounce search ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setCurrentPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdownId]);

  // ── Load roles once ──────────────────────────────────────────────────────────
  useEffect(() => {
    userService.getRoles().then((res) => {
      const list = res?.data || (Array.isArray(res) ? res : []);
      setRoles(list);
    }).catch(() => {
      // fallback static roles
      setRoles([
        { code: 'ADMIN', name: 'Administrator' },
        { code: 'SALES', name: 'Sales Executive' },
      ]);
    });
  }, []);

  // ── Fetch users from API ─────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      let sort = 'name', order = 'ASC';
      if (sortBy === 'name-desc')    { sort = 'name';      order = 'DESC'; }
      else if (sortBy === 'date-desc') { sort = 'createdAt'; order = 'DESC'; }
      else if (sortBy === 'date-asc')  { sort = 'createdAt'; order = 'ASC'; }

      const res = await userService.getUsers({
        page:   currentPage,
        limit:  pageSize,
        search: debouncedSearch || undefined,
        role:   roleFilter   || undefined,
        status: statusFilter || undefined,
        sort,
        order,
      });

      const data  = res?.data  || res;
      const rows  = data?.users || (Array.isArray(data) ? data : []);
      const pg    = data?.pagination;

      setUsers(rows);
      setTotalRecords(pg?.total ?? rows.length);
      setTotalPages(pg?.totalPages ?? 1);
    } catch (err) {
      setFetchError(err?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, roleFilter, statusFilter, sortBy]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── KPI stats ────────────────────────────────────────────────────────────────
  const activeCount = useMemo(() => users.filter((u) => u.is_active).length, [users]);
  const adminCount  = useMemo(() => users.filter((u) => u.role === 'ADMIN').length,  [users]);
  const salesCount  = useMemo(() => users.filter((u) => u.role === 'SALES').length,  [users]);

  const hasFilters = Boolean(searchQuery || roleFilter || statusFilter);

  const resetFilters = () => {
    setSearchQuery(''); setDebouncedSearch('');
    setRoleFilter(''); setStatusFilter('');
    setCurrentPage(1);
  };

  // ── CRUD handlers ────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setFormData({ ...EMPTY_FORM });
    setFormError('');
    setAddModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, is_active: user.is_active, password: '' });
    setFormError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    setIsSaving(true);
    setFormError('');
    try {
      await userService.createUser(formData);
      setAddModalOpen(false);
      showFeedback(`User "${formData.name}" created successfully!`);
      fetchUsers();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser || !formData.name.trim()) return;
    setIsSaving(true);
    setFormError('');
    try {
      await userService.updateUser(editUser.id, {
        name:      formData.name,
        email:     formData.email,
        role:      formData.role,
        is_active: formData.is_active,
      });
      setEditUser(null);
      showFeedback(`User "${formData.name}" updated successfully!`);
      fetchUsers();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleUserStatus(user.id);
      showFeedback(`${user.name} is now ${user.is_active ? 'Inactive' : 'Active'}.`);
      fetchUsers();
    } catch (err) {
      showFeedback(err?.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(deleteUser.id);
      setDeleteUser(null);
      showFeedback(`User "${deleteUser.name}" has been removed.`);
      fetchUsers();
    } catch (err) {
      showFeedback(err?.response?.data?.message || err?.message || 'Failed to delete user', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPwdUser) return;
    setIsResetting(true);
    try {
      await userService.resetPassword(resetPwdUser.id, newPassword);
      setResetPwdUser(null);
      setNewPassword('Welcome@123');
      showFeedback(`Password for "${resetPwdUser.name}" reset successfully!`);
    } catch (err) {
      showFeedback(err?.message || 'Failed to reset password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // ── Role options ──────────────────────────────────────────────────────────────
  const roleOptions = useMemo(() => [
    { value: '', label: 'All Roles' },
    ...roles.map((r) => ({ value: r.code, label: r.name })),
  ], [roles]);

  const sortOptions = [
    { value: 'name-asc',   label: 'Name A→Z' },
    { value: 'name-desc',  label: 'Name Z→A' },
    { value: 'date-desc',  label: 'Newest First' },
    { value: 'date-asc',   label: 'Oldest First' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
            <Badge variant="brand" size="xs">{totalRecords} Users</Badge>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Administer CRM accounts, roles, access rights and credentials
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<UserPlus className="w-4 h-4" />} onClick={openAddModal}>
          Add New User
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts',    value: totalRecords, icon: Users,      color: 'brand',  sub: `${activeCount} Active` },
          { label: 'Active Users',      value: activeCount,  icon: CheckCircle2,color: 'success',sub: `${totalRecords - activeCount} Inactive` },
          { label: 'Administrators',    value: adminCount,   icon: ShieldCheck, color: 'indigo', sub: 'Full access role' },
          { label: 'Sales Executives',  value: salesCount,   icon: Briefcase,   color: 'amber',  sub: 'CRM sales role' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label} className="p-4 bg-white border border-slate-200/90 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
              <span className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-600`}>
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-900">{value}</div>
            <div className="mt-1 text-[11px] text-slate-500">{sub}</div>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              isSearch
              isClearable
              onClear={() => setSearchQuery('')}
            />
          </div>
          <div className="lg:col-span-3">
            <Select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              options={roleOptions}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { value: '',         label: 'All Statuses' },
                { value: 'ACTIVE',   label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={sortOptions}
            />
          </div>
        </div>

        {hasFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-semibold text-slate-700">Active Filters:</span>
              {searchQuery  && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">Search: "{searchQuery}"</span>}
              {roleFilter   && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">Role: {roleFilter}</span>}
              {statusFilter && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">Status: {statusFilter}</span>}
            </div>
            <button type="button" onClick={resetFilters} className="text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 hover:underline">
              <RotateCcw className="w-3.5 h-3.5" /> Reset All
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading user accounts...</p>
        </div>
      ) : fetchError ? (
        <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">{fetchError}</p>
          <Button variant="secondary" size="sm" onClick={fetchUsers}>Retry</Button>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No users match your filters' : 'No user accounts yet'}
          description={hasFilters ? 'Try clearing filters to view all users.' : 'Add your first CRM user to get started.'}
          actionLabel={hasFilters ? 'Clear Filters' : 'Add New User'}
          onAction={hasFilters ? resetFilters : openAddModal}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-subtle" style={{ overflow: 'visible' }}>
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => {
                  const roleMeta = ROLE_META[user.role] || { variant: 'neutral', label: user.role };
                  const initials = (user.name || 'U').slice(0, 2).toUpperCase();
                  const joined   = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border border-brand-200 font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm">{user.name}</div>
                            <div className="text-[11px] text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <Badge variant={roleMeta.variant} size="xs" dot>
                          {roleMeta.label}
                        </Badge>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{user.email}</span>
                        </div>
                      </td>

                      {/* Status — clickable toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          title="Click to toggle active/inactive"
                          className="cursor-pointer focus:outline-none"
                        >
                          <Badge variant={user.is_active ? 'success' : 'neutral'} size="xs" dot>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>

                      {/* Joined */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">{joined}</td>

                      {/* Three-dot Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="relative flex items-center justify-end"
                          ref={openDropdownId === user.id ? dropdownRef : null}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all shadow-2xs focus:outline-none"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownId === user.id && (
                            <div className="absolute right-0 top-full mt-1.5 z-[100] w-48 bg-white border border-slate-200/90 rounded-xl shadow-modal animate-in fade-in slide-in-from-top-1">
                              <button
                                type="button"
                                onClick={() => { openEditModal(user); setOpenDropdownId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                Edit User
                              </button>

                              <button
                                type="button"
                                onClick={() => { handleToggleStatus(user); setOpenDropdownId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                {user.is_active
                                  ? <XCircle    className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  : <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                type="button"
                                onClick={() => { setResetPwdUser(user); setNewPassword('Welcome@123'); setOpenDropdownId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                Reset Password
                              </button>

                              <div className="border-t border-slate-100 my-0.5" />

                              {/* Delete — hidden for ADMIN accounts */}
                              {user.role !== 'ADMIN' && (
                                <button
                                  type="button"
                                  onClick={() => { setDeleteUser(user); setOpenDropdownId(null); }}
                                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  Delete User
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900">{totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span>
              {' '}to{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, totalRecords)}</span>
              {' '}of <span className="font-semibold text-slate-900">{totalRecords}</span> users
            </div>
            <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            />
          </div>
        </div>
      )}

      {/* ── MODAL: Add User ──────────────────────────────────────────────────── */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => !isSaving && setAddModalOpen(false)}
          title="Add New User"
          description="Create a CRM user account with login credentials"
          size="md"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <Input required placeholder="e.g. Vikram Singhania" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <Input required type="email" placeholder="name@company.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={roles.map((r) => ({ value: r.code, label: r.name }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <Input placeholder="Welcome@123" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                <Select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" type="button" disabled={isSaving} onClick={() => setAddModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: Edit User ─────────────────────────────────────────────────── */}
      {editUser && (
        <Modal
          isOpen={Boolean(editUser)}
          onClose={() => !isSaving && setEditUser(null)}
          title={`Edit User: ${editUser.name}`}
          size="md"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <Input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={roles.map((r) => ({ value: r.code, label: r.name }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <Select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" type="button" disabled={isSaving} onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="primary"   size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: Reset Password ────────────────────────────────────────────── */}
      {resetPwdUser && (
        <Modal
          isOpen={Boolean(resetPwdUser)}
          onClose={() => !isResetting && setResetPwdUser(null)}
          title={`Reset Password — ${resetPwdUser.name}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <KeyRound className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <p>The user will receive a new password. Share it securely. They should change it on first login.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Welcome@123"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" disabled={isResetting} onClick={() => setResetPwdUser(null)}>Cancel</Button>
              <Button variant="primary" size="sm" disabled={isResetting} onClick={handleResetPassword}>
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: Delete Confirm ────────────────────────────────────────────── */}
      {deleteUser && (
        <Modal
          isOpen={Boolean(deleteUser)}
          onClose={() => !isDeleting && setDeleteUser(null)}
          title="Delete User Account"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Confirm Account Deletion</p>
                <p className="text-rose-700/90 mt-0.5">
                  Are you sure you want to permanently delete <strong>{deleteUser.name}</strong>?
                  This action removes their access and cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" disabled={isDeleting} onClick={() => setDeleteUser(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" disabled={isDeleting} onClick={handleDelete}>
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UserManagementPage;
