import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import PermissionGuard from './PermissionGuard';
import Loader from '../components/common/Loader';

// Lazy-loaded pages for optimal bundle splitting
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const LeadListPage = lazy(() => import('../pages/leads/LeadListPage'));
const LeadDetailPage = lazy(() => import('../pages/leads/LeadDetailPage'));
const LeadCreatePage = lazy(() => import('../pages/leads/LeadCreatePage'));
const LeadEditPage = lazy(() => import('../pages/leads/LeadEditPage'));
const ProjectListPage = lazy(() => import('../pages/properties/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../pages/properties/ProjectDetailPage'));
const UnitListPage = lazy(() => import('../pages/properties/UnitListPage'));
const BookingListPage = lazy(() => import('../pages/bookings/BookingListPage'));
const BookingDetailPage = lazy(() => import('../pages/bookings/BookingDetailPage'));
const BookingCreatePage = lazy(() => import('../pages/bookings/BookingCreatePage'));
const UserManagementPage = lazy(() => import('../pages/users/UserManagementPage'));
const RoleManagementPage = lazy(() => import('../pages/roles/RoleManagementPage'));
const AuditLogsPage = lazy(() => import('../pages/audit/AuditLogsPage'));
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<Loader fullPage text="Loading CRM Application..." />}>
      <Routes>
        {/* Public Authentication Pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Real Estate CRM Main Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Leads CRM */}
          <Route path="/leads" element={<LeadListPage />} />
          <Route path="/leads/new" element={<LeadCreatePage />} />
          <Route path="/leads/create" element={<LeadCreatePage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/leads/:id/edit" element={<LeadEditPage />} />

          {/* Property & Inventory */}
          <Route path="/properties" element={<ProjectListPage />} />
          <Route path="/properties/new" element={<ProjectListPage defaultOpenCreate={true} />} />
          <Route path="/properties/create" element={<ProjectListPage defaultOpenCreate={true} />} />
          <Route path="/properties/:id" element={<ProjectDetailPage />} />
          <Route path="/units" element={<UnitListPage />} />

          {/* Bookings Management */}
          <Route path="/bookings" element={<BookingListPage />} />
          <Route path="/bookings/new" element={<BookingCreatePage />} />
          <Route path="/bookings/create" element={<BookingCreatePage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />

          {/* User Management & Security Master (Protected by PermissionGuard) */}
          <Route
            path="/users"
            element={
              <PermissionGuard requiredPermission="user:read" moduleName="User Management">
                <UserManagementPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/roles"
            element={
              <PermissionGuard requiredPermission="role:read" moduleName="Roles Master">
                <RoleManagementPage />
              </PermissionGuard>
            }
          />

          {/* Activity & Audit Logs (Protected by PermissionGuard) */}
          <Route
            path="/audit"
            element={
              <PermissionGuard requiredPermission="audit:read" moduleName="Activity & Audit Logs">
                <AuditLogsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/activity"
            element={
              <PermissionGuard requiredPermission="audit:read" moduleName="Activity & Audit Logs">
                <AuditLogsPage />
              </PermissionGuard>
            }
          />
        </Route>

        {/* Fallback 404 */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
