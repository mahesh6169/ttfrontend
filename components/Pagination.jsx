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
        className={`text-xs lg:text-base px-2 md:px-3 py-1 rounded ${
          i === currentPage ? 'bg-gray-300 text-gray-900 font-semibold' : 'bg-gray-100 text-gray-800'
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
        className="text-xs lg:text-base px-2 md:px-3 py-1 rounded 
             bg-gray-300 text-gray-900 font-semibold
             disabled:text-gray-100 disabled:opacity-60"
>
        First
      </button>

      {/* Prev Block */}
      <button
        onClick={handlePrevBlock}
        disabled={currentBlock === 0}
        className="text-xs lg:text-base px-2 md:px-3 py-1 rounded 
             bg-gray-300 text-gray-900 font-semibold
             disabled:text-gray-100 disabled:opacity-60"
>
        Prev
      </button>

      {/* Page Numbers */}
      {pages}

      {/* Next Block */}
      <button
        onClick={handleNextBlock}
        disabled={(currentBlock + 1) * blockSize >= totalPages}
        className="text-xs lg:text-base px-2 md:px-3 py-1 rounded 
             bg-gray-300 text-gray-900 font-semibold
             disabled:text-gray-100 disabled:opacity-60"
>
        Next
      </button>

      {/* Last */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="text-xs lg:text-base px-2 md:px-3 py-1 rounded 
             bg-gray-300 text-gray-900 font-semibold
             disabled:text-gray-100 disabled:opacity-60"
>
        Last
      </button>
    </div>
  );
};

export default Pagination;
