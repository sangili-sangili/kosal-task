import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    toasts: [], // array of { id, type: 'success' | 'error' | 'info' | 'warning', message, duration }
  },
  reducers: {
    addToast: (state, action) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      state.toasts.push({
        id,
        type: action.payload.type || 'info',
        message: action.payload.message,
        duration: action.payload.duration || 4000,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearAllToasts } = notificationSlice.actions;
export const selectToasts = (state) => state.notification.toasts;
export default notificationSlice.reducer;
