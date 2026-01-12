'use client';

import DealCard from './DealCard';

const DealsGrid = ({ deals }) => {
  if (!deals || deals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No deals found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {deals.map((deal) => (
        <DealCard key={deal._id} deal={deal} />
      ))}
    </div>
  );
};

export default DealsGrid;
