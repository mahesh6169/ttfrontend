// Build schema.org `DiscussionForumPosting` JSON-LD for a forum thread page.
// This is the schema Google uses for forum content — the question body (`text`)
// is the main indexable content. Returns a plain object (or null) to
// JSON.stringify into a <script> tag.
import { stripHtmlToText } from './richText';

function pickImage(thread) {
  return (
    thread.ogImageUrl ||
    thread.images?.[0]?.ogImageUrl ||
    thread.images?.[0]?.url ||
    undefined
  );
}

function toIso(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function buildThreadJsonLd(thread, url) {
  if (!thread) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: thread.title,
    url,
  };

  // JSON-LD text is plain indexable content, never markup.
  if (thread.question) {
    const text = stripHtmlToText(thread.question);
    if (text) jsonLd.text = text;
  }

  const datePosted = toIso(thread.createdAt);
  if (datePosted) jsonLd.datePosted = datePosted;

  // Author only when the poster filled in author details (no account-name fallback).
  if (thread.author?.name) {
    jsonLd.author = { '@type': 'Person', name: thread.author.name };
  }

  const image = pickImage(thread);
  if (image) jsonLd.image = image;

  if (thread.category) jsonLd.about = thread.category;

  return jsonLd;
}
