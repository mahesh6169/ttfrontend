'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdverts } from '../../store/slices/advertSlice';
import Link from 'next/link';

const AdvertsPage = () => {
  const dispatch = useDispatch();
  const { adverts, status, error } = useSelector((state) => state.advert);
  

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAdverts());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return <div className="text-center text-gray-500">Loading adverts...</div>;
  }

  if (status === 'failed') {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }
  


  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Adverts</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adverts.map((advert) => (
          <Link key={advert._id} href={`/adverts/views/${advert._id}`}>
            <div className="border rounded-lg shadow hover:shadow-lg transition p-4 cursor-pointer">
              <div className="h-48 w-full overflow-hidden rounded mb-4">
                {advert.images && advert.images.length > 0 ? (
                  <img
                    src={advert.images[0].url}
                    alt={`Image for ${advert.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                    No Image Available
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold mb-2">{advert.title}</h2>
              {/*<p className="text-gray-700">{advert.description}</p>*/}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdvertsPage;
