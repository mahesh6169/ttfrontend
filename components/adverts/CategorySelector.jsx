import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaTimes } from 'react-icons/fa';
import { CATEGORIES, getSubcategories } from '@/components/adverts/fieldSystem/Categories';

const CategorySelector = ({
  category,
  subcategory,
  onCategoryChange,
  onSubcategoryChange,
  placeholder = "Select a category",
  disabled = false
}) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const subcategoryDropdownRef = useRef(null);

  // Get subcategories for selected category
  const subcategories = category ? getSubcategories(category) : [];
  const isSingleSubcategory = subcategories.length === 1;

  // Auto-select subcategory when category has only one option
  useEffect(() => {
    if (category && isSingleSubcategory && !subcategory) {
      onSubcategoryChange(subcategories[0]);
    }
  }, [category, isSingleSubcategory, subcategory, subcategories, onSubcategoryChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(event.target)) {
        setIsSubcategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategorySelect = (parentLabel) => {
    onCategoryChange(parentLabel);
    // Clear subcategory when changing category
    onSubcategoryChange('');
    setIsCategoryOpen(false);
  };

  const handleSubcategorySelect = (sub) => {
    onSubcategoryChange(sub);
    setIsSubcategoryOpen(false);
  };

  const handleClearCategory = (e) => {
    e.stopPropagation();
    onCategoryChange('');
    onSubcategoryChange('');
  };

  const handleClearSubcategory = (e) => {
    e.stopPropagation();
    onSubcategoryChange('');
  };

  return (
    <div className="space-y-3">
      {/* Category Dropdown */}
      <div ref={categoryDropdownRef} className="relative">
        <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
          Category <span className="text-red-500">*</span>
          {disabled && <span className="text-xs sm:text-sm font-normal text-slate-500 ml-2">(Cannot be changed)</span>}
        </label>
        <button
          type="button"
          onClick={() => !disabled && setIsCategoryOpen(!isCategoryOpen)}
          disabled={disabled}
          className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg bg-white text-left flex items-center justify-between
            ${category ? 'text-slate-900' : 'text-slate-500'}
            ${isCategoryOpen ? 'border-teal-500 ring-2 ring-teal-300' : 'border-slate-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-300'}
            transition-all duration-200`}
        >
          <span className="truncate pr-2">
            {category || placeholder}
          </span>
          <div className="flex items-center gap-2">
            {category && !isCategoryOpen && !disabled && (
              <FaTimes
                className="w-4 h-4 text-slate-400 hover:text-slate-600"
                onClick={handleClearCategory}
              />
            )}
            <FaChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200
                ${isCategoryOpen ? 'transform rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Category Dropdown Menu */}
        {isCategoryOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleCategorySelect(cat.label)}
                className={`w-full px-4 py-3 text-left hover:bg-teal-50 focus:bg-teal-50
                  focus:outline-none transition-colors
                  ${category === cat.label ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subcategory Dropdown - only show when category is selected */}
      {category && (
        <div ref={subcategoryDropdownRef} className="relative">
          <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
            Subcategory
          </label>
          <button
            type="button"
            onClick={() => !disabled && !isSingleSubcategory && setIsSubcategoryOpen(!isSubcategoryOpen)}
            disabled={disabled || isSingleSubcategory}
            className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg bg-white text-left flex items-center justify-between
              ${subcategory ? 'text-slate-900' : 'text-slate-500'}
              ${isSubcategoryOpen ? 'border-teal-500 ring-2 ring-teal-300' : 'border-slate-300'}
              ${disabled || isSingleSubcategory ? 'opacity-70 cursor-not-allowed bg-slate-50' : 'hover:border-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-300'}
              transition-all duration-200`}
          >
            <span className="truncate pr-2">
              {subcategory || 'Select a subcategory'}
              {isSingleSubcategory && subcategory && (
                <span className="ml-2 text-xs text-slate-400">(only option)</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {subcategory && !isSubcategoryOpen && !disabled && !isSingleSubcategory && (
                <FaTimes
                  className="w-4 h-4 text-slate-400 hover:text-slate-600"
                  onClick={handleClearSubcategory}
                />
              )}
              {!isSingleSubcategory && (
                <FaChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200
                    ${isSubcategoryOpen ? 'transform rotate-180' : ''}`}
                />
              )}
            </div>
          </button>

          {/* Subcategory Dropdown Menu */}
          {isSubcategoryOpen && !isSingleSubcategory && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {subcategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubcategorySelect(sub)}
                  className={`w-full px-4 py-3 text-left hover:bg-teal-50 focus:bg-teal-50
                    focus:outline-none transition-colors
                    ${subcategory === sub ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
