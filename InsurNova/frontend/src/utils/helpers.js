export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  const statusColors = {
    ACTIVE: 'success',
    APPROVED: 'success',
    PAID: 'success',
    PENDING: 'warning',
    PROCESSING: 'info',
    REJECTED: 'danger',
    FRAUD_DETECTED: 'danger',
    EXCLUDED: 'danger',
    INACTIVE: 'gray',
    CANCELLED: 'gray',
  };
  return statusColors[status] || 'gray';
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};

export const formatEventType = (type) => {
  if (!type || type === 'ANY') {
    return 'FLOOD';
  }
  if (type === 'PANDEMIC') {
    return 'PANDEMIC (50% Payout)';
  }
  return type;
};
