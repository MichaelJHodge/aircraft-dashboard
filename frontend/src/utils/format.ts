/**
 * Utility Functions
 * Shared helpers for formatting and data manipulation
 */

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Format a number with thousands separators
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Get phase color for status indicators
 */
export const getPhaseColor = (phase: string): string => {
  const colorMap: Record<string, string> = {
    Manufacturing: '#6E8DFF',
    'Ground Testing': '#4E9CFF',
    'Flight Testing': '#42B6FF',
    Certification: '#E88B23',
    'Ready for Delivery': '#3AB7A8',
    Delivered: '#3AB7A8',
  };

  return colorMap[phase] || '#6B7280';
};

/**
 * Get status color for milestone status
 */
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    completed: '#3AB7A8',
    'in-progress': '#E88B23',
    upcoming: '#569AFF',
  };

  return colorMap[status] || '#6B7280';
};

export type ProgressBand = 'critical' | 'warning' | 'caution' | 'good' | 'complete';

export const getProgressBand = (value: number): ProgressBand => {
  const progress = Math.max(0, Math.min(100, value));

  if (progress >= 100) return 'complete';
  if (progress >= 75) return 'good';
  if (progress >= 50) return 'caution';
  if (progress >= 25) return 'warning';
  return 'critical';
};

/**
 * Calculate days until date
 */
export const getDaysUntil = (dateString: string): number => {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format days until with appropriate label
 */
export const formatDaysUntil = (dateString: string): string => {
  const days = getDaysUntil(dateString);

  if (days < 0) {
    return `${Math.abs(days)} days ago`;
  } else if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Tomorrow';
  } else {
    return `${days} days`;
  }
};
