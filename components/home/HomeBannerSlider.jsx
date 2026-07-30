'use client';

// Home-page promo banner carousel.
//
// Each slide is a COMPOSED banner: a text-free illustration on the left + real
// coded text on the right (headline + check-bullets). Text lives in code (not
// baked into the image) so it is always crisp, editable, and SEO/accessible.
//
// To add / change / remove a banner, edit the SLIDES array below. Each slide:
//   image        - path/URL of the ILLUSTRATION only (no text). A local file in
//                  /public/banners works best (transparent PNG). Cloudinary URLs
//                  also work. Optional; if omitted the text fills the width.
//   imageWidth   - intrinsic pixel width of the image  (required when image set)
//   imageHeight  - intrinsic pixel height of the image (required when image set)
//   imageAlt     - accessibility text describing the illustration
//   href         - internal link the whole banner points to (same tab)
//   headline     - bold teal headline
//   bullets      - array of { Icon, text, link? }: react-icon + short line, plus
//                  an optional { label, href } shown as an inline "more info" link
//
// next/image auto-serves optimized WebP/AVIF at the right size, so the source
// file can stay full-resolution.
//
// If SLIDES is empty the component renders nothing (the space collapses).
// Rotation + dots only appear once there is more than one slide.

import Link from 'next/link';
import Image from 'next/image';
import Slider from 'react-slick';
import {
  HiMagnifyingGlass,
  HiBell,
  HiBriefcase,
  HiUserGroup,
  HiCurrencyDollar,
  HiSparkles,
} from 'react-icons/hi2';
import 'slick-carousel/slick/slick.css';

// One slide set per placement. Reuse the component anywhere by passing the
// matching `placement` string, e.g. <HomeBannerSlider placement="events" />.
const SLIDE_SETS = {
  home: [
    {
      image: '/banners/storefront.png',
      imageWidth: 1250,
      imageHeight: 691,
      imageAlt: 'Illustration of a local shopfront',
      href: '/listings/',
      headline: 'Register Your Business Free',
      bullets: [
        { Icon: HiMagnifyingGlass, text: 'Get discovered by local customers' },
        { Icon: HiBell, text: 'Receive Wanted Ad alerts' },
        { Icon: HiBriefcase, text: 'Turn enquiries into jobs' },
      ],
    },
  ],

  events: [
    {
      image: '/banners/rsvpevent.png',
      imageWidth: 1147,
      imageHeight: 762,
      imageAlt: 'Illustration of a community event',
      href: '/events/add',
      headline: 'Promote & Create Your Next Event',
      bullets: [
        { Icon: HiUserGroup, text: 'Create RSVP events for free' },
        {
          Icon: HiCurrencyDollar,
          text: 'Paid events: just 2% + $0.80 per ticket',
        },
        {
          Icon: HiSparkles,
          text: 'Attendee registration, email alerts, live chat & QR check-in',
          link: { label: 'click here for details', href: '/tickets' },
        },
      ],
    },
  ],
};

const HomeBannerSlider = ({ placement = 'home' }) => {
  const SLIDES = SLIDE_SETS[placement] || [];
  if (!SLIDES.length) return null;

  const multiple = SLIDES.length > 1;
  const settings = {
    dots: multiple,
    arrows: false,
    infinite: multiple,
    autoplay: multiple,
    autoplaySpeed: 5000,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    pauseOnHover: true,
    // Custom dot avoids depending on the slick icon-font (slick-theme.css).
    customPaging: () => (
      <button
        type="button"
        aria-label="Go to slide"
        className="w-2 h-2 rounded-full bg-slate-300 transition-colors"
      />
    ),
  };

  return (
    <div
      className="[&_.slick-dots]:!flex [&_.slick-dots]:justify-center [&_.slick-dots]:gap-2
        [&_.slick-dots]:mt-3 [&_.slick-dots]:list-none [&_.slick-dots]:p-0
        [&_.slick-dots_li]:w-2 [&_.slick-dots_li]:h-2
        [&_.slick-dots_li.slick-active_button]:bg-teal-600"
    >
      <Slider {...settings}>
        {SLIDES.map((slide, i) => (
          <div key={i}>
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 bg-white px-4 py-5 md:px-8 md:py-6">
              {slide.image && (
                <Image
                  src={slide.image}
                  alt={slide.imageAlt || ''}
                  width={slide.imageWidth}
                  height={slide.imageHeight}
                  className="h-28 md:h-32 w-auto shrink-0 object-contain"
                  sizes="(max-width: 767px) 220px, 240px"
                  priority={i === 0}
                />
              )}

              <div className="min-w-0 text-center md:text-left">
                {/* Stretched link: the ::after overlay makes the whole banner
                    clickable, while nested sub-links (bullets) sit above it. */}
                <Link
                  href={slide.href}
                  aria-label={slide.headline}
                  className="after:absolute after:inset-0 after:z-[1] after:content-['']"
                >
                  <h2 className="text-xl md:text-3xl font-extrabold text-teal-800 leading-tight">
                    {slide.headline}
                  </h2>
                </Link>

                <ul className="mt-3 space-y-1.5 inline-block text-left md:block">
                  {slide.bullets.map(({ Icon, text, link }, bi) => (
                    <li
                      key={bi}
                      className="flex items-center gap-2 text-sm md:text-base text-slate-800"
                    >
                      <Icon className="w-5 h-5 text-teal-700 shrink-0" />
                      <span>
                        {text}
                        {link && (
                          <>
                            {' '}
                            <Link
                              href={link.href}
                              className="relative z-[2] font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
                            >
                              {link.label}
                            </Link>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default HomeBannerSlider;
