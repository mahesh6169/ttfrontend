const SkeletonLoader = () => {
    return (
      <div className="p-6">
        {/* Simulated page heading */}
        <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-6"></div>
  
        {/* Simulated advert grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded shadow space-y-4"
            >
              {/* Simulated image */}
              <div className="h-48 bg-gray-300 rounded"></div>
              {/* Simulated title */}
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              {/* Simulated details */}
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default SkeletonLoader;
  