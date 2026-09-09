import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useCrm } from '../context/CrmContext';
import { userService } from '../services/userService';

/**
 * Hook to evaluate role-based permissions dynamically from MySQL roles
 */
export function usePermissions() {
  const { user } = useAuth();
  const { currentUser } = useCrm();
  const activeUser = user || currentUser;

  const [rolesList, setRolesList] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_roles_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(rolesList.length === 0);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await userService.getRoles();
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setRolesList(list);
        localStorage.setItem('crm_roles_v2', JSON.stringify(list));
      }
    } catch (err) {
      console.warn('Could not fetch role definitions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();

    const handleRoleChange = () => {
      fetchRoles();
    };

    window.addEventListener('rolePermissionsChanged', handleRoleChange);
    return () => window.removeEventListener('rolePermissionsChanged', handleRoleChange);
  }, [fetchRoles]);

  const isAdmin = Boolean(
    activeUser?.role === 'ADMIN' ||
    activeUser?.role === 'SUPER_ADMIN' ||
    activeUser?.role?.code === 'ADMIN'
  );

  const currentRoleCode = activeUser?.role?.code || activeUser?.role || 'SALES';

  const userPermissions = useMemo(() => {
    if (isAdmin) return ['*'];
    const matched = rolesList.find(
      (r) => r.code === currentRoleCode || r.id === currentRoleCode
    );
    if (matched && Array.isArray(matched.permissions)) {
      return matched.permissions;
    }
    // Fallback if not loaded yet: check localStorage cached permissions
    try {
      const cached = localStorage.getItem(`crm_role_permissions_${currentRoleCode}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }, [isAdmin, currentRoleCode, rolesList]);

  const hasPermission = useCallback((permissionKey) => {
    if (isAdmin) return true;
    if (!permissionKey) return true;
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(permissionKey);
  }, [isAdmin, userPermissions]);

  const canViewAudit = useMemo(() => {
    return isAdmin || hasPermission('audit:read');
  }, [isAdmin, hasPermission]);

  return {
    activeUser,
    isAdmin,
    currentRoleCode,
    rolesList,
    userPermissions,
    hasPermission,
    canViewAudit,
    loading,
    refreshPermissions: fetchRoles,
  };
}

export default usePermissions;
