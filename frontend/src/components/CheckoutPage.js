import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { clearCartAsync, updateCartItemAsync, removeFromCartAsync, updateQuantity, removeFromCart } from '../features/cart/cartSlice';
import { createOrder } from '../features/order/orderSlice';
import { fetchPaymentMethods } from '../features/paymentMethods/paymentMethodsSlice';
import Header from './Header';
import { API_URL, BASE_URL, BROKEN_IMAGE_PLACEHOLDER, getImageUrl } from '../config';
import './CheckoutPage.css';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const orderStatus = useSelector((state) => state.order.status);
  const orderError = useSelector((state) => state.order.error);
  const paymentMethods = useSelector((state) => state.paymentMethods.items);
  const paymentMethodsStatus = useSelector((state) => state.paymentMethods.status);

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsPerRupee, setPointsPerRupee] = useState(10);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [benefits, setBenefits] = useState([]);
  const userRole = useSelector((state) => state.auth.userRole);

  useEffect(() => {
    if (paymentMethodsStatus === 'idle') {
      dispatch(fetchPaymentMethods());
    }
  }, [paymentMethodsStatus, dispatch]);

  useEffect(() => {
    if (paymentMethods.length > 0 && selectedPaymentMethodId === null) {
      setSelectedPaymentMethodId(paymentMethods[0].paymentMethodId);
    }
  }, [paymentMethods, selectedPaymentMethodId]);

  useEffect(() => {
    const fetchPointsData = async () => {
      if (userRole === 'Admin' || userRole === 'Seller') return;
      try {
        const [configRes, balanceRes, benefitsRes] = await Promise.all([
          axios.get(`${API_URL}/Points/redemption-config`),
          axios.get(`${API_URL}/Points/my-balance`, { headers: getAuthHeader() }),
          axios.get(`${API_URL}/Points/my-benefits`, { headers: getAuthHeader() })
        ]);
        setPointsPerRupee(configRes.data?.pointsPerRupee ?? 10);
        setPointsBalance(balanceRes.data?.currentBalance ?? 0);
        setBenefits(benefitsRes.data?.benefits ?? []);
      } catch {
        // Ignore - user may not have points
      }
    };
    fetchPointsData();
  }, [userRole]);

  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const benefitDiscountEst = benefits.reduce((sum, b) => {
    if (b.benefitType === 'ExtraDiscountPercent') return sum + totalAmount * (b.benefitValue / 100);
    if (b.benefitType === 'FixedDiscount' || b.benefitType === 'FreeShipping') return sum + Math.min(b.benefitValue, totalAmount - sum);
    return sum;
  }, 0);
  const amountAfterBenefits = Math.max(0, totalAmount - benefitDiscountEst);
  const maxPointsDiscount = amountAfterBenefits;
  const maxPointsToRedeem = Math.min(pointsBalance, Math.floor(maxPointsDiscount * pointsPerRupee));
  const pointsDiscount = Math.min((pointsToRedeem || 0) / pointsPerRupee, amountAfterBenefits);
  const finalTotal = Math.max(0, amountAfterBenefits - pointsDiscount);
  const totalMRP = cartItems.reduce((total, item) => {
    const mrp = item.originalPrice != null && Number(item.originalPrice) > Number(item.price) ? Number(item.originalPrice) : item.price;
    return total + mrp * item.quantity;
  }, 0);
  const totalDiscount = totalMRP - totalAmount;
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Calculate expected delivery date (7 days from now)
  const getExpectedDelivery = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate discount percentage (database-driven from originalPrice)
  const getDiscountPercent = (price, originalPrice) => {
    const mrp = originalPrice != null && Number(originalPrice) > Number(price) ? Number(originalPrice) : price;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  // Handle quantity change
  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    const token = localStorage.getItem('jwtToken');
    if (token) {
      dispatch(updateCartItemAsync({ productId: item.productId, quantity: newQuantity }));
    } else {
      dispatch(updateQuantity({ productId: item.productId, quantity: newQuantity }));
    }
  };

  // Handle remove item
  const handleRemoveItem = (item) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      dispatch(removeFromCartAsync(item.productId));
    } else {
      dispatch(removeFromCart(item.productId));
    }
  };

  // Handle save for later (for now just remove from cart)
  const handleSaveForLater = (item) => {
    alert(`"${item.productName}" saved for later!`);
    handleRemoveItem(item);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (selectedPaymentMethodId === null) {
      alert('Please select a payment method.');
      return;
    }

    const orderItems = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    try {
      const resultAction = await dispatch(createOrder({
        items: orderItems,
        paymentMethodId: selectedPaymentMethodId,
        pointsToRedeem: pointsToRedeem || 0
      }));

      if (createOrder.fulfilled.match(resultAction)) {
        alert('Order placed successfully!');
        dispatch(clearCartAsync());
        navigate('/');
      } else {
        alert(`Failed to place order: ${orderError || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`An error occurred while placing the order: ${error.message}`);
    }
  };

  let paymentMethodsContent;
  if (paymentMethodsStatus === 'loading') {
    paymentMethodsContent = <div>Loading payment methods...</div>;
  } else if (paymentMethodsStatus === 'succeeded') {
    paymentMethodsContent = (
      <div className="payment-method-section">
        <h3>Select Payment Method</h3>
        {paymentMethods.map((method) => (
          <label key={method.paymentMethodId}>
            <input
              type="radio"
              value={method.paymentMethodId}
              checked={selectedPaymentMethodId === method.paymentMethodId}
              onChange={() => setSelectedPaymentMethodId(method.paymentMethodId)}
            />
            {method.methodName}
          </label>
        ))}

        {paymentMethods.find(m => m.paymentMethodId === selectedPaymentMethodId)?.methodName === 'QR Code Payment' && (
          <div className="qr-code-details">
            <p>Please scan the QR code to complete your payment.</p>
            <div className="qr-code-placeholder">QR Code Image Here</div>
          </div>
        )}
      </div>
    );
  } else if (paymentMethodsStatus === 'failed') {
    paymentMethodsContent = <div className="error-message">Error loading payment methods: {orderError}</div>;
  }

  return (
    <div className="checkout-wrapper">
      <Header />
      <div className="checkout-page-container">
        <div className="checkout-main">
          {/* Left Section - Order Items */}
          <div className="checkout-left">
            <div className="checkout-section">
              <div className="section-header">
                <h2>Order Summary</h2>
                <span className="item-count">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
              </div>

              {cartItems.length === 0 ? (
                <div className="empty-cart-message">
                  <p>Your cart is empty.</p>
                  <button onClick={() => navigate('/')} className="continue-shopping-btn">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="checkout-items-list">
                  {cartItems.map((item) => {
                    const mrp = item.originalPrice != null && Number(item.originalPrice) > Number(item.price) ? Number(item.originalPrice) : item.price;
                    const discountPercent = getDiscountPercent(item.price, item.originalPrice);
                    const showDiscount = mrp > item.price && discountPercent > 0;
                    
                    return (
                      <div key={item.productId} className="checkout-item-card">
                        <div className="item-image-container">
                          <img 
                            src={getImageUrl(item.imageUrl)} 
                            alt={item.productName}
                            onError={(e) => { e.target.src = BROKEN_IMAGE_PLACEHOLDER; }}
                          />
                        </div>
                        <div className="item-details">
                          <h3 className="item-name">{item.productName}</h3>
                          
                          <div className="item-seller">
                            Seller: {item.sellerName || 'Yelooo Store'}
                            <span className="assured-badge">
                              <svg viewBox="0 0 24 24" fill="#2874f0" width="14" height="14">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                              Assured
                            </span>
                          </div>

                          <div className="item-pricing">
                            {showDiscount && <span className="item-mrp">₹{mrp.toFixed(0)}</span>}
                            <span className="item-price">₹{item.price?.toFixed(0)}</span>
                            {showDiscount && <span className="item-discount">{discountPercent}% Off</span>}
                          </div>

                          <div className="item-actions">
                            <div className="quantity-selector">
                              <button 
                                className="qty-btn delete-btn"
                                onClick={() => handleRemoveItem(item)}
                                title="Remove from cart"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                              <span className="qty-value">{item.quantity}</span>
                              <button 
                                className="qty-btn add-btn"
                                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                title="Add more"
                              >
                                +
                              </button>
                            </div>
                            <button className="action-btn save-btn" onClick={() => handleSaveForLater(item)}>
                              Save for later
                            </button>
                            <button className="action-btn remove-btn" onClick={() => handleRemoveItem(item)}>
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="item-delivery">
                          <span className="delivery-label">Delivery by</span>
                          <span className="delivery-date">{getExpectedDelivery()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            {cartItems.length > 0 && (
              <div className="checkout-section payment-section">
                <div className="section-header">
                  <h2>Payment Method</h2>
                </div>
                {paymentMethodsContent}
              </div>
            )}
          </div>

          {/* Right Section - Price Details */}
          {cartItems.length > 0 && (
            <div className="checkout-right">
              <div className="price-details-card">
                <h3>Price Details</h3>
                <div className="price-row">
                  <span>Price ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span>₹{totalMRP.toFixed(0)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="price-row discount-row">
                    <span>Discount</span>
                    <span className="discount-amount">− ₹{totalDiscount.toFixed(0)}</span>
                  </div>
                )}
                {benefitDiscountEst > 0 && (
                  <div className="price-row discount-row">
                    <span>Points benefit</span>
                    <span className="discount-amount">− ₹{benefitDiscountEst.toFixed(0)}</span>
                  </div>
                )}
                {userRole !== 'Admin' && userRole !== 'Seller' && pointsBalance > 0 && (
                  <div className="price-row points-redeem-row">
                    <div>
                      <span>Use points</span>
                      <span className="points-available">(Available: {pointsBalance.toFixed(0)})</span>
                    </div>
                    <div className="points-input-wrap">
                      <input
                        type="number"
                        min="0"
                        max={maxPointsToRedeem}
                        value={pointsToRedeem || ''}
                        onChange={(e) => setPointsToRedeem(Math.min(parseFloat(e.target.value) || 0, maxPointsToRedeem))}
                        placeholder="0"
                      />
                      <span className="points-hint">= ₹{(pointsToRedeem / pointsPerRupee || 0).toFixed(0)} off</span>
                    </div>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="price-row discount-row">
                    <span>Points redeemed</span>
                    <span className="discount-amount">− ₹{pointsDiscount.toFixed(0)}</span>
                  </div>
                )}
                <div className="price-row">
                  <span>Delivery Charges</span>
                  <span className="free-delivery">FREE</span>
                </div>
                <div className="price-row total-row">
                  <span>Total Amount</span>
                  <span>₹{finalTotal.toFixed(0)}</span>
                </div>
                {(totalDiscount > 0 || benefitDiscountEst > 0 || pointsDiscount > 0) && (
                  <div className="savings-banner">
                    You will save ₹{(totalDiscount + benefitDiscountEst + pointsDiscount).toFixed(0)} on this order
                  </div>
                )}

                <button
                  className="place-order-button"
                  onClick={handlePlaceOrder}
                  disabled={cartItems.length === 0 || orderStatus === 'loading' || selectedPaymentMethodId === null}
                >
                  {orderStatus === 'loading' ? 'Placing Order...' : 'PLACE ORDER'}
                </button>

                {orderStatus === 'failed' && <p className="error-message">Error: {orderError}</p>}

                <div className="secure-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
