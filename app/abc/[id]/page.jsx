'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const AdvertDetail = () => {
  const { id } = useParams();
  const [advert, setAdvert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdvert = async () => {
      try {
        const response = await fetch(`http://192.168.181.115:5015/api/adverts/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch advert');
        }
        const data = await response.json();
        setAdvert(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvert();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-8">Loading advert details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">{advert.title}</h1>
      <p className="text-gray-700 mb-4">{advert.description}</p>
      <p><strong>Category:</strong> {advert.category}</p>
      <p><strong>Price:</strong> ${advert.price}</p>
      {advert.images && advert.images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {advert.images.map((img) => (
            <img key={img.url} src={img.url} alt={advert.title} className="w-full rounded" />
          ))}
        </div>
      )}
      <p className="text-sm text-gray-500 mt-4">
        <strong>Posted By:</strong> {advert.postedBy?.name || 'Guest'}
      </p>
    </div>
  );
};

export default AdvertDetail;
