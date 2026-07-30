// Thread rich-text helpers (featureplans/threads-rich-editor.md).
// Render rule: a description containing any of the allowlisted tags renders as rich HTML; content
// with none renders through the legacy line-break path unchanged. Plain-text consumers (SEO
// description, JSON-LD, search snippets) strip tags so they never print markup.

const ALLOWLISTED_TAG = /<(p|br|strong|em|u|s|ul|ol|li|a)(\s|\/|>)/i;

/** True when the description is rich HTML (has an allowlisted tag) rather than legacy plain text. */
export const isRichHtml = (s) => typeof s === 'string' && ALLOWLISTED_TAG.test(s);

// Auto-linked URLs are tidied for DISPLAY only (featureplans/threads-url-display.md). The stored href
// is always the complete original URL; only the visible text shortens. Tunable in one place:
export const URL_DISPLAY_BUDGET = 60;

/**
 * Tidied display text for a link href: strip the scheme and a leading www., keep the whole domain
 * always, and cap the total shown text at URL_DISPLAY_BUDGET, appending "..." when longer.
 * @param {string} href
 * @returns {string}
 */
export const tidyUrl = (href) => {
  if (!href || typeof href !== 'string') return href || '';
  const s = href.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  if (s.length <= URL_DISPLAY_BUDGET) return s; // fits the budget -> show it all, no dots

  const slash = s.indexOf('/');
  const domain = slash === -1 ? s : s.slice(0, slash);
  const rest = slash === -1 ? '' : s.slice(slash); // path + query, with its leading '/'

  // The domain is never cut (outranks the budget): an over-budget domain shows in full, "..." any path.
  if (domain.length >= URL_DISPLAY_BUDGET) return domain + (rest ? '...' : '');

  const room = URL_DISPLAY_BUDGET - domain.length - 3; // reserve 3 for the trailing "..."
  if (room <= 0) return domain + '...';
  return domain + rest.slice(0, room) + '...';
};

const escapeHtml = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Rewrite every anchor's visible text to its tidied display while leaving the href untouched.
 * Runs on already-sanitised thread HTML at render, so it also tidies legacy full-URL-text links.
 * @param {string} html
 * @returns {string}
 */
export const tidyLinksInHtml = (html) => {
  if (!html || typeof html !== 'string') return html || '';
  return html.replace(
    /(<a\b[^>]*?\bhref="([^"]*)"[^>]*>)([\s\S]*?)(<\/a>)/gi,
    (_m, open, href, _inner, close) => open + escapeHtml(tidyUrl(href)) + close
  );
};

/** Plain, single-line text of a description (tags removed, common entities decoded) for SEO/snippets. */
export const stripHtmlToText = (s) => {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, ' ') // block ends -> a space so words don't run together
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};
