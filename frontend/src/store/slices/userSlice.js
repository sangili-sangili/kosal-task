import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { addToast } from './notificationSlice';

const initialState = {
  users: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  },
  roles: [],
  isLoading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (customParams = {}, { getState, rejectWithValue }) => {
    try {
      const { user } = getState();
      const params = {
        page: customParams.page || user.pagination.page,
        limit: customParams.limit || user.pagination.limit,
        search: customParams.search !== undefined ? customParams.search : user.filters.search,
        status: customParams.status !== undefined ? customParams.status : user.filters.status,
        sortBy: customParams.sortBy || user.filters.sortBy,
        sortOrder: customParams.sortOrder || user.filters.sortOrder,
      };

      const response = await userService.getUsers(params);
      return {
        users: response.data,
        pagination: response.pagination,
        filters: {
          search: params.search,
          status: params.status,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const response = await userService.createUser(userData);
      dispatch(addToast({ type: 'success', message: 'User created successfully!' }));
      dispatch(fetchUsers({ page: 1 }));
      return response.data;
    } catch (error) {
      dispatch(addToast({ type: 'error', message: error.message || 'Failed to create user' }));
      return rejectWithValue(error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      const response = await userService.updateUser(id, data);
      dispatch(addToast({ type: 'success', message: 'User updated successfully!' }));
      dispatch(fetchUsers());
      return response.data;
    } catch (error) {
      dispatch(addToast({ type: 'error', message: error.message || 'Failed to update user' }));
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await userService.deleteUser(id);
      dispatch(addToast({ type: 'success', message: 'User deleted successfully' }));
      dispatch(fetchUsers());
      return id;
    } catch (error) {
      dispatch(addToast({ type: 'error', message: error.message || 'Failed to delete user' }));
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRoles = createAsyncThunk('user/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const response = await userService.getRoles();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
        state.filters = action.payload.filters;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // fetchRoles
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      });
  },
});

export const { setFilters, resetFilters } = userSlice.actions;

export const selectUsers = (state) => state.user.users;
export const selectUserPagination = (state) => state.user.pagination;
export const selectUserFilters = (state) => state.user.filters;
export const selectUserRolesList = (state) => state.user.roles;
export const selectIsUsersLoading = (state) => state.user.isLoading;
export const selectUsersError = (state) => state.user.error;

export default userSlice.reducer;
