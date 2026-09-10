#!/usr/bin/env node
// Plan: featureplans/fix-shared-environment-indexing.md - AC11 (production post-deploy smoke check).
// Run after every production deploy: node scripts/check-production-seo.mjs
// Fails (non-zero exit) on any noindex instruction, non-desify canonical, a telugufy URL, a
// non-200 response, or a missing title/description/H1 on the homepage or any vertical landing.

const PRODUCTION_ORIGIN = 'https://desify.com.au';
const PAGES = ['/', '/events', '/listings', '/deals', '/threads', '/coupons'];

function extract(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}

function metaRobotsContent(html) {
  return (
    extract(html, /<meta[^>]*name="robots"[^>]*content="([^"]*)"/i) ||
    extract(html, /<meta[^>]*content="([^"]*)"[^>]*name="robots"/i)
  );
}

function canonicalHref(html) {
  return (
    extract(html, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i) ||
    extract(html, /<link[^>]*href="([^"]*)"[^>]*rel="canonical"/i)
  );
}

function titleText(html) {
  return extract(html, /<title[^>]*>([^<]*)<\/title>/i);
}

function metaDescriptionContent(html) {
  return (
    extract(html, /<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
    extract(html, /<meta[^>]*content="([^"]*)"[^>]*name="description"/i)
  );
}

function hasH1(html) {
  return /<h1[^>]*>/i.test(html);
}

async function checkPage(pagePath) {
  const url = `${PRODUCTION_ORIGIN}${pagePath}`;
  const failures = [];
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    return [`${url}: request failed - ${err.message}`];
  }
  if (res.status !== 200) failures.push(`${url}: expected 200, got ${res.status}`);
  const html = await res.text();

  const robots = metaRobotsContent(html);
  if (robots && /noindex/i.test(robots)) failures.push(`${url}: robots meta says noindex (${robots})`);

  const canonical = canonicalHref(html);
  if (!canonical) failures.push(`${url}: missing canonical link`);
  else if (!canonical.startsWith(PRODUCTION_ORIGIN)) failures.push(`${url}: canonical is not a desify URL (${canonical})`);

  if (html.toLowerCase().includes('telugufy')) failures.push(`${url}: page mentions telugufy`);

  const title = titleText(html);
  if (!title || !title.trim()) failures.push(`${url}: missing title`);

  const description = metaDescriptionContent(html);
  if (!description || !description.trim()) failures.push(`${url}: missing meta description`);

  if (!hasH1(html)) failures.push(`${url}: missing H1`);

  return failures;
}

async function main() {
  const allFailures = [];
  for (const pagePath of PAGES) {
    const failures = await checkPage(pagePath);
    allFailures.push(...failures);
  }

  if (allFailures.length > 0) {
    console.error('Production SEO smoke check FAILED:');
    for (const f of allFailures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log(`Production SEO smoke check passed: ${PAGES.length} pages OK on ${PRODUCTION_ORIGIN}`);
}

main();
