import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCategoriesWithSubCategories } from '../features/categories/categoriesSlice';
import './CategoryNav.css';

const CategoryNav = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector((state) => state.categories.itemsWithSubCategories);
  const status = useSelector((state) => state.categories.subCategoriesStatus);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategoriesWithSubCategories());
    }
  }, [status, dispatch]);

  const handleCategoryClick = (categoryId) => {
    navigate(`/?category=${categoryId}`);
    setActiveCategory(null);
  };

  const handleSubCategoryClick = (subCategoryId) => {
    navigate(`/?subcategory=${subCategoryId}`);
    setActiveCategory(null);
  };

  const handleMouseEnter = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleMouseLeave = () => {
    setActiveCategory(null);
  };

  if (status === 'loading') {
    return (
      <nav className="category-nav">
        <div className="category-nav-content">
          <span className="loading-text">Loading categories...</span>
        </div>
      </nav>
    );
  }

  if (status === 'failed' || !categories || categories.length === 0) {
    return null;
  }

  return (
    <nav className="category-nav">
      <div className="category-nav-content">
        {categories.map((category) => (
          <div
            key={category.categoryId}
            className={`category-nav-item ${activeCategory === category.categoryId ? 'active' : ''}`}
            onMouseEnter={() => handleMouseEnter(category.categoryId)}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="category-nav-button"
              onClick={() => handleCategoryClick(category.categoryId)}
            >
              {category.categoryName}
              {Array.isArray(category.subCategories) && category.subCategories.length > 0 && (
                <span className="dropdown-arrow">▾</span>
              )}
            </button>
            
            {/* Subcategory dropdown */}
            {activeCategory === category.categoryId && Array.isArray(category.subCategories) && category.subCategories.length > 0 && (
              <div className="subcategory-dropdown">
                {category.subCategories.map((subCategory) => (
                  <button
                    key={subCategory.subCategoryId}
                    className="subcategory-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubCategoryClick(subCategory.subCategoryId);
                    }}
                  >
                    {subCategory.subCategoryName}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default CategoryNav;
