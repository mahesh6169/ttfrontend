// Thread rich-text helpers (featureplans/threads-rich-editor.md).
// Render rule: a description containing any of the allowlisted tags renders as rich HTML; content
// with none renders through the legacy line-break path unchanged. Plain-text consumers (SEO
// description, JSON-LD, search snippets) strip tags so they never print markup.

const ALLOWLISTED_TAG = /<(p|br|strong|em|u|s|ul|ol|li|a|h2|h3|div|img)(\s|\/|>)/i;

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

// Link text that is itself a web address (typed or pasted) gets tidied; words the writer chose
// ("click here", feature 1012) are never touched.
export const looksLikeUrl = (text) => {
  const t = String(text || '').trim();
  return /^(https?:\/\/|www\.)\S+$/i.test(t) || (/^\S+\.\S+$/.test(t) && !/\s/.test(t) && /\//.test(t));
};

/**
 * Rewrite each anchor whose visible text is a web address to its tidied display (href untouched),
 * and mark Google Maps links with the "map-link" class so the page shows a map pin before them.
 * Runs on already-sanitised thread HTML at render.
 * @param {string} html
 * @returns {string}
 */
export const tidyLinksInHtml = (html) => {
  if (!html || typeof html !== 'string') return html || '';
  return html.replace(
    /(<a\b)([^>]*?\bhref="([^"]*)"[^>]*>)([\s\S]*?)(<\/a>)/gi,
    (_m, start, rest, href, inner, close) => {
      const decodedHref = href.replace(/&amp;/g, '&');
      const open = isGoogleMapsUrl(decodedHref) ? `${start} class="map-link"${rest}` : start + rest;
      const innerText = inner.replace(/<[^>]*>/g, '');
      const text = looksLikeUrl(innerText) ? escapeHtml(tidyUrl(decodedHref)) : inner;
      return open + text + close;
    }
  );
};

// ---- Google Maps links (feature 1012 Map button) -----------------------------------------------
// Accepted: google.com/maps, google.com.au/maps (with or without www.), maps.google.*,
// maps.app.goo.gl (the app's share link) and goo.gl/maps.
export const isGoogleMapsUrl = (href) => {
  let u;
  try {
    u = new URL(String(href || '').trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const path = u.pathname.toLowerCase();
  if (host === 'maps.app.goo.gl') return true;
  if (host === 'goo.gl' && path.startsWith('/maps')) return true;
  if (/^maps\.google\.(com|com\.au|co\.in)$/.test(host)) return true;
  if (/^google\.(com|com\.au|co\.in)$/.test(host) && path.startsWith('/maps')) return true;
  return false;
};

/**
 * Turn what the writer typed into a safe https address, or explain why not.
 * "example.com" -> "https://example.com"; "http://..." is refused (https only).
 * @param {string} raw
 * @param {{ mapsOnly?: boolean }} [opts]
 * @returns {{ href?: string, error?: string }}
 */
export const normaliseLinkInput = (raw, { mapsOnly = false } = {}) => {
  const t = String(raw || '').trim();
  if (!t) return { error: 'Please enter a web address.' };
  if (/^http:\/\//i.test(t)) return { error: 'Only secure links starting with https:// are allowed.' };
  if (/^[a-z][a-z0-9+.-]*:/i.test(t) && !/^https:\/\//i.test(t)) {
    return { error: 'Only web addresses starting with https:// are allowed.' };
  }
  const href = /^https:\/\//i.test(t) ? t : `https://${t}`;
  let u;
  try {
    u = new URL(href);
  } catch {
    return { error: 'That does not look like a web address.' };
  }
  if (!u.hostname.includes('.')) return { error: 'That does not look like a web address.' };
  if (mapsOnly && !isGoogleMapsUrl(href)) {
    return { error: 'Please paste a Google Maps link (from Google Maps > Share > Copy link).' };
  }
  return { href };
};

// ---- Pictures inside a post (feature 1012) -----------------------------------------------------
export const THREAD_PICTURE_LIMIT = 10;

const decodeEntities = (t) =>
  String(t || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return m ? decodeEntities(m[1]) : '';
};

/** Pictures in one picture block's inner HTML: [{ src, alt, width, height }]. */
export const parsePictures = (innerHtml) =>
  (String(innerHtml || '').match(/<img\b[^>]*>/gi) || [])
    .map((tag) => ({
      src: attr(tag, 'src'),
      alt: attr(tag, 'alt'),
      width: parseInt(attr(tag, 'width'), 10) || null,
      height: parseInt(attr(tag, 'height'), 10) || null,
    }))
    .filter((p) => /^https:\/\//i.test(p.src));

/**
 * Split sanitised post HTML into the pieces the thread page renders in order:
 * { type: 'html', html } and { type: 'pictures', pictures: [...] }.
 * @param {string} html
 */
export const splitThreadContent = (html) => {
  const out = [];
  const src = String(html || '');
  const re = /<div data-pictures(?:="[^"]*")?>([\s\S]*?)<\/div>/gi;
  let last = 0;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push({ type: 'html', html: src.slice(last, m.index) });
    const pictures = parsePictures(m[1]);
    if (pictures.length) out.push({ type: 'pictures', pictures });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ type: 'html', html: src.slice(last) });
  return out.filter((s) => s.type !== 'html' || s.html.replace(/<[^>]*>|\s/g, '') !== '' || /<img/i.test(s.html));
};

/** A Cloudinary picture at a given width, in the best format the browser supports. */
export const sizedPictureUrl = (src, width) => {
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src || '')) return src;
  return src.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
};

/** srcset for a post picture: phones get ~400-800px, desktops ~1200px. */
export const pictureSrcSet = (src) =>
  [400, 800, 1200].map((w) => `${sizedPictureUrl(src, w)} ${w}w`).join(', ');

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
