import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];

  const addEllipsis = (key) => (
    <span key={key} className="px-2">
      ...
    </span>
  );

  if (totalPages <= 15) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded ${
            i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }
  } else {
    pages.push(
      <button
        key={1}
        onClick={() => onPageChange(1)}
        className={`px-3 py-1 rounded ${
          currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        1
      </button>
    );

    if (currentPage > 5) {
      pages.push(addEllipsis('start'));
    }

    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded ${
            i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages - 4) {
      pages.push(addEllipsis('end'));
    }

    pages.push(
      <button
        key={totalPages}
        onClick={() => onPageChange(totalPages)}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        {totalPages}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
      {/* First */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
      >
        First
      </button>

      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
      >
        Prev
      </button>

      {/* Page Numbers */}
      {pages}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
      >
        Next
      </button>

      {/* Last */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
      >
        Last
      </button>
    </div>
  );
};

export default Pagination;
