const WaveDivider = ({ topColor = 'rgb(180, 210, 130)', bottomColor = 'rgb(230, 210, 230)' }) => {
  return (
    <div className="relative w-full h-10 md:h-28 -mt-2 md:-mt-7 -mb-2 md:-mb-7 overflow-visible z-10">
      {/* Top wave - Green flowing down (fat/deep) */}
      <svg
        className="absolute top-0 left-0 w-full h-1/2"
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 0H1440V45C1333.33 45 1226.67 95 1120 95C1013.33 95 906.667 45 800 45C693.333 45 586.667 95 480 95C373.333 95 266.667 45 160 45C53.3333 45 0 75 0 88V0Z"
          fill={topColor}
        />
      </svg>

      {/* Bottom wave - Purple flowing up (fat/deep) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-1/2"
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 55C106.667 55 213.333 5 320 5C426.667 5 533.333 55 640 55C746.667 55 853.333 5 960 5C1066.67 5 1173.33 55 1280 55C1386.67 55 1440 25 1440 12V100H0V55Z"
          fill={bottomColor}
        />
      </svg>
    </div>
  );
};

export default WaveDivider;
