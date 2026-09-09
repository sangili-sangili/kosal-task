import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Shield,
  RotateCw,
} from 'lucide-react';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles,
  selectUsers,
  selectUserPagination,
  selectUserFilters,
  selectUserRolesList,
  selectIsUsersLoading,
  selectUsersError,
  setFilters,
} from '../../store/slices/userSlice';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, formatRoleBadge } from '../../utils/formatters';
import Table from '../../components/tables/Table';
import Pagination from '../../components/tables/Pagination';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Modal from '../../components/modals/Modal';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';

export function UserManagementPage() {
  const dispatch = useDispatch();

  const users = useSelector(selectUsers);
  const pagination = useSelector(selectUserPagination);
  const filters = useSelector(selectUserFilters);
  const roles = useSelector(selectUserRolesList);
  const isLoading = useSelector(selectIsUsersLoading);
  const error = useSelector(selectUsersError);

  // Local search state for debouncing
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form handling for Create User
  const createForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      roleId: '',
      status: 'ACTIVE',
    },
  });

  // Form handling for Edit User
  const editForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      status: 'ACTIVE',
      roleId: '',
    },
  });

  // Fetch initial users and roles
  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchUsers({ search: debouncedSearch }));
  }, [dispatch, debouncedSearch]);

  const handleStatusChange = (status) => {
    dispatch(setFilters({ status }));
    dispatch(fetchUsers({ status, page: 1 }));
  };

  const handleSort = (sortBy, sortOrder) => {
    dispatch(fetchUsers({ sortBy, sortOrder }));
  };

  const handlePageChange = (newPage) => {
    dispatch(fetchUsers({ page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    dispatch(fetchUsers({ limit: newLimit, page: 1 }));
  };

  // Open Edit Modal with populated data
  const handleOpenEdit = (user) => {
    setEditUser(user);
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      status: user.status,
      roleId: user.roles?.[0]?.id || '',
    });
  };

  // Submit Create
  const handleCreateSubmit = async (data) => {
    const payload = {
      ...data,
      roleId: data.roleId ? Number(data.roleId) : undefined,
    };
    const result = await dispatch(createUser(payload));
    if (!result.error) {
      setCreateModalOpen(false);
      createForm.reset();
    }
  };

  // Submit Edit
  const handleEditSubmit = async (data) => {
    if (!editUser) return;
    const payload = {
      ...data,
      roleId: data.roleId ? Number(data.roleId) : undefined,
    };
    const result = await dispatch(updateUser({ id: editUser.id, data: payload }));
    if (!result.error) {
      setEditUser(null);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await dispatch(deleteUser(deleteId));
    setDeleteId(null);
  };

  // Table Columns Definition
  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: 'User',
        sortable: true,
        render: (_, row) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs">
              {row.firstName?.[0]}
              {row.lastName?.[0]}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {row.firstName} {row.lastName}
              </div>
              <div className="text-xs text-slate-500">{row.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'roles',
        title: 'Role',
        render: (_, row) => {
          const roleName = row.roles?.[0]?.name || 'CUSTOMER';
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${formatRoleBadge(
                roleName
              )}`}
            >
              <Shield className="w-3 h-3" />
              {roleName}
            </span>
          );
        },
      },
      {
        key: 'status',
        title: 'Status',
        sortable: true,
        render: (status) => {
          const badgeClass =
            status === 'ACTIVE'
              ? 'badge-active'
              : status === 'SUSPENDED'
              ? 'badge-suspended'
              : 'badge-inactive';
          return <span className={badgeClass}>{status}</span>;
        },
      },
      {
        key: 'lastLoginAt',
        title: 'Last Login',
        render: (val) => <span className="text-xs text-slate-500">{formatDate(val)}</span>,
      },
      {
        key: 'createdAt',
        title: 'Joined Date',
        sortable: true,
        render: (val) => <span className="text-xs text-slate-500">{formatDate(val)}</span>,
      },
      {
        key: 'actions',
        title: 'Actions',
        className: 'text-right',
        headerClassName: 'text-right',
        render: (_, row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              aria-label="Edit user"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteId(row.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              aria-label="Delete user"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: String(r.id), label: r.name })),
    [roles]
  );

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise RBAC user administration, credentials, and access control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={RotateCw}
            onClick={() => dispatch(fetchUsers())}
            isLoading={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={UserPlus}
            onClick={() => setCreateModalOpen(true)}
          >
            Add New User
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search by name or email address..."
            leftIcon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="w-full sm:w-48">
            <Select
              placeholder="All Statuses"
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {error ? (
        <ErrorState
          title="Could not retrieve user records"
          message={error}
          onRetry={() => dispatch(fetchUsers())}
        />
      ) : (
        <div className="space-y-3">
          <Table
            columns={columns}
            data={users}
            isLoading={isLoading}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
            emptyTitle="No users found"
            emptyDescription="Try adjusting your search filters or create a new user."
          />

          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Enterprise User"
        description="Create a new user with dedicated RBAC access permissions."
      >
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              error={createForm.formState.errors.firstName?.message}
              {...createForm.register('firstName', { required: 'First name is required' })}
            />
            <Input
              label="Last Name"
              required
              error={createForm.formState.errors.lastName?.message}
              {...createForm.register('lastName', { required: 'Last name is required' })}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
            })}
          />

          <Input
            label="Phone"
            {...createForm.register('phone')}
          />

          <Input
            label="Temporary Password"
            type="password"
            required
            helperText="Must be 8+ characters with uppercase and number"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
            })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assign Role"
              options={roleOptions}
              {...createForm.register('roleId')}
            />
            <Select
              label="Account Status"
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
              {...createForm.register('status')}
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createForm.formState.isSubmitting}
            >
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title={`Edit User: ${editUser?.firstName} ${editUser?.lastName}`}
        description="Update account profile details and role assignments."
      >
        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              error={editForm.formState.errors.firstName?.message}
              {...editForm.register('firstName', { required: 'First name is required' })}
            />
            <Input
              label="Last Name"
              required
              error={editForm.formState.errors.lastName?.message}
              {...editForm.register('lastName', { required: 'Last name is required' })}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            error={editForm.formState.errors.email?.message}
            {...editForm.register('email', { required: 'Email is required' })}
          />

          <Input
            label="Phone"
            {...editForm.register('phone')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Role"
              options={roleOptions}
              {...editForm.register('roleId')}
            />
            <Select
              label="Status"
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
              {...editForm.register('status')}
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={editForm.formState.isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Soft-Delete User Record"
        message="Are you sure you want to delete this user? The account will be deactivated and marked as soft-deleted in the database."
        confirmText="Yes, Delete User"
        isDestructive
      />
    </div>
  );
}

export default UserManagementPage;
