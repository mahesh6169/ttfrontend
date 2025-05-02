export const ALLOWED_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
    'icloud.com', 'me.com', 'protonmail.com', 'live.com', 'msn.com',
    'bigpond.com', 'optusnet.com.au', 'iinet.net.au', 'internode.on.net',
    'tpg.com.au', 'aapt.net.au', 'telstra.com', 'dodo.com.au'
  ];
  
  const AU_SUFFIXES = ['.com.au', '.net.au', '.org.au', '.edu.au', '.gov.au'];
  
  export function isValidEmailDomain(email) {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1].toLowerCase();
    return (
      ALLOWED_EMAIL_DOMAINS.includes(domain) ||
      domain.endsWith('.au') ||
      AU_SUFFIXES.some((suffix) => domain.endsWith(suffix))
    );
  }
  
  export function isValidAustralianMobile(mobile) {
    const cleaned = mobile.replace(/\s+/g, '');
    return /^04\d{8}$/.test(cleaned);
  }
  
  export function isStrongPassword(password) {
    return (
      typeof password === 'string' &&
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }
  
  export function sanitizeInput(input) {
    if (!input) return '';
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Unified form validation for auth forms.
   * @param {Object} formData - The form fields
   * @param {'register'|'login'} mode - Mode of the form
   * @returns {Object} errors - Field-level validation errors
   */
  export function validateAuthForm(formData, mode) {
    if (!mode) throw new Error("Validation mode must be specified (e.g., 'login' or 'register')");
  
    const errors = {};
  
    // Common: Email
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email format is invalid';
    } else if (!isValidEmailDomain(formData.email)) {
      errors.email = 'Registration is restricted to recognized email IDs.';
    }
  
    // Common: Password
    if (!formData.password?.trim()) {
      errors.password = 'Password is required';
    }
  
    // Register-specific validations
    if (mode === 'register') {
      if (!formData.name?.trim()) {
        errors.name = 'Name is required';
      }
  
      if (formData.password && formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!isStrongPassword(formData.password)) {
        errors.password = 'Password must include uppercase, lowercase, and numbers';
      }
  
      if (!formData.confirmPassword?.trim()) {
        errors.confirmPassword = 'Confirm Password is required';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
  
      if (formData.mobile?.trim() && !isValidAustralianMobile(formData.mobile)) {
        errors.mobile = 'Please enter a valid Australian mobile number (e.g., 0412 345 678)';
      }
  
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'You must accept the Terms and Privacy Policy';
      }
  
      // Suburb validation
      const s = formData.suburb;
      if (
        !s?.name ||
        !s?.state ||
        !s?.postalCode ||
        !Array.isArray(s?.location?.coordinates) ||
        s.location.coordinates.length !== 2
      ) {
        errors.suburb = 'Please select a valid suburb from the suggestions';
      }
    }
  
    return errors;
  }
  
  