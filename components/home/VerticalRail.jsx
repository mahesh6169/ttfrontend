import Link from 'next/link';
import { HiBuildingStorefront } from 'react-icons/hi2';
import { FaArrowRight } from 'react-icons/fa';
import HomeCard from './HomeCard';

// Reusable rail: header (title + View all) + a small grid of cards ending in a
// "create" CTA card. One component, reused per vertical. items arrive already
// flattened by the /home/* endpoints (see HomePageUX.md section 7).
//
// Layout: desktop = 3 cards + CTA (one row of 4); mobile = 2 cards then the CTA
// full-width below. The 3rd card is desktop-only; the rest are reached via "View All".
const VerticalRail = ({ title, viewAllHref, items = [], type, cta }) => {
  const shown = items.slice(0, 3);
  const CtaIcon = cta?.icon || HiBuildingStorefront;

  return (
    <section className="py-4 px-3 sm:py-6 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-2xl font-bold text-teal-800">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
        >
          View All <FaArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 2 cards + CTA (mobile) / 3 cards + CTA (desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {shown.map((item, i) => (
          <div key={item._id} className={i === 2 ? 'hidden lg:block' : ''}>
            <HomeCard type={type} data={item} />
          </div>
        ))}

        {cta && (
          <Link href={cta.href} className="col-span-2 lg:col-span-1 group">
            <div
              className="relative h-full min-h-[140px] flex items-center justify-center p-3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
              style={
                cta.image
                  ? { backgroundImage: `url(${cta.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : undefined
              }
            >
              {cta.image && (
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              )}
              {/* light frosted neutral panel - horizontal on mobile, stacked on desktop */}
              <div className="relative flex flex-row lg:flex-col items-center gap-3 lg:gap-2 text-left lg:text-center rounded-xl bg-white/40 backdrop-blur-sm px-4 py-3 shadow-sm">
                <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm shrink-0">
                  <CtaIcon className="w-6 h-6 text-teal-700" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">{cta.label}</span>
                  {cta.subtitle && (
                    <span className="text-xs text-slate-600 max-w-[12rem]">{cta.subtitle}</span>
                  )}
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
};

export default VerticalRail;
