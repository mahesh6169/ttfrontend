import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { FaCalendarAlt } from 'react-icons/fa';
import { BsChatDots } from 'react-icons/bs';
import { format } from 'date-fns';

const HomeCard = ({ type, data }) => {
  if (!data) return null;

  const renderContent = () => {
    switch (type) {
      case 'listing':
        return (
          <>
            <div className="relative w-full h-40 sm:h-48 md:h-56 bg-white rounded-md">
              {data.image ? (
                <img 
                  src={data.image} 
                  alt={data.title} 
                  className="w-full h-full object-cover rounded-md" 
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500 rounded-md">
                  No Image
                </div>
              )}
            </div>
            
            <h2 className="text-xs sm:text-sm text-center font-medium my-1 px-2 truncate text-gray-800">
              {data.title}
            </h2>
            
            <div className="flex items-center gap-1 px-2 truncate justify-center">
              <MdLocationOn className="text-xs font-medium text-gray-600 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-600">
                {data.suburb}, {data.state}
              </span>
            </div>
          </>
        );

      case 'event':
        return (
          <>
            <div className="relative w-full h-40 sm:h-48 md:h-56 bg-white rounded-md">
              {data.image ? (
                <img 
                  src={data.image} 
                  alt={data.title} 
                  className="w-full h-full object-cover rounded-md" 
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500 rounded-md">
                  No Image
                </div>
              )}
            </div>
            
            <h2 className="text-xs sm:text-sm text-center font-medium my-1 px-2 truncate text-gray-800">
              {data.title}
            </h2>
            
            <div className="flex items-center gap-1 px-2 truncate justify-center">
              <FaCalendarAlt className="text-xs font-medium text-gray-600 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-600">
                {data.date ? format(new Date(data.date), 'dd MMM yyyy') : 'Date TBA'}
              </span>
            </div>
            
            <div className="flex items-center gap-1 px-2 truncate justify-center">
              <MdLocationOn className="text-xs font-medium text-gray-600 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-600">
                {data.venue}
              </span>
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
      <div className="relative border rounded-lg shadow-md bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors h-full">
        {renderContent()}
      </div>
    </Link>
  );
};

export default HomeCard;
