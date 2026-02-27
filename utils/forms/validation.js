export const ALLOWED_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
    'icloud.com', 'me.com', 'protonmail.com', 'live.com', 'msn.com',
    'bigpond.com', 'optusnet.com.au', 'iinet.net.au', 'internode.on.net',
    'tpg.com.au', 'aapt.net.au', 'telstra.com', 'dodo.com.au',
    'ajithkumarphotography.com'
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
      errors.email = 'To reduce spam, registration is restricted to recognized email domains.';
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
        // !s?.postalCode ||  // Postal code is now optional
        !Array.isArray(s?.location?.coordinates) ||
        s.location.coordinates.length !== 2
      ) {
        errors.suburb = 'Please select a valid location from the suggestions';
      }
    }
  
    return errors;
  }
  
  export function validateContactForm(formData) {
    const errors = {};
  
    const titlePattern = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
    const namePattern = /^[a-zA-Z\s'-]+$/;
  
    // Title
    if (!formData.title?.trim()) {
      errors.title = 'Subject/title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or fewer';
    } else if (!titlePattern.test(formData.title)) {
      errors.title = 'Title must only contain letters, numbers, and basic punctuation';
    }
  
    // Name
    if (!formData.senderName?.trim()) {
      errors.senderName = 'Name is required';
    } else if (formData.senderName.length > 20) {
      errors.senderName = 'Name must be 20 characters or fewer';
    } else if (!namePattern.test(formData.senderName)) {
      errors.senderName = 'Name must only contain letters, spaces, hyphens, or apostrophes';
    }
  
    // Email
    if (!formData.senderEmail?.trim()) {
      errors.senderEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.senderEmail)) {
      errors.senderEmail = 'Email format is invalid';
    } else if (!isValidEmailDomain(formData.senderEmail)) {
      errors.senderEmail = 'Please use a valid email provider';
    }
  
    // Message
    if (!formData.message?.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.length > 1000) {
      errors.message = 'Message should not exceed 1000 characters';
    }
  
    // Mobile (optional but validated if provided)
    if (formData.mobile && formData.mobile.trim()) {
      const cleanedMobile = formData.mobile.replace(/\s+/g, '');
      if (!/^(\+61|0)?4\d{8}$/.test(cleanedMobile)) {
        errors.mobile = 'Please enter a valid Australian mobile number';
      }
    }

    // Category
    // Category
if (!formData.category?.trim()) {
  errors.category = 'Category is required';
} else if (
  formData.category === 'Other' ||
  (formData.category && !['Feature Request', 'Advertisement', 'Technical Support', 'Bug Report'].includes(formData.category))
) {
  // If user entered a custom category (like Other), validate it like title
  if (formData.category.length > 100) {
    errors.category = 'Category (Other) must be 100 characters or fewer';
  } else if (!/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(formData.category)) {
    errors.category = 'Category must only contain letters, numbers, and basic punctuation';
  }
}

  
    return errors;
  }
  
  
  export function validateReportForm(formData) {
    const errors = {};

    const namePattern = /^[a-zA-Z\s'-]+$/;
    const validReasons = ['spam', 'fraud', 'misleading', 'outdated', 'inappropriate', 'other'];

    // Name
    if (!formData.senderName?.trim()) {
      errors.senderName = 'Name is required';
    } else if (formData.senderName.length > 20) {
      errors.senderName = 'Name must be 20 characters or fewer';
    } else if (!namePattern.test(formData.senderName)) {
      errors.senderName = 'Name must only contain letters, spaces, hyphens, or apostrophes';
    }

    // Email
    if (!formData.senderEmail?.trim()) {
      errors.senderEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.senderEmail)) {
      errors.senderEmail = 'Email format is invalid';
    } else if (!isValidEmailDomain(formData.senderEmail)) {
      errors.senderEmail = 'Please use a valid email provider';
    }

    // Reason
    if (!formData.reason?.trim()) {
      errors.reason = 'Please select a reason';
    } else if (!validReasons.includes(formData.reason)) {
      errors.reason = 'Please select a valid reason';
    }

    // Message (optional, but validate length if provided)
    if (formData.message?.trim() && formData.message.length > 1000) {
      errors.message = 'Message should not exceed 1000 characters';
    }

    return errors;
  }

  export function validateRemovalForm(formData) {
    const errors = {};

    const namePattern = /^[a-zA-Z\s'-]+$/;

    // Name
    if (!formData.senderName?.trim()) {
      errors.senderName = 'Name is required';
    } else if (formData.senderName.length > 20) {
      errors.senderName = 'Name must be 20 characters or fewer';
    } else if (!namePattern.test(formData.senderName)) {
      errors.senderName = 'Name must only contain letters, spaces, hyphens, or apostrophes';
    }

    // Email
    if (!formData.senderEmail?.trim()) {
      errors.senderEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.senderEmail)) {
      errors.senderEmail = 'Email format is invalid';
    } else if (!isValidEmailDomain(formData.senderEmail)) {
      errors.senderEmail = 'Please use a valid email provider';
    }

    // Message (optional, but validate length if provided)
    if (formData.message?.trim() && formData.message.length > 1000) {
      errors.message = 'Message should not exceed 1000 characters';
    }

    return errors;
  }
  