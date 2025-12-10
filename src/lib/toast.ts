import toast from 'react-hot-toast';

export const showSuccessToast = (message: string) => {
  return toast.success(message);
};

export const showErrorToast = (message: string) => {
  return toast.error(message);
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

export const showCustomToast = (message: string, type: 'success' | 'error' | 'loading' = 'success') => {
  switch (type) {
    case 'success':
      return toast.success(message);
    case 'error':
      return toast.error(message);
    case 'loading':
      return toast.loading(message);
    default:
      return toast(message);
  }
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
  toast.dismiss();
};
