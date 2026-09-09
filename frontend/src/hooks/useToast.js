import { useDispatch } from 'react-redux';
import { addToast, removeToast } from '../store/slices/notificationSlice';

export function useToast() {
  const dispatch = useDispatch();

  return {
    success: (message, duration) => dispatch(addToast({ type: 'success', message, duration })),
    error: (message, duration) => dispatch(addToast({ type: 'error', message, duration })),
    info: (message, duration) => dispatch(addToast({ type: 'info', message, duration })),
    warning: (message, duration) => dispatch(addToast({ type: 'warning', message, duration })),
    remove: (id) => dispatch(removeToast(id)),
  };
}
