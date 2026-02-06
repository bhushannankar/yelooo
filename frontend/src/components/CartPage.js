import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  removeFromCartAsync,
  updateCartItemAsync,
  clearCartAsync 
} from '../features/cart/cartSlice';
import Header from './Header';
import './CartPage.css';
import placeholderImage from '../images/Kurti1.avif';

const BASE_URL = 'https://localhost:7193';

// Helper to get proper image URL
const getImageUrl = (url) => {
  if (!url) return placeholderImage;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  if (url.startsWith('http')) return url;
  return placeholderImage;
};

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Initialize useNavigate
  const cartItems = useSelector((state) => state.cart.items);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const handleRemoveFromCart = (productId) => {
    if (isLoggedIn) {
      dispatch(removeFromCartAsync(productId));
    } else {
      dispatch(removeFromCart(productId));
    }
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      handleRemoveFromCart(productId);
    } else {
      if (isLoggedIn) {
        dispatch(updateCartItemAsync({ productId, quantity }));
      } else {
        dispatch(updateQuantity({ productId, quantity }));
      }
    }
  };

  const handleClearCart = () => {
    if (isLoggedIn) {
      dispatch(clearCartAsync());
    } else {
      dispatch(clearCart());
    }
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout'); // Navigate to the checkout page
  };

  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="cart-page-wrapper">
      <Header />
      <div className="cart-page-container">
        <h1>Your Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <div className="empty-cart-message">
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart to get started!</p>
        </div>
      ) : (
        <>
          <div className="cart-items-list">
            {cartItems.map((item) => {
              const originalPrice = item.originalPrice != null && Number(item.originalPrice) > Number(item.price) && Number(item.originalPrice) > 0
                ? Number(item.originalPrice)
                : null;
              const discountPercent = originalPrice
                ? Math.round(((originalPrice - item.price) / originalPrice) * 100)
                : 0;
              const subtotal = item.price * item.quantity;
              const subtotalMrp = originalPrice ? originalPrice * item.quantity : subtotal;
              const subtotalDiscount = subtotalMrp - subtotal;
              return (
                <div key={item.productId} className="cart-item-card">
                  <img src={getImageUrl(item.imageUrl)} alt={item.productName} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h3>{item.productName}</h3>
                    <div className="cart-item-price-block">
                      {originalPrice ? (
                        <>
                          <span className="cart-original-price">₹{originalPrice.toFixed(2)}</span>
                          <span className="cart-discount-badge">{discountPercent}% off</span>
                        </>
                      ) : null}
                      <p className="price">Price: ₹{item.price ? item.price.toFixed(2) : 'N/A'}</p>
                    </div>
                    <div className="quantity-control">
                      <label>Quantity:</label>
                      <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                    <div className="cart-item-subtotal">
                      <p className="price">Subtotal: ₹{subtotal.toFixed(2)}</p>
                      {subtotalDiscount > 0 && (
                        <span className="cart-item-savings">You save ₹{subtotalDiscount.toFixed(2)}</span>
                      )}
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.productId)} className="remove-button">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-summary-section">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Total Items:</span>
              <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="button-group">
              <button onClick={handleClearCart} className="clear-cart-button">Clear Cart</button>
              <button onClick={handleProceedToCheckout} className="checkout-button">Proceed to Checkout</button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default CartPage;
