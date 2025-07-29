/**
 * Format number as Australian currency
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "$1,234.50")
 */
export const formatCurrency = (amount) => {
  // Handle null, undefined, or empty values
  if (amount === null || amount === undefined || amount === '') {
    return '$0.00';
  }

  // Convert to number if string
  const numAmount = parseFloat(amount);
  
  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return '$0.00';
  }

  // Use Intl.NumberFormat for proper Australian currency formatting
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * Format currency without the dollar sign (for input fields)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted number string (e.g., "1,234.50")
 */
export const formatCurrencyNoDollar = (amount) => {
  // Handle null, undefined, or empty values
  if (amount === null || amount === undefined || amount === '') {
    return '0.00';
  }

  // Convert to number if string
  const numAmount = parseFloat(amount);
  
  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return '0.00';
  }

  // Format with commas and 2 decimal places
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};