// Tiny, dependency-free frontmatter parser for the blog markdown files.
// Splits a leading `--- ... ---` block of simple `key: value` pairs off the
// top of a markdown string. Values may be optionally quoted. Everything after
// the closing `---` is returned as the body. No YAML nesting/arrays — the
// blog post header only uses flat string fields, so this is enough.
export function parseFrontmatter(raw) {
  const meta = {};
  let body = raw || '';

  const match = /^﻿?---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/.exec(body);
  if (match) {
    body = body.slice(match[0].length);
    for (const line of match[1].split(/\r?\n/)) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) meta[key] = value;
    }
  }

  return { meta, body };
}
