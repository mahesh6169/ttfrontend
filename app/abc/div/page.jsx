import Link from 'next/link';
import { RiAdvertisementLine } from 'react-icons/ri';
// test.
const DemoPage = () => {
  return (
    <div className="container my-2 mx-auto">
      <div className="relative m-2  sm:px-4 sm:py-6 min-h-[70px] sm:min-h-[180px] bg-gradient-to-br from-slate-300 to-white shadow-sm rounded-md">
        {/* Post Advert Button - top-left corner . (mobile) */}
        <div className="absolute top-1 left-1 sm:static">
          <Link
            href="/adverts/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-1 py-1 sm:px-5 sm:py-2.5 rounded-tr-xl rounded-bl-xl shadow-lg text-xs sm:text-base font-semibold transition duration-200"
          >
            Post Advert
          </Link>
        </div>

        {/* Discover Adverts - Centered on mobile, normal on desktop */}
        <div className="absolute inset-0 flex items-center justify-center sm:static sm:flex sm:justify-center">
          <h1 className="text-base sm:text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 text-center">
            <span className="inline-block animate-bounce">
              <RiAdvertisementLine className="text-base sm:text-3xl" />
            </span>
            Discover Adverts
          </h1>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
