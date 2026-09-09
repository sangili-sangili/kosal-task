import { useSelector, useDispatch } from 'react-redux';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  loginUser,
  registerUser,
  logoutUser,
} from '../store/slices/authSlice';
import { ROLES } from '../constants/roles';

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const login = (credentials) => dispatch(loginUser(credentials)).unwrap();
  const register = (data) => dispatch(registerUser(data)).unwrap();
  const logout = () => dispatch(logoutUser());

  const hasRole = (allowedRoles = []) => {
    if (!user || !user.roles) return false;
    if (user.roles.includes(ROLES.SUPER_ADMIN)) return true;
    return allowedRoles.some((role) => user.roles.includes(role));
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    if (user.roles?.includes(ROLES.SUPER_ADMIN)) return true;
    return user.permissions.includes(permission);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
  };
}
