'use client';

import React from 'react';
import Slider from 'react-slick';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const ImageDisplay = ({ images = [], title = 'Advert Image' }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  return (
    <div className="border-r lg:border lg:rounded-none shadow-none lg:shadow p-4 w-full">
      <div className="w-full h-64 lg:h-72 bg-slate-200 flex items-center justify-center overflow-hidden">
        {images.length > 0 ? (
          <Slider {...settings} className="w-full h-full">
            {images.map((image, index) => (
              <Zoom key={index}>
                <img
                  src={image.url}
                  alt={`${title || 'Advert Image'} ${index + 1}`}
                  className="object-cover h-full w-full cursor-pointer"
                />
              </Zoom>
            ))}
          </Slider>
        ) : (
          <span className="text-slate-500">No Image Available</span>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;
