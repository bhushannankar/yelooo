import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCategoriesWithSubCategories } from '../features/categories/categoriesSlice';
import { fetchProducts } from '../features/products/productsSlice';
import { addToCart, addToCartAsync, fetchCart, updateQuantity, removeFromCart, updateCartItemAsync, removeFromCartAsync } from '../features/cart/cartSlice';
import Header from './Header';
import Footer from './Footer';
import HomeSlider from './HomeSlider';
import StarRating from './StarRating';
import axios from 'axios';
import './Home.css';
import placeholderImage from '../images/Kurti1.avif';

const API_URL = 'https://localhost:7193/api';
const BASE_URL = 'https://localhost:7193';

// Helper to get property value supporting both PascalCase and camelCase
const getProp = (obj, camelCase) => {
  if (!obj) return undefined;
  const pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  return obj[camelCase] !== undefined ? obj[camelCase] : obj[pascalCase];
};

// Helper to get image URL with proper base URL
const getImageUrl = (url) => {
  if (!url) return placeholderImage;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  if (url.startsWith('http')) return url;
  return placeholderImage;
};

// Format price with Indian locale (e.g. 16248.75 -> 16,248.75)
const formatPrice = (num) => {
  if (num == null || num === '' || Number.isNaN(Number(num))) return 'N/A';
  return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Home = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const categoriesWithSubs = useSelector((state) => state.categories.itemsWithSubCategories);
  const subCategoriesStatus = useSelector((state) => state.categories.subCategoriesStatus);
  const products = useSelector((state) => state.products.items);
  const productsStatus = useSelector((state) => state.products.status);
  const error = useSelector((state) => state.products.error);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);
  const cartItems = useSelector((state) => state.cart.items);

  // Get filter params from URL
  const urlCategoryId = searchParams.get('category') ? parseInt(searchParams.get('category')) : null;
  const urlSubCategoryId = searchParams.get('subcategory') ? parseInt(searchParams.get('subcategory')) : null;
  const urlTertiaryCategoryId = searchParams.get('tertiary') ? parseInt(searchParams.get('tertiary')) : null;
  const urlQuaternaryCategoryId = searchParams.get('quaternary') ? parseInt(searchParams.get('quaternary')) : null;
  const urlSearchQuery = searchParams.get('search') || null;

  const [selectedCategoryId, setSelectedCategoryId] = useState(urlCategoryId);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(urlSubCategoryId);
  const [selectedTertiaryCategoryId, setSelectedTertiaryCategoryId] = useState(urlTertiaryCategoryId);
  const [selectedQuaternaryCategoryId, setSelectedQuaternaryCategoryId] = useState(urlQuaternaryCategoryId);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [productRatings, setProductRatings] = useState({});
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerProductsLoading, setSellerProductsLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('jwtToken');

  // Sync URL params with state
  useEffect(() => {
    setSelectedCategoryId(urlCategoryId);
    setSelectedSubCategoryId(urlSubCategoryId);
    setSelectedTertiaryCategoryId(urlTertiaryCategoryId);
    setSelectedQuaternaryCategoryId(urlQuaternaryCategoryId);
    setSearchQuery(urlSearchQuery);
  }, [urlCategoryId, urlSubCategoryId, urlTertiaryCategoryId, urlQuaternaryCategoryId, urlSearchQuery]);

  useEffect(() => {
    if (subCategoriesStatus === 'idle') {
      dispatch(fetchCategoriesWithSubCategories());
    }
  }, [subCategoriesStatus, dispatch]);

  // Load cart from server when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchCart());
    }
  }, [isLoggedIn, dispatch]);

  // Fetch products - for sellers, fetch only their products
  useEffect(() => {
    if (isLoggedIn && userRole === 'Seller') {
      // Fetch seller's own products
      const fetchSellerProducts = async () => {
        setSellerProductsLoading(true);
        try {
          const response = await axios.get(`${API_URL}/ProductSellers/my-products`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = response.data;
          const arr = Array.isArray(data) ? data : (data?.$values ?? []);
          setSellerProducts(arr);
        } catch (err) {
          console.error('Failed to load seller products:', err);
          setSellerProducts([]);
        } finally {
          setSellerProductsLoading(false);
        }
      };
      fetchSellerProducts();
    } else {
      // For non-sellers, fetch products with optional category filters and search
      dispatch(fetchProducts({ 
        categoryId: selectedCategoryId, 
        subCategoryId: selectedSubCategoryId,
        tertiaryCategoryId: selectedTertiaryCategoryId,
        quaternaryCategoryId: selectedQuaternaryCategoryId,
        search: searchQuery
      }));
    }
  }, [dispatch, selectedCategoryId, selectedSubCategoryId, selectedTertiaryCategoryId, selectedQuaternaryCategoryId, searchQuery, isLoggedIn, userRole, token]);

  useEffect(() => {
    // Fetch review summaries for all products
    const fetchRatings = async () => {
      if (products.length > 0) {
        const ratings = {};
        for (const product of products) {
          const productId = getProp(product, 'productId');
          try {
            const response = await axios.get(`https://localhost:7193/api/Reviews/product/${productId}/summary`);
            ratings[productId] = response.data;
          } catch (error) {
            // Product might not have reviews yet
            ratings[productId] = { averageRating: 0, totalReviews: 0 };
          }
        }
        setProductRatings(ratings);
      }
    };
    if (products.length > 0) {
      fetchRatings();
    }
  }, [products]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(null);
    // Update URL
    if (categoryId) {
      navigate(`/?category=${categoryId}`);
    } else {
      navigate('/');
    }
  };

  const handleSubCategoryClick = (subCategoryId, categoryId) => {
    setSelectedSubCategoryId(subCategoryId);
    setSelectedCategoryId(categoryId);
    navigate(`/?subcategory=${subCategoryId}`);
  };

  // Get current filter name for display
  const getCurrentFilterName = () => {
    // Check search query first
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }
    if (categoriesWithSubs.length > 0) {
      // Check quaternary first (most specific)
      if (selectedQuaternaryCategoryId) {
        for (const cat of categoriesWithSubs) {
          for (const subCat of cat.subCategories || []) {
            for (const tertiary of subCat.tertiaryCategories || []) {
              const quaternary = tertiary.quaternaryCategories?.find(q => q.quaternaryCategoryId === selectedQuaternaryCategoryId);
              if (quaternary) return quaternary.quaternaryCategoryName;
            }
          }
        }
      }
      // Check tertiary
      if (selectedTertiaryCategoryId) {
        for (const cat of categoriesWithSubs) {
          for (const subCat of cat.subCategories || []) {
            const tertiary = subCat.tertiaryCategories?.find(t => t.tertiaryCategoryId === selectedTertiaryCategoryId);
            if (tertiary) return tertiary.tertiaryCategoryName;
          }
        }
      }
      // Check subcategory
      if (selectedSubCategoryId) {
        for (const cat of categoriesWithSubs) {
          const subCat = cat.subCategories?.find(s => s.subCategoryId === selectedSubCategoryId);
          if (subCat) return subCat.subCategoryName;
        }
      }
      // Check category
      if (selectedCategoryId) {
        const cat = categoriesWithSubs.find(c => c.categoryId === selectedCategoryId);
        if (cat) return cat.categoryName;
      }
    }
    return '';
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    const productId = getProp(product, 'productId');
    const productName = getProp(product, 'productName');
    const price = getProp(product, 'price');
    const originalPrice = getProp(product, 'originalPrice') ?? null;
    const imageUrl = getImageUrl(getProp(product, 'imageUrl'));
    
    if (isLoggedIn) {
      // Save to server if logged in - async thunk handles state update
      dispatch(addToCartAsync({ productId, quantity: 1 }));
    } else {
      // Save locally if not logged in
      dispatch(addToCart({ productId, productName, price, originalPrice, imageUrl }));
    }
  };

  // Get quantity of a product in cart
  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Handle increment quantity
  const handleIncrement = (product, e) => {
    if (e) e.stopPropagation();
    const productId = getProp(product, 'productId');
    const currentQty = getCartQuantity(productId);
    
    if (isLoggedIn) {
      dispatch(updateCartItemAsync({ productId, quantity: currentQty + 1 }));
    } else {
      dispatch(updateQuantity({ productId, quantity: currentQty + 1 }));
    }
  };

  // Handle decrement quantity
  const handleDecrement = (product, e) => {
    if (e) e.stopPropagation();
    const productId = getProp(product, 'productId');
    const currentQty = getCartQuantity(productId);
    
    if (currentQty <= 1) {
      // Remove from cart
      if (isLoggedIn) {
        dispatch(removeFromCartAsync(productId));
      } else {
        dispatch(removeFromCart(productId));
      }
    } else {
      // Decrement quantity
      if (isLoggedIn) {
        dispatch(updateCartItemAsync({ productId, quantity: currentQty - 1 }));
      } else {
        dispatch(updateQuantity({ productId, quantity: currentQty - 1 }));
      }
    }
  };

  // Handle remove from cart
  const handleRemoveFromCart = (product, e) => {
    if (e) e.stopPropagation();
    const productId = getProp(product, 'productId');
    
    if (isLoggedIn) {
      dispatch(removeFromCartAsync(productId));
    } else {
      dispatch(removeFromCart(productId));
    }
  };

  const handleProductClick = (product) => {
    const productId = getProp(product, 'productId');
    navigate(`/product/${productId}`);
  };


  // Determine which products to show
  const isSeller = isLoggedIn && userRole === 'Seller';
  const isAdmin = isLoggedIn && userRole === 'Admin';
  const displayProducts = isSeller ? sellerProducts : products;
  const isLoading = isSeller ? sellerProductsLoading : productsStatus === 'loading';
  const hasError = !isSeller && productsStatus === 'failed';

  // Calculate summary stats for admin
  const totalProducts = displayProducts.length;
  const activeProducts = displayProducts.filter(p => getProp(p, 'stock') > 0 || p.stockQuantity > 0).length;
  const outOfStockProducts = totalProducts - activeProducts;

  let productContent;
  if (isLoading) {
    productContent = <div className="loading-message">Loading products...</div>;
  } else if (hasError) {
    productContent = <div className="error-message">Error loading products: {error}</div>;
  } else if (displayProducts.length === 0) {
    productContent = (
      <div className="no-products-message">
        {isSeller ? (
          <p>You don't have any products assigned yet. Contact admin to get products assigned to your seller account.</p>
        ) : (
          <p>No products available.</p>
        )}
      </div>
    );
  } else if (isAdmin) {
    // Admin Grid/Table View
    productContent = (
      <div className="admin-product-management">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <span className="summary-number">{totalProducts}</span>
            <span className="summary-label">Total Products</span>
          </div>
          <div className="summary-card active">
            <span className="summary-number">{activeProducts}</span>
            <span className="summary-label">In Stock</span>
          </div>
          <div className="summary-card warning">
            <span className="summary-number">{outOfStockProducts}</span>
            <span className="summary-label">Out of Stock</span>
          </div>
        </div>

        {/* Product Table */}
        <div className="product-table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th className="col-product">Product Details</th>
                <th className="col-price">Price</th>
                <th className="col-seller">Seller</th>
                <th className="col-stock">Stock</th>
                <th className="col-category">Category</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayProducts.map((product) => {
                const productId = getProp(product, 'productId');
                const productName = getProp(product, 'productName');
                const price = getProp(product, 'price');
                const originalPrice = getProp(product, 'originalPrice');
                const sellerPrice = getProp(product, 'sellerPrice');
                const sellerName = getProp(product, 'sellerName');
                const imageUrl = getProp(product, 'imageUrl');
                const stock = getProp(product, 'stock');
                const categoryName = getProp(product, 'categoryName');
                const subCategoryName = getProp(product, 'subCategoryName');
                const showDiscount = originalPrice != null && Number(originalPrice) > Number(price) && Number(originalPrice) > 0;
                const discountPercent = showDiscount ? Math.round((1 - Number(price) / Number(originalPrice)) * 100) : 0;

                return (
                  <tr key={product.$id || productId}>
                    <td className="col-product">
                      <div className="product-cell">
                        <img 
                          src={getImageUrl(imageUrl)} 
                          alt={productName}
                          onError={(e) => { e.target.src = placeholderImage; }}
                        />
                        <div className="product-info">
                          <span className="product-name" onClick={() => handleProductClick(product)}>
                            {productName}
                          </span>
                          <span className="product-id">ID: {productId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="col-price">
                      <div className="price-cell">
                        {showDiscount && (
                          <>
                            <span className="original-price">₹{formatPrice(originalPrice)}</span>
                            <span className="discount-badge">{discountPercent}% off</span>
                          </>
                        )}
                        <span className="base-price">₹{formatPrice(price)}</span>
                        {sellerPrice && sellerPrice !== price && (
                          <span className="seller-price">Seller: ₹{formatPrice(sellerPrice)}</span>
                        )}
                      </div>
                    </td>
                    <td className="col-seller">
                      {sellerName ? (
                        <span className="seller-badge">{sellerName}</span>
                      ) : (
                        <span className="no-seller">No Seller</span>
                      )}
                    </td>
                    <td className="col-stock">
                      <span className={`stock-badge ${stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {stock > 0 ? stock : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="col-category">
                      <div className="category-cell">
                        <span className="category-name">{categoryName || '-'}</span>
                        {subCategoryName && <span className="subcategory-name">{subCategoryName}</span>}
                      </div>
                    </td>
                    <td className="col-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => navigate(`/admin/products`)}
                        title="Edit Product"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn view-btn"
                        onClick={() => handleProductClick(product)}
                        title="View Details"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    // Customer/Seller Card View
    productContent = (
      <div className="product-list">
        {displayProducts.map((product) => {
          // For seller products, use different property names
          const productId = isSeller ? product.productId : getProp(product, 'productId');
          const productName = isSeller ? product.productName : getProp(product, 'productName');
          const description = isSeller ? product.productDescription : getProp(product, 'description');
          const price = isSeller ? product.sellerPrice : getProp(product, 'price');
          const originalPrice = isSeller ? null : (getProp(product, 'originalPrice') ?? product.originalPrice);
          const imageUrl = isSeller ? product.productImage : getProp(product, 'imageUrl');
          const sellerName = getProp(product, 'sellerName');
          const rating = productRatings[productId];
          const stockQty = isSeller ? product.stockQuantity : null;
          const isActive = isSeller ? product.isActive : true;
          const numPrice = Number(price);
          const numOriginal = originalPrice != null && originalPrice !== '' ? Number(originalPrice) : null;
          const showDiscount = !isSeller && numOriginal != null && !Number.isNaN(numOriginal) && numOriginal > numPrice && numOriginal > 0;
          const discountPercent = showDiscount ? Math.round((1 - numPrice / numOriginal) * 100) : 0;

          return (
            <div key={product.productSellerId || product.$id || productId} className={`product-card ${!isActive ? 'inactive' : ''}`}>
              <div 
                className="product-card-content"
                onClick={() => handleProductClick(product)}
                style={{ cursor: 'pointer' }}
              >
                {isSeller && !isActive && <div className="inactive-badge">Inactive</div>}
                <img 
                  src={getImageUrl(imageUrl)} 
                  alt={productName} 
                  className="product-image"
                  onError={(e) => { e.target.src = placeholderImage; }}
                />
                <h3>{productName}</h3>
                <p>{description}</p>
                {rating && rating.totalReviews > 0 && (
                  <div className="product-rating-summary">
                    <StarRating rating={Math.round(rating.averageRating)} readonly={true} size="small" />
                    <span className="rating-text">
                      {rating.averageRating.toFixed(1)} ({rating.totalReviews})
                    </span>
                  </div>
                )}
                <div className="price-block">
                  {showDiscount && (
                    <div className="price-block-mrp-row">
                      <span className="original-price" title={`MRP ₹${formatPrice(numOriginal)}`}>₹{formatPrice(numOriginal)}</span>
                      <span className="discount-badge">{discountPercent}% off</span>
                    </div>
                  )}
                  <span className="price">₹{formatPrice(price)}</span>
                </div>
                {isSeller && stockQty !== null && (
                  <p className="stock-info">Stock: {stockQty} units</p>
                )}
              </div>
              {!isSeller && (
                getCartQuantity(productId) > 0 ? (
                  <div className="cart-actions">
                    <div className="quantity-selector">
                      <button 
                        className="qty-btn delete-btn" 
                        onClick={(e) => handleRemoveFromCart(product, e)}
                        title="Remove from cart"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                      <span className="qty-value">{getCartQuantity(productId)}</span>
                      <button 
                        className="qty-btn add-btn" 
                        onClick={(e) => handleIncrement(product, e)}
                        title="Add more"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className="go-to-cart-btn"
                      onClick={(e) => { e.stopPropagation(); navigate('/cart'); }}
                    >
                      Go to Cart →
                    </button>
                  </div>
                ) : (
                  <button onClick={(e) => handleAddToCart(product, e)}>Add to Cart</button>
                )
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <Header />
      {!isSeller && !isAdmin && <HomeSlider />}
      <div className={`home-container ${isAdmin ? 'admin-view' : ''}`}>
        <div className="product-section full-width">
          <div className="product-section-header">
            <h2>
              {isAdmin 
                ? 'Listings Management'
                : isSeller 
                  ? 'My Products' 
                  : `Products${getCurrentFilterName() ? ` in ${getCurrentFilterName()}` : ''}`
              }
            </h2>
            {isSeller && <p className="seller-subtitle">Manage your product listings. Click on a product to view details.</p>}
            {isAdmin && <p className="admin-subtitle">Manage all product listings across the platform.</p>}
          </div>
          {productContent}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
