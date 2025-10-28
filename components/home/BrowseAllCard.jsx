import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';

const BrowseAllCard = ({ type, link, label }) => {
  return (
    <Link href={link}>
      <div className="relative border rounded-lg shadow-md bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 cursor-pointer transition-all h-full flex items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
        <div className="text-center px-4">
          <FaArrowRight className="text-4xl sm:text-5xl text-lime-100 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-lime-100 mb-1 sm:mb-2">
            {label}
          </h3>
          <p className="text-xs sm:text-sm text-lime-200">
            View all {type}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default BrowseAllCard;
