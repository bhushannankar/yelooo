import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchCategoriesWithSubCategories } from '../features/categories/categoriesSlice';
import Header from './Header';
import Footer from './Footer';
import { API_URL, BASE_URL } from '../config';
import './ShopByCategoryPage.css';

const CATEGORY_GRADIENTS = [
  'linear-gradient(135deg, #e8b4b8 0%, #f5d0c5 100%)',
  'linear-gradient(135deg, #98d8c8 0%, #b8e6d5 100%)',
  'linear-gradient(135deg, #a8d8ea 0%, #d4e8f0 100%)',
  'linear-gradient(135deg, #f7dc6f 0%, #fbeaa7 100%)',
  'linear-gradient(135deg, #bb8fce 0%, #e8daef 100%)',
  'linear-gradient(135deg, #85c1e9 0%, #aed6f1 100%)',
  'linear-gradient(135deg, #f8b500 0%, #ffd54f 100%)',
  'linear-gradient(135deg, #e74c3c 0%, #f1948a 100%)',
];

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}/${url}`;
};

const ShopByCategoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector((state) => state.categories.itemsWithSubCategories);
  const status = useSelector((state) => state.categories.subCategoriesStatus);
  const [categoryImages, setCategoryImages] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategoriesWithSubCategories());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (!categories || categories.length === 0) return;
    const fetchImages = async () => {
      const images = {};
      for (const cat of categories) {
        try {
          const res = await axios.get(`${API_URL}/Products`, {
            params: { categoryId: cat.categoryId }
          });
          const arr = Array.isArray(res.data) ? res.data : res.data?.$values ?? [];
          const first = arr.find(p => p.imageUrl);
          if (first) images[cat.categoryId] = getImageUrl(first.imageUrl);
        } catch {
          // ignore
        }
      }
      setCategoryImages(images);
    };
    fetchImages();
  }, [categories]);

  const handleCategoryClick = (categoryId) => {
    navigate(`/?category=${categoryId}`);
  };

  if (status === 'loading') {
    return (
      <div className="shop-by-category-wrapper">
        <Header />
        <main className="shop-by-category-main">
          <h1 className="shop-by-category-heading">Shop by Category</h1>
          <div className="shop-by-category-loading">Loading categories...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === 'failed' || !categories || categories.length === 0) {
    return (
      <div className="shop-by-category-wrapper">
        <Header />
        <main className="shop-by-category-main">
          <h1 className="shop-by-category-heading">Shop by Category</h1>
          <div className="shop-by-category-empty">No categories available.</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="shop-by-category-wrapper">
      <Header />
      <main className="shop-by-category-main">
        <h1 className="shop-by-category-heading">Shop by Category</h1>
        <div className="shop-by-category-grid">
          {categories.map((category, index) => {
            const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
            const imgUrl = categoryImages[category.categoryId];
            const showImage = imgUrl && !imageErrors[category.categoryId];
            return (
              <button
                key={category.categoryId}
                type="button"
                className="shop-by-category-card"
                onClick={() => handleCategoryClick(category.categoryId)}
                style={{ background: gradient }}
              >
                <div className="shop-by-category-card-image">
                  {showImage ? (
                    <img
                      src={imgUrl}
                      alt={category.categoryName}
                      className="shop-by-category-card-img"
                      onError={() => setImageErrors(prev => ({ ...prev, [category.categoryId]: true }))}
                    />
                  ) : (
                    <div className="shop-by-category-card-placeholder" />
                  )}
                </div>
                <span className="shop-by-category-card-label">{category.categoryName}</span>
              </button>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopByCategoryPage;
