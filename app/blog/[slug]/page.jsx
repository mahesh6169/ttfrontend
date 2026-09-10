import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { simpleMarkdownToHtml } from '@/utils/markdownToHtml';
import { parseFrontmatter } from '@/utils/parseFrontmatter';
import { META_DEFAULTS } from '@/utils/slugUtils';
import { currentIndexingPolicy } from '@/utils/seo/indexingPolicy';
import { FaFacebookF, FaWhatsapp, FaShareAlt } from 'react-icons/fa';
import BlogLightbox from '@/components/blog/BlogLightbox';

// Placeholder the author leaves in a .md file until they paste a real image URL.
const IMAGE_PLACEHOLDER = 'PASTE_CLOUDINARY_IMAGE_URL_HERE';

function postFilePath(slug) {
  return path.join(process.cwd(), 'public', 'blog', `${slug}.md`);
}

// Slugs come straight from the URL — keep them to safe filename chars so a slug
// can never walk out of public/blog.
function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug);
}

async function getPost(slug) {
  if (!isValidSlug(slug)) return null;
  try {
    const filePath = postFilePath(slug);
    const [raw, stat] = await Promise.all([
      fs.readFile(filePath, 'utf-8'),
      fs.stat(filePath),
    ]);
    // Strip HTML comments (<!-- ... -->) so author notes in the .md never render.
    const cleaned = raw.replace(/<!--[\s\S]*?-->/g, '');
    const { meta, body } = parseFrontmatter(cleaned);
    return { meta, body, mtime: stat.mtimeMs };
  } catch {
    return null;
  }
}

// Cloudinary delivery tuning for hero / social images: cap width at 1200px and
// keep the image's own aspect ratio (c_limit = scale down, never crop, never
// upscale) so designed banners keep their logo/CTA intact; smart-compress
// (~200 KB, under WhatsApp's 600 KB cap); force JPG — f_auto could serve WebP,
// which WhatsApp/FB reject for og:image (see designGuides/SEO/Social-SEO.md).
// Injected after `/upload/` so an author can paste a plain Cloudinary URL.
const CLOUDINARY_TRANSFORM = 'w_1200,c_limit,q_auto:good,f_jpg';

function optimizeCloudinaryUrl(url) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  const [prefix, rest] = url.split('/upload/');
  if (rest.startsWith(CLOUDINARY_TRANSFORM)) return url; // already tuned
  return `${prefix}/upload/${CLOUDINARY_TRANSFORM}/${rest}`;
}

function resolveHeroImage(meta) {
  const img = meta.heroImage;
  if (!img || img === IMAGE_PLACEHOLDER) return null;
  return optimizeCloudinaryUrl(img);
}

// Per-post metadata — the "Detail page" archetype from designGuides/SEO/page-SEO.md
// § 4.C. Title stays bare so the root layout's `%s | Desify` template composes it;
// full OpenGraph + Twitter blocks for the WhatsApp / Facebook preview; canonical
// required. Falls back to the default site image when no hero is set yet.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Article Not Found',
      description: META_DEFAULTS.defaultDescription,
      robots: { index: false, follow: true },
    };
  }

  const { meta, mtime } = post;
  const title = meta.title || 'Article';
  const description = meta.description || META_DEFAULTS.defaultDescription;
  const siteUrl = META_DEFAULTS.siteUrl;
  const url = `${siteUrl}/blog/${slug}`;

  let image =
    resolveHeroImage(meta) ||
    process.env.NEXT_PUBLIC_FALLBACK_BLOG_IMAGE_URL ||
    process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE_URL;

  if (image && !image.startsWith('http')) {
    image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
  }

  // Cache-bust off the file's mtime so an edited post refreshes its preview
  // instead of serving a stale cached image (WhatsApp caches aggressively).
  if (image) {
    const separator = image.includes('?') ? '&' : '?';
    image = `${image}${separator}v=${Math.round(mtime)}`;
  }

  const { index: shouldIndex, follow: shouldFollow } = currentIndexingPolicy();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: META_DEFAULTS.siteName,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : [],
    },
    robots: { index: shouldIndex, follow: shouldFollow },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const { meta, body } = post;
  const hero = resolveHeroImage(meta);
  const html = simpleMarkdownToHtml(body);
  const ctaText = meta.ctaText || 'Explore Desify';
  const ctaLink = meta.ctaLink || '/';

  // Share the post's own canonical /blog/<slug> URL (built from the site URL,
  // never window.location) so shared links always point at production.
  const shareUrl = `${META_DEFAULTS.siteUrl}/blog/${slug}`;
  const iconBtn =
    'w-7 h-7 p-1 rounded-full flex items-center justify-center transition-colors duration-200';

  return (
    <article>
      {hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero}
          alt={meta.title || ''}
          className="w-full h-auto rounded-lg mb-6"
        />
      ) : (
        <div className="w-full aspect-[1200/630] rounded-lg mb-6 bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-center text-slate-400 text-sm px-4">
          Hero image goes here — set <code className="mx-1">heroImage</code> in the .md file
        </div>
      )}

      <h1 className="text-balance text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 text-center leading-tight mb-4">
        {meta.title}
      </h1>

      <div className="mb-6 flex justify-center">
        <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <FaShareAlt className="w-3.5 h-3.5 text-slate-500 mr-0.5" aria-hidden="true" />
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            className={`${iconBtn} bg-[#1877F2] hover:bg-[#166FE5] text-white`}
          >
            <FaFacebookF className="w-3.5 h-3.5" />
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${meta.title}\n${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className={`${iconBtn} bg-[#25D366] hover:bg-[#20BA5A] text-white`}
          >
            <FaWhatsapp className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <BlogLightbox
        html={html}
        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-slate-800 prose-headings:font-semibold prose-p:text-slate-700 prose-li:text-slate-700 prose-a:text-teal-700 hover:prose-a:text-teal-800"
      />

      <div className="mt-8 flex justify-center">
        <Link
          href={ctaLink}
          className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-6 py-3 text-white font-semibold hover:bg-teal-800 transition-colors"
        >
          {ctaText}
        </Link>
      </div>
    </article>
  );
}
