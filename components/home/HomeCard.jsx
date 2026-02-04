import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { FaCalendarAlt } from 'react-icons/fa';
import { BsChatDots } from 'react-icons/bs';
import { format } from 'date-fns';

const HomeCard = ({ type, data, isDemo = false }) => {
  if (!data) return null;

  const FALLBACK_LISTING_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_ADVERT_IMAGE_URL;
  const FALLBACK_EVENT_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_EVENT_IMAGE_URL;

  const renderContent = (showDemoBadge = false) => {
    const DemoBadge = () => (
      <span className="absolute top-2 right-2 md:right-2 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded z-10">
        DEMO
      </span>
    );

    switch (type) {
      case 'listing':
        return (
          <>
            <div className="relative w-full h-40 sm:h-48 md:h-56 bg-slate-100 rounded-t-xl overflow-hidden">
              <img
                src={data.image || FALLBACK_LISTING_IMAGE}
                alt={data.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="py-2 px-2">
              <h2 className="text-xs sm:text-sm text-center font-medium truncate text-slate-900">
                {data.title}
              </h2>

              <div className="flex items-center gap-1 truncate justify-center">
                <MdLocationOn className="text-xs text-slate-600 flex-shrink-0" />
                <span className="text-xs text-slate-600">
                  {data.suburb}, {data.state}
                </span>
              </div>
            </div>
          </>
        );

      case 'event':
        return (
          <>
            <div className="relative w-full h-40 sm:h-48 md:h-56 bg-slate-100 rounded-t-xl overflow-hidden">
              {showDemoBadge && <DemoBadge />}
              <img
                src={data.image || FALLBACK_EVENT_IMAGE}
                alt={data.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="py-2 px-2">
              <h2 className="text-xs sm:text-sm text-center font-medium truncate text-slate-900">
                {data.title}
              </h2>

              <div className="flex items-center gap-1 truncate justify-center">
                <FaCalendarAlt className="text-xs text-slate-600 flex-shrink-0" />
                <span className="text-xs text-slate-600">
                  {data.date ? format(new Date(data.date), 'dd MMM yyyy') : 'Date TBA'}
                </span>
              </div>

              <div className="flex items-center gap-1 truncate justify-center">
                <MdLocationOn className="text-xs text-slate-600 flex-shrink-0" />
                <span className="text-xs text-slate-600">
                  {data.venue}
                </span>
              </div>
            </div>
          </>
        );

      case 'thread':
        return (
          <>
            <div className="relative w-full h-40 sm:h-48 md:h-56 bg-slate-100 rounded-t-xl flex items-center justify-center">
              <BsChatDots className="text-6xl text-teal-700 opacity-20" />
            </div>

            <div className="py-2 px-2">
              <h2 className="text-xs sm:text-sm text-center font-medium line-clamp-2 text-slate-900 min-h-[2.5rem]">
                {data.title}
              </h2>

              <div className="text-xs text-slate-600 text-center">
                by {data.author}
              </div>

              <div className="text-xs text-slate-600 text-center">
                {data.createdAt ? format(new Date(data.createdAt), 'dd MMM yyyy') : ''}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const linkHref = type === 'listing'
    ? `/listings/views/${data._id}`
    : type === 'event'
    ? `/events/views/${data._id}`
    : `/threads/views/${data._id}`;

  return (
    <Link href={linkHref}>
      <div className="relative rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 h-full overflow-hidden">
        {renderContent(isDemo)}
      </div>
    </Link>
  );
};

export default HomeCard;
