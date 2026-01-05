import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { FaCalendarAlt } from 'react-icons/fa';
import { BsChatDots } from 'react-icons/bs';
import { format } from 'date-fns';

const HomeCard = ({ type, data, isDemo = false, borderColor = '', textBgColor = '', textColor = 'text-gray-800' }) => {
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
            <div className="relative w-full h-40 sm:h-48 md:h-56 rounded-md bg-[rgb(235,245,193)]">
              <img
                src={data.image || FALLBACK_LISTING_IMAGE}
                alt={data.title}
                className="w-full h-full object-contain md:object-cover rounded-md"
              />
            </div>

            <div className={`${textBgColor} py-1 rounded-b-md`}>
              <h2 className={`text-xs sm:text-sm text-center font-medium px-2 truncate ${textColor}`}>
                {data.title}
              </h2>

              <div className="flex items-center gap-1 px-2 truncate justify-center">
                <MdLocationOn className={`text-xs font-medium ${textColor} flex-shrink-0`} />
                <span className={`text-xs font-medium ${textColor}`}>
                  {data.suburb}, {data.state}
                </span>
              </div>
            </div>
          </>
        );

      case 'event':
        return (
          <>
            <div className="relative w-full h-40 sm:h-48 md:h-56 rounded-md bg-[rgb(230,210,230)]">
              {showDemoBadge && <DemoBadge />}
              <img
                src={data.image || FALLBACK_EVENT_IMAGE}
                alt={data.title}
                className="w-full h-full object-contain md:object-cover rounded-md"
              />
            </div>

            <div className={`${textBgColor} py-1 rounded-b-md`}>
              <h2 className={`text-xs sm:text-sm text-center font-medium px-2 truncate ${textColor}`}>
                {data.title}
              </h2>

              <div className="flex items-center gap-1 px-2 truncate justify-center">
                <FaCalendarAlt className={`text-xs font-medium ${textColor} flex-shrink-0`} />
                <span className={`text-xs font-medium ${textColor}`}>
                  {data.date ? format(new Date(data.date), 'dd MMM yyyy') : 'Date TBA'}
                </span>
              </div>

              <div className="flex items-center gap-1 px-2 truncate justify-center">
                <MdLocationOn className={`text-xs font-medium ${textColor} flex-shrink-0`} />
                <span className={`text-xs font-medium ${textColor}`}>
                  {data.venue}
                </span>
              </div>
            </div>
          </>
        );

      case 'thread':
        return (
          <>
            <div className="relative w-full h-40 sm:h-48 md:h-56 bg-gradient-to-br from-teal-100 to-lime-100 rounded-md flex items-center justify-center">
              <BsChatDots className="text-6xl text-teal-600 opacity-30" />
            </div>
            
            <h2 className="text-xs sm:text-sm text-center font-medium my-1 px-2 line-clamp-2 text-gray-800 min-h-[2.5rem]">
              {data.title}
            </h2>
            
            <div className="text-xs font-medium text-gray-600 text-center px-2">
              by {data.author}
            </div>
            
            <div className="text-xs font-medium text-gray-600 text-center px-2">
              {data.createdAt ? format(new Date(data.createdAt), 'dd MMM yyyy') : ''}
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
      <div className={`relative rounded-lg bg-transparent ${borderColor ? `border-2 ${borderColor}` : ''} shadow-lg hover:shadow-xl cursor-pointer transition-all h-full overflow-hidden`}>
        {renderContent(isDemo)}
      </div>
    </Link>
  );
};

export default HomeCard;
