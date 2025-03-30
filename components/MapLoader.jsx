// components/MapLoader.jsx
'use client';

import Script from 'next/script';

const MapLoader = () => {
  return (
    <Script
      id="google-maps-script"
      strategy="afterInteractive"
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
      onLoad={() => {
        window.initAutocomplete = () => {
          const input = document.getElementById('suburb-autocomplete');
          if (input && window.google?.maps?.places) {
            new window.google.maps.places.Autocomplete(input, {
              types: ['(regions)'],
              componentRestrictions: { country: 'au' },
              fields: ['address_components', 'geometry', 'name']
            });
          }
        };
      }}
    />
  );
};

export default MapLoader;