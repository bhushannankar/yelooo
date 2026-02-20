import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { addToCart, addToCartAsync, updateCartItemAsync, removeFromCartAsync, updateQuantity, removeFromCart } from '../features/cart/cartSlice';
import ProductReviews from './ProductReviews';
import StarRating from './StarRating';
import Header from './Header';
import placeholderImage from '../images/Kurti1.avif';
import { API_URL, BASE_URL, BROKEN_IMAGE_PLACEHOLDER, getImageUrl as getImageUrlFromConfig } from '../config';
import './ProductDetailPage.css';

const getImageUrl = (url, fallback) => getImageUrlFromConfig(url, fallback);

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);
  const cartItems = useSelector((state) => state.cart.items);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);

  useEffect(() => {
    const raw = detail?.variants;
    const arr = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.$values) ? raw.$values : []);
    if (arr.length) {
      const first = arr[0];
      setSelectedColorId((prev) => (prev == null ? first.colorId ?? null : prev));
      setSelectedSizeId((prev) => (prev == null ? first.sizeId ?? null : prev));
    }
  }, [detail?.productId, detail?.variants]);

  // Set default selected seller when detail loads
  useEffect(() => {
    const sellersRaw = detail?.sellers;
    const sellersArr = Array.isArray(sellersRaw) ? sellersRaw : (sellersRaw && Array.isArray(sellersRaw.$values) ? sellersRaw.$values : []);
    if (sellersArr.length > 0 && !selectedSeller) {
      setSelectedSeller(sellersArr[0]);
    }
  }, [detail?.sellers, selectedSeller]);

  const refetchRatingSummary = React.useCallback(async () => {
    const productId = detail?.productId;
    if (!productId) return;
    try {
      const summaryRes = await axios.get(`${API_URL}/Reviews/product/${productId}/summary`);
      setRatingSummary(summaryRes.data);
    } catch {
      setRatingSummary((prev) => prev || { averageRating: 0, totalReviews: 0 });
    }
  }, [detail?.productId]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/Products/detail/${id}`);
        setDetail(response.data);
        const productId = response.data.productId;
        try {
          const summaryRes = await axios.get(`${API_URL}/Reviews/product/${productId}/summary`);
          setRatingSummary(summaryRes.data);
        } catch {
          setRatingSummary({ averageRating: 0, totalReviews: 0 });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Product not found.');
        } else {
          setError('Failed to load product.');
        }
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const images = useMemo(() => {
    const raw = detail?.images;
    const arr = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.$values) ? raw.$values : []);
    if (!arr.length) return [];
    return [...arr].sort((a, b) => (a.displayOrder - b.displayOrder) || (a.imageId - b.imageId));
  }, [detail?.images]);

  const mainImageUrl = useMemo(() => {
    if (images.length && images[selectedImageIndex]) {
      const url = images[selectedImageIndex].imageUrl;
      if (url) return getImageUrl(url, placeholderImage);
    }
    return getImageUrl(detail?.imageUrl, placeholderImage);
  }, [detail?.imageUrl, images, selectedImageIndex]);

  const variants = useMemo(() => {
    const raw = detail?.variants;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.$values)) return raw.$values;
    return [];
  }, [detail?.variants]);

  const colors = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(variants)) return [];
    variants.forEach((v) => {
      if (v.colorId != null && v.colorName) map.set(v.colorId, { colorId: v.colorId, colorName: v.colorName });
    });
    return Array.from(map.values());
  }, [variants]);

  const sizes = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(variants)) return [];
    variants.forEach((v) => {
      if (v.sizeId != null && v.sizeName) map.set(v.sizeId, { sizeId: v.sizeId, sizeName: v.sizeName, sizeCategory: v.sizeCategory });
    });
    return Array.from(map.values());
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return variants.find(
      (v) =>
        (selectedColorId == null || v.colorId === selectedColorId) &&
        (selectedSizeId == null || v.sizeId === selectedSizeId)
    ) || variants.find((v) => v.colorId === selectedColorId) || variants.find((v) => v.sizeId === selectedSizeId) || variants[0];
  }, [variants, selectedColorId, selectedSizeId]);

  // When a seller is selected, show that seller's price and stock; otherwise use variant/product
  const displayPrice = selectedSeller?.sellerPrice != null
    ? Number(selectedSeller.sellerPrice)
    : (selectedVariant ? selectedVariant.price : detail?.price ?? 0);
  const displayOriginalPrice = selectedVariant?.originalPrice ?? detail?.originalPrice ?? null;
  const displayStock = selectedSeller?.stockQuantity != null
    ? Number(selectedSeller.stockQuantity)
    : (selectedVariant ? selectedVariant.stock : detail?.stock ?? 0);
  const discountPercent =
    displayOriginalPrice != null && displayOriginalPrice > displayPrice && displayOriginalPrice > 0
      ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
      : null;

  // Get quantity of current product in cart
  const getCartQuantity = () => {
    if (!detail) return 0;
    const item = cartItems.find((item) => item.productId === detail.productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = () => {
    if (!detail) return;
    const cartData = {
      productId: detail.productId,
      productName: detail.productName,
      price: displayPrice,
      originalPrice: displayOriginalPrice ?? null,
      imageUrl: mainImageUrl,
      sellerName: selectedSeller?.sellerName ?? null,
      productSellerId: selectedSeller?.productSellerId ?? null,
    };

    if (isLoggedIn) {
      dispatch(addToCartAsync({
        productId: detail.productId,
        quantity: 1,
        price: displayPrice,
        originalPrice: displayOriginalPrice ?? undefined,
        productSellerId: selectedSeller?.productSellerId ?? undefined,
      }));
    } else {
      dispatch(addToCart(cartData));
    }
  };

  const handleIncrement = () => {
    if (!detail) return;
    const currentQty = getCartQuantity();
    if (isLoggedIn) {
      dispatch(updateCartItemAsync({ productId: detail.productId, quantity: currentQty + 1 }));
    } else {
      dispatch(updateQuantity({ productId: detail.productId, quantity: currentQty + 1 }));
    }
  };

  const handleRemoveFromCart = () => {
    if (!detail) return;
    if (isLoggedIn) {
      dispatch(removeFromCartAsync(detail.productId));
    } else {
      dispatch(removeFromCart(detail.productId));
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-loading">Loading product...</div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-error">
          <p>{error || 'Product not found.'}</p>
          <button type="button" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <Header />
      <div className="product-detail-container">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="product-detail-main">
          <div className="product-detail-header">
            {/* Image gallery */}
            <div className="product-image-gallery">
              <div className="thumbnail-strip">
                {images.length ? (
                  images.map((img, idx) => (
                    <button
                      key={img.imageId}
                      type="button"
                      className={`thumbnail ${selectedImageIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img src={getImageUrl(img.imageUrl, placeholderImage)} alt="" onError={(e) => { e.target.src = BROKEN_IMAGE_PLACEHOLDER; }} />
                    </button>
                  ))
                ) : (
                  <div className="thumbnail placeholder active">
                    <img src={getImageUrl(detail.imageUrl, placeholderImage)} alt="" onError={(e) => { e.target.src = BROKEN_IMAGE_PLACEHOLDER; }} />
                  </div>
                )}
              </div>
              <div className="main-image-wrap">
                <img
                  src={mainImageUrl}
                  alt={detail.productName}
                  className="product-detail-image"
                  onError={(e) => { e.target.src = BROKEN_IMAGE_PLACEHOLDER; }}
                />
              </div>
            </div>

            <div className="product-detail-info">
              {detail.brandName && (
                <Link to="/" className="brand-link">Visit the {detail.brandName} Store</Link>
              )}
              <h1>{detail.productName}</h1>
              {ratingSummary && (
                <div className="product-rating-summary">
                  <StarRating rating={Math.round(ratingSummary.averageRating)} readonly size="medium" />
                  <span className="rating-text">
                    {ratingSummary.averageRating?.toFixed(1) ?? '0.0'} ({ratingSummary.totalReviews ?? 0} reviews)
                  </span>
                  <Link to="#reviews" className="reviews-link">See all {ratingSummary.totalReviews ?? 0} reviews</Link>
                </div>
              )}

              {/* Pricing */}
              <div className="pricing-block">
                {discountPercent != null && discountPercent > 0 && (
                  <span className="discount-badge">-{discountPercent}%</span>
                )}
                <span className="current-price">₹{Number(displayPrice).toFixed(2)}</span>
                {displayOriginalPrice != null && displayOriginalPrice > displayPrice && (
                  <span className="original-price">₹{Number(displayOriginalPrice).toFixed(2)}</span>
                )}
                <p className="tax-note">Inclusive of all taxes.</p>
              </div>

              {/* Selected Seller Info */}
              {selectedSeller && (
                <div className="selected-seller-info">
                  <span className="sold-by-label">Sold by:</span>
                  <span className="sold-by-seller">{selectedSeller.sellerName}</span>
                  {selectedSeller.isFreeDelivery ? (
                    <span className="seller-delivery-badge free">FREE Delivery</span>
                  ) : (
                    <span className="seller-delivery-badge">Delivery ₹{selectedSeller.deliveryCharge?.toFixed(2)}</span>
                  )}
                  <span className="seller-delivery-date">Get it by {selectedSeller.deliveryDate}</span>
                </div>
              )}

              {/* Color */}
              {colors.length > 0 && (
                <div className="option-block">
                  <span className="option-label">Color: {colors.find((c) => c.colorId === selectedColorId)?.colorName ?? 'Select'}</span>
                  <div className="color-options">
                    {colors.map((c) => (
                      <button
                        key={c.colorId}
                        type="button"
                        className={`color-swatch ${selectedColorId === c.colorId ? 'selected' : ''}`}
                        style={{ backgroundColor: c.hexCode || 'var(--bg-secondary)' }}
                        title={c.colorName}
                        onClick={() => setSelectedColorId(c.colorId)}
                      >
                        {!c.hexCode && c.colorName?.charAt(0)}
                      </button>
                    ))}
                  </div>
                  <span className="see-options">See {colors.length} option(s)</span>
                </div>
              )}

              {/* Size */}
              {sizes.length > 0 && (
                <div className="option-block">
                  <span className="option-label">Size: {sizes.find((s) => s.sizeId === selectedSizeId)?.sizeName ?? 'Select'}</span>
                  <div className="size-options">
                    {sizes.map((s) => {
                      const variantForSize = variants.find(
                        (v) => v.sizeId === s.sizeId && (selectedColorId == null || v.colorId === selectedColorId)
                      );
                      const outOfStock = variantForSize && variantForSize.stock <= 0;
                      return (
                        <button
                          key={s.sizeId}
                          type="button"
                          className={`size-btn ${selectedSizeId === s.sizeId ? 'selected' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                          disabled={outOfStock}
                          onClick={() => setSelectedSizeId(s.sizeId)}
                        >
                          {s.sizeName}
                        </button>
                      );
                    })}
                  </div>
                  <Link to="#size-chart" className="size-chart-link">Size Chart</Link>
                </div>
              )}

              <p className="product-detail-stock">
                {displayStock > 0 ? `In stock (${displayStock} available)` : 'Out of stock'}
              </p>
              
              {getCartQuantity() > 0 ? (
                <div className="cart-actions-detail">
                  <div className="quantity-selector-detail">
                    <button 
                      type="button"
                      className="qty-btn delete-btn" 
                      onClick={handleRemoveFromCart}
                      title="Remove from cart"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                    <span className="qty-value">{getCartQuantity()}</span>
                    <button 
                      type="button"
                      className="qty-btn add-btn" 
                      onClick={handleIncrement}
                      title="Add more"
                      disabled={getCartQuantity() >= displayStock}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    type="button"
                    className="go-to-cart-btn-detail"
                    onClick={() => navigate('/cart')}
                  >
                    Go to Cart →
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="add-to-cart-button"
                  onClick={handleAddToCart}
                  disabled={displayStock <= 0 || userRole === 'Admin'}
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>

          {/* Product details / Specifications */}
          {(() => {
            const specsRaw = detail?.specifications;
            const specs = Array.isArray(specsRaw) ? specsRaw : (specsRaw && Array.isArray(specsRaw.$values) ? specsRaw.$values : []);
            return (specs.length > 0 || detail?.shortDescription || detail?.description) && (
            <div className="product-details-section">
              <h2>Product Details</h2>
              {specs.length > 0 && (
                <table className="spec-table">
                  <tbody>
                    {specs.map((spec, idx) => (
                      <tr key={idx}>
                        <td className="spec-name">{spec.attributeName}</td>
                        <td className="spec-value">{spec.attributeValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {(detail.shortDescription || detail.description) && (
                <>
                  <h3>About this item</h3>
                  <ul className="about-list">
                    <li>{detail.shortDescription || detail.description}</li>
                  </ul>
                </>
              )}
            </div>
          );
          })()}

          {/* Sellers Section */}
          {(() => {
            const sellersRaw = detail?.sellers;
            const sellers = Array.isArray(sellersRaw) ? sellersRaw : (sellersRaw && Array.isArray(sellersRaw.$values) ? sellersRaw.$values : []);
            return sellers.length > 0 && (
              <div className="sellers-section">
                <h2>Buy from Sellers</h2>
                <p className="sellers-subtitle">Choose a seller based on price, delivery time, and location</p>
                <div className="sellers-list">
                  {sellers.map((seller) => (
                    <div 
                      key={seller.productSellerId} 
                      className={`seller-card ${selectedSeller?.productSellerId === seller.productSellerId ? 'selected' : ''}`}
                      onClick={() => setSelectedSeller(seller)}
                    >
                      <div className="seller-card-header">
                        <span className="seller-name">{seller.sellerName}</span>
                        {seller.isInStock ? (
                          <span className="in-stock-badge">In Stock</span>
                        ) : (
                          <span className="out-of-stock-badge">Out of Stock</span>
                        )}
                      </div>
                      <div className="seller-card-body">
                        <div className="seller-price">
                          <span className="price-label">Price:</span>
                          <span className="price-value">₹{seller.sellerPrice?.toFixed(2)}</span>
                        </div>
                        <div className="seller-delivery">
                          <div className="delivery-row">
                            <span className="delivery-icon">📦</span>
                            <span className="delivery-text">
                              {seller.isFreeDelivery ? (
                                <span className="free-delivery">FREE Delivery</span>
                              ) : (
                                <span>Delivery: ₹{seller.deliveryCharge?.toFixed(2)}</span>
                              )}
                            </span>
                          </div>
                          <div className="delivery-row">
                            <span className="delivery-icon">📅</span>
                            <span className="delivery-date">
                              Get it by <strong>{seller.deliveryDate}</strong>
                            </span>
                          </div>
                        </div>
                        {seller.sellerAddress && (
                          <div className="seller-address">
                            <span className="address-icon">📍</span>
                            <span className="address-text">{seller.sellerAddress}</span>
                          </div>
                        )}
                        <div className="seller-stock">
                          {seller.stockQuantity > 0 && (
                            <span className="stock-qty">{seller.stockQuantity} units available</span>
                          )}
                        </div>
                      </div>
                      {selectedSeller?.productSellerId === seller.productSellerId && (
                        <div className="selected-indicator">✓ Selected</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div id="reviews">
            <ProductReviews productId={detail.productId} onRatingUpdated={refetchRatingSummary} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
