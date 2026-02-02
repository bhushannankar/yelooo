import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logout } from '../features/auth/authSlice';
import { clearCart } from '../features/cart/cartSlice';
import { fetchCategoriesWithSubCategories } from '../features/categories/categoriesSlice';
import YeloooLogo from '../images/YeloooLogo.png';
import './Header.css';

const API_URL = 'https://localhost:7193/api';
const BASE_URL = 'https://localhost:7193';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);
  const username = useSelector((state) => state.auth.username);
  const cartItems = useSelector((state) => state.cart.items);
  const categories = useSelector((state) => state.categories.itemsWithSubCategories);
  const categoriesStatus = useSelector((state) => state.categories.subCategoriesStatus);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [activeTertiaryCategory, setActiveTertiaryCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  useEffect(() => {
    if (categoriesStatus === 'idle') {
      dispatch(fetchCategoriesWithSubCategories());
    }
  }, [categoriesStatus, dispatch]);

  // Fetch profile image when logged in
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (isLoggedIn) {
        try {
          const token = localStorage.getItem('jwtToken');
          const response = await axios.get(`${API_URL}/UserProfile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data?.profileImageUrl) {
            setProfileImageUrl(response.data.profileImageUrl);
          }
        } catch (err) {
          console.error('Failed to fetch profile image:', err);
        }
      } else {
        setProfileImageUrl(null);
      }
    };
    fetchProfileImage();
  }, [isLoggedIn]);

  const handleLogout = () => {
    setActiveDropdown(null);
    dispatch(logout());
    dispatch(clearCart());
    navigate('/');
  };

  const toggleDropdown = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/?category=${categoryId}`);
    closeAllCategoryMenus();
  };

  const handleSubCategoryClick = (subCategoryId) => {
    navigate(`/?subcategory=${subCategoryId}`);
    closeAllCategoryMenus();
  };

  const handleTertiaryCategoryClick = (tertiaryCategoryId) => {
    navigate(`/?tertiary=${tertiaryCategoryId}`);
    closeAllCategoryMenus();
  };

  const handleQuaternaryCategoryClick = (quaternaryCategoryId) => {
    navigate(`/?quaternary=${quaternaryCategoryId}`);
    closeAllCategoryMenus();
  };

  const closeAllCategoryMenus = () => {
    setActiveCategory(null);
    setActiveSubCategory(null);
    setActiveTertiaryCategory(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src={YeloooLogo} alt="Yelooo" className="logo-image" />
        </Link>

        {/* Search Box */}
        <div className="search-box-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search for products, brands and more"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <button type="submit" className="search-button" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </form>
        </div>

        {/* Category Navigation */}
        <nav className="category-nav-inline">
          {categories && categories.map((category) => (
            <div
              key={category.categoryId}
              className={`category-item ${activeCategory === category.categoryId ? 'active' : ''}`}
              onMouseEnter={() => setActiveCategory(category.categoryId)}
              onMouseLeave={() => closeAllCategoryMenus()}
            >
              <button
                className="category-button"
                onClick={() => handleCategoryClick(category.categoryId)}
              >
                {category.categoryName}
                {Array.isArray(category.subCategories) && category.subCategories.length > 0 && (
                  <span className="dropdown-arrow">▾</span>
                )}
              </button>
              
              {/* Subcategory dropdown - Level 2 */}
              {activeCategory === category.categoryId && Array.isArray(category.subCategories) && category.subCategories.length > 0 && (
                <div className="subcategory-dropdown">
                  {category.subCategories.map((subCategory) => (
                    <div 
                      key={subCategory.subCategoryId} 
                      className={`subcategory-item-wrapper ${activeSubCategory === subCategory.subCategoryId ? 'active' : ''}`}
                      onMouseEnter={() => setActiveSubCategory(subCategory.subCategoryId)}
                    >
                      <button
                        className="subcategory-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubCategoryClick(subCategory.subCategoryId);
                        }}
                      >
                        {subCategory.subCategoryName}
                        {Array.isArray(subCategory.tertiaryCategories) && subCategory.tertiaryCategories.length > 0 && (
                          <span className="submenu-arrow">›</span>
                        )}
                      </button>
                      
                      {/* Tertiary dropdown - Level 3 */}
                      {activeSubCategory === subCategory.subCategoryId && Array.isArray(subCategory.tertiaryCategories) && subCategory.tertiaryCategories.length > 0 && (
                        <div className="tertiary-dropdown">
                          {subCategory.tertiaryCategories.map((tertiary) => (
                            <div 
                              key={tertiary.tertiaryCategoryId}
                              className={`tertiary-item-wrapper ${activeTertiaryCategory === tertiary.tertiaryCategoryId ? 'active' : ''}`}
                              onMouseEnter={() => setActiveTertiaryCategory(tertiary.tertiaryCategoryId)}
                            >
                              <button
                                className="tertiary-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTertiaryCategoryClick(tertiary.tertiaryCategoryId);
                                }}
                              >
                                {tertiary.tertiaryCategoryName}
                                {Array.isArray(tertiary.quaternaryCategories) && tertiary.quaternaryCategories.length > 0 && (
                                  <span className="submenu-arrow">›</span>
                                )}
                              </button>
                              
                              {/* Quaternary dropdown - Level 4 */}
                              {activeTertiaryCategory === tertiary.tertiaryCategoryId && Array.isArray(tertiary.quaternaryCategories) && tertiary.quaternaryCategories.length > 0 && (
                                <div className="quaternary-dropdown">
                                  {tertiary.quaternaryCategories.map((quaternary) => (
                                    <button
                                      key={quaternary.quaternaryCategoryId}
                                      className="quaternary-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuaternaryCategoryClick(quaternary.quaternaryCategoryId);
                                      }}
                                    >
                                      {quaternary.quaternaryCategoryName}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <nav className="header-nav">
            {!isLoggedIn && (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </>
            )}
            
            {/* Admin Dropdown Menus */}
            {isLoggedIn && userRole === 'Admin' && (
              <div className="admin-menus">
                {/* Manage Product Dropdown */}
                <div className="dropdown" onMouseLeave={closeDropdown}>
                  <button 
                    className="dropdown-toggle"
                    onClick={() => toggleDropdown('product')}
                    onMouseEnter={() => setActiveDropdown('product')}
                  >
                    Manage Product ▾
                  </button>
                  {activeDropdown === 'product' && (
                    <div className="dropdown-menu">
                      <Link to="/add-product" className="dropdown-item" onClick={closeDropdown}>
                        Add Product
                      </Link>
                      <Link to="/" className="dropdown-item" onClick={closeDropdown}>
                        Product List
                      </Link>
                    </div>
                  )}
                </div>

                {/* Manage Seller Dropdown */}
                <div className="dropdown" onMouseLeave={closeDropdown}>
                  <button 
                    className="dropdown-toggle"
                    onClick={() => toggleDropdown('seller')}
                    onMouseEnter={() => setActiveDropdown('seller')}
                  >
                    Manage Seller ▾
                  </button>
                  {activeDropdown === 'seller' && (
                    <div className="dropdown-menu">
                      <Link to="/admin/add-seller" className="dropdown-item" onClick={closeDropdown}>
                        Add Seller
                      </Link>
                      <Link to="/admin/sellers" className="dropdown-item" onClick={closeDropdown}>
                        Seller List
                      </Link>
                    </div>
                  )}
                </div>

                {/* Reports Dropdown */}
                <div className="dropdown" onMouseLeave={closeDropdown}>
                  <button 
                    className="dropdown-toggle"
                    onClick={() => toggleDropdown('reports')}
                    onMouseEnter={() => setActiveDropdown('reports')}
                  >
                    Reports ▾
                  </button>
                  {activeDropdown === 'reports' && (
                    <div className="dropdown-menu">
                      <Link to="/admin/reports/orders" className="dropdown-item" onClick={closeDropdown}>
                        Product Ordered
                      </Link>
                      <Link to="/admin/reports/points" className="dropdown-item" onClick={closeDropdown}>
                        Points Report
                      </Link>
                    </div>
                  )}
                </div>

                {/* KYC Management */}
                <Link to="/admin/kyc" className="nav-link">
                  KYC Management
                </Link>
              </div>
            )}

            {/* Seller Menus */}
            {isLoggedIn && userRole === 'Seller' && (
              <div className="seller-menus">
                <Link to="/seller/orders" className="nav-link">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  My Orders
                </Link>
              </div>
            )}

            {/* Show cart only for customers (not Admin or Seller) */}
            {(!isLoggedIn || (userRole !== 'Admin' && userRole !== 'Seller')) && (
              <Link to="/cart" className="cart-icon-link" title="Cart">
                <div className="cart-icon-wrapper">
                  <svg 
                    className="cart-icon" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="28" 
                    height="28"
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {cartItems.reduce((total, item) => total + item.quantity, 0) > 0 && (
                    <span className="cart-badge">
                      {cartItems.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* Profile Icon with Dropdown - for logged in users */}
            {isLoggedIn && (
              <div className="dropdown profile-dropdown" onMouseLeave={closeDropdown}>
                <button 
                  className="profile-icon-btn"
                  onClick={() => toggleDropdown('profile')}
                  onMouseEnter={() => setActiveDropdown('profile')}
                  title={username}
                >
                  {profileImageUrl ? (
                    <img 
                      src={`${BASE_URL}${profileImageUrl}`} 
                      alt={username} 
                      className="profile-icon-img"
                    />
                  ) : (
                    <svg 
                      className="profile-icon" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      width="28" 
                      height="28"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  )}
                </button>
                {activeDropdown === 'profile' && (
                  <div className="dropdown-menu profile-menu">
                    <div className="profile-header">
                      {profileImageUrl ? (
                        <img 
                          src={`${BASE_URL}${profileImageUrl}`} 
                          alt={username} 
                          className="profile-avatar-img"
                        />
                      ) : (
                        <div className="profile-avatar-circle">
                          {username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="profile-header-info">
                        <span className="profile-username">{username}</span>
                        <span className="profile-role">{userRole}</span>
                      </div>
                    </div>
                    {userRole === 'Customer' && (
                      <>
                        <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                          My Profile
                        </Link>
                        <Link to="/my-orders" className="dropdown-item" onClick={closeDropdown}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                          </svg>
                          My Orders
                        </Link>
                        <Link to="/my-network" className="dropdown-item" onClick={closeDropdown}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                          My Network
                        </Link>
                        <Link to="/my-points" className="dropdown-item" onClick={closeDropdown}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                          </svg>
                          My Points
                        </Link>
                      </>
                    )}
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>
  );
};

export default Header;
