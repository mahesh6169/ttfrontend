import React, { useEffect, useState } from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [blockSize, setBlockSize] = useState(3);
  const [showFirstLast, setShowFirstLast] = useState(true);

  useEffect(() => {
    const updateBlockSize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setBlockSize(7); // lg and up
        setShowFirstLast(true);
      } else if (width >= 640) {
        setBlockSize(5); // sm to md
        setShowFirstLast(true);
      } else {
        setBlockSize(3); // mobile
        setShowFirstLast(false); // Hide First/Last on mobile to save space
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
        className={`text-xs px-2 py-0.5 rounded transition-colors ${
          i === currentPage 
            ? 'bg-teal-600 text-white font-medium' 
            : 'text-gray-600 hover:bg-gray-100'
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
    <div className="flex items-center justify-center gap-1 my-2 flex-wrap">
      {/* First - Hidden on mobile */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="text-xs px-2 py-0.5 rounded transition-colors
               text-gray-600 hover:bg-gray-100
               disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          First
        </button>
      )}

      {/* Prev Block */}
      <button
        onClick={handlePrevBlock}
        disabled={currentBlock === 0}
        className="text-xs px-2 py-0.5 rounded transition-colors
             text-gray-600 hover:bg-gray-100
             disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline">Prev</span>
        <span className="sm:hidden">‹</span>
      </button>

      {/* Page Numbers */}
      {pages}

      {/* Next Block */}
      <button
        onClick={handleNextBlock}
        disabled={(currentBlock + 1) * blockSize >= totalPages}
        className="text-xs px-2 py-0.5 rounded transition-colors
             text-gray-600 hover:bg-gray-100
             disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden">›</span>
      </button>

      {/* Last - Hidden on mobile */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="text-xs px-2 py-0.5 rounded transition-colors
               text-gray-600 hover:bg-gray-100
               disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          Last
        </button>
      )}
    </div>
  );
};

export default Pagination;
