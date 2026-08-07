const SkeletonLoader = () => {
  return (
    <div id="AdvertGrid">
      <div
        id="AdvertGrids"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-4 px-4"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="relative bg-slate-100 p-2 rounded-lg shadow-md animate-pulse min-w-[160px]"
          >
            {/* Wishlist button placeholder */}
            <div className="absolute top-2 right-2 h-6 w-6 bg-slate-300 rounded-full"></div>

            {/* Image block */}
            <div className="h-40 sm:h-48 md:h-56 bg-slate-300 rounded-md w-full"></div>

            {/* Title */}
            <div className="h-4 bg-slate-300 rounded w-3/4 mx-auto mt-2"></div>

            {/* Price */}
            <div className="h-3 bg-slate-300 rounded w-1/2 mx-auto mt-2"></div>

            {/* Location */}
            <div className="h-3 bg-slate-300 rounded w-2/3 mx-auto mt-1"></div>

            {/* Posted date */}
            <div className="h-3 bg-slate-300 rounded w-1/3 ml-auto mr-2 mt-1"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
