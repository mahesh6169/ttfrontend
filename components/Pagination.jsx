import React, { useEffect, useState } from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [blockSize, setBlockSize] = useState(3);

  useEffect(() => {
    const updateBlockSize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setBlockSize(7); // lg and up
      } else {
        setBlockSize(5); // default, sm, md
      }
    };

    updateBlockSize(); // Initial call
    window.addEventListener('resize', updateBlockSize);
    return () => window.removeEventListener('resize', updateBlockSize);
  }, []);

  if (!totalPages || totalPages <= 1) return null;

  const currentBlock = Math.floor((currentPage - 1) / blockSize);
  const startPage = currentBlock * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPages);

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={`text-xs lg:text-base px-2 md:px-3 py-1 rounded shadow-sm transition-colors ${
          i === currentPage 
            ? 'bg-teal-700 text-lime-100 font-semibold' 
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        {i}
      </button>
    );
  }

  const handleNextBlock = () => {
    const nextBlockStart = (currentBlock + 1) * blockSize + 1;
    if (nextBlockStart <= totalPages) {
      onPageChange(nextBlockStart);
    }
  };

  const handlePrevBlock = () => {
    const prevBlockStart = (currentBlock - 1) * blockSize + 1;
    if (prevBlockStart >= 1) {
      onPageChange(prevBlockStart);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 my-4 flex-wrap">
      {/* First */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="text-xs lg:text-base px-2 md:px-3 py-1 rounded shadow-sm transition-colors
             bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 font-semibold
             disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
>
        First
      </button>

      {/* Prev Block */}
      <button
        onClick={handlePrevBlock}
        disabled={currentBlock === 0}
        className="text-xs lg:text-base px-2 md:px-3 py-1 rounded shadow-sm transition-colors
             bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 font-semibold
             disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
>
        Prev
      </button>

      {/* Page Numbers */}
      {pages}

      {/* Next Block */}
      <button
        onClick={handleNextBlock}
        disabled={(currentBlock + 1) * blockSize >= totalPages}
        className="text-xs lg:text-base px-2 md:px-3 py-1 rounded shadow-sm transition-colors
             bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 font-semibold
             disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
>
        Next
      </button>

      {/* Last */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="text-xs lg:text-base px-2 md:px-3 py-1 rounded shadow-sm transition-colors
             bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 font-semibold
             disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
>
        Last
      </button>
    </div>
  );
};

export default Pagination;
