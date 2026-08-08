// Shared field validators for the create-event wizard - see featureplans/events-wizard-validation.md.
// Pure functions used inline by the step components (Layer 1) so every card blocks its own Done.

// Normalise an Australian mobile then validate it (D6): strip spaces/dashes/brackets/dots; turn a
// +61 / 0061 / 61 prefix into a leading 0; must end up as 04 followed by 8 digits. Landlines rejected.
export const normalizeAuMobile = (raw) => {
  if (!raw && raw !== 0) return '';
  let s = String(raw).replace(/[\s\-().]/g, '');
  if (s.startsWith('+61')) s = '0' + s.slice(3);
  else if (s.startsWith('0061')) s = '0' + s.slice(4);
  else if (s.startsWith('61') && s.length === 11) s = '0' + s.slice(2);
  return s;
};

export const isValidAuMobile = (raw) => /^04\d{8}$/.test(normalizeAuMobile(raw));

// A valid https:// URL (D7). Used for the promo link, organiser website, and social links.
export const isHttpsUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' && !!u.hostname && u.hostname.includes('.');
  } catch {
    return false;
  }
};

// Basic email shape (validated only when a field is filled).
export const isValidEmail = (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
