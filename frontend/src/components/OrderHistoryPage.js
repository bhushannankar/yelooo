import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './OrderHistoryPage.css';

const BASE_URL = 'https://localhost:7193';

// Helper to get image URL with proper base URL
const getImageUrl = (url) => {
  if (!url) return '/placeholder-product.png';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = `${BASE_URL}/api/Orders`;

  const getAuthHeader = () => {
    const token = localStorage.getItem('jwtToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/my-orders`, {
        headers: getAuthHeader()
      });
      const ordersData = Array.isArray(response.data) ? response.data : (response.data?.$values || []);
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/my-orders/${orderId}`, {
        headers: getAuthHeader()
      });
      const orderData = response.data;
      // Normalize items array
      if (orderData.items && !Array.isArray(orderData.items)) {
        orderData.items = orderData.items.$values || [];
      }
      setSelectedOrder(orderData);
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError('Failed to load order details.');
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      case 'processing':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
        );
      case 'shipped':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        );
      case 'delivered':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        );
      case 'cancelled':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrackingSteps = (status) => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: 'placed' },
      { key: 'processing', label: 'Processing', icon: 'processing' },
      { key: 'shipped', label: 'Shipped', icon: 'shipped' },
      { key: 'delivered', label: 'Delivered', icon: 'delivered' }
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status?.toLowerCase()) || 0;

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="order-history-wrapper">
        <Header />
        <div className="order-history-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-wrapper">
      <Header />
      <div className="order-history-container">
        <div className="order-history-header">
          <h1>My Orders</h1>
          <p>{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {orders.length === 0 && !error ? (
          <div className="no-orders">
            <svg viewBox="0 0 24 24" fill="currentColor" width="80" height="80">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <h3>No orders yet</h3>
            <p>You haven't placed any orders. Start shopping to see your orders here!</p>
            <button className="shop-now-btn" onClick={() => navigate('/')}>
              Shop Now
            </button>
          </div>
        ) : (
          <div className="orders-content">
            <div className="orders-list">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className={`order-card ${selectedOrder?.orderId === order.orderId ? 'active' : ''}`}
                  onClick={() => fetchOrderDetail(order.orderId)}
                >
                  <div className="order-card-header">
                    <div className="order-id">
                      <span className="label">Order</span>
                      <span className="value">#{order.orderId}</span>
                    </div>
                    <span className={`order-status ${getStatusClass(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>
                  <div className="order-card-body">
                    <div className="order-date">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                      </svg>
                      {formatDate(order.orderDate)}
                    </div>
                    <div className="order-summary">
                      <span className="items-count">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                      <span className="order-total">₹{order.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-detail-panel">
              {selectedOrder ? (
                <>
                  <div className="detail-header">
                    <h2>Order #{selectedOrder.orderId}</h2>
                    <span className={`order-status large ${getStatusClass(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </span>
                  </div>

                  <div className="tracking-section">
                    <h3>Order Tracking</h3>
                    <div className="tracking-timeline">
                      {(() => {
                        const steps = getTrackingSteps(selectedOrder.status);
                        return steps.map((step, index) => {
                          // Line should be green only if the NEXT step is also completed
                          const nextStepCompleted = index < steps.length - 1 && steps[index + 1].completed;
                          return (
                            <div
                              key={step.key}
                              className={`tracking-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''} ${nextStepCompleted ? 'line-complete' : ''}`}
                            >
                              <div className="step-indicator">
                                <div className="step-circle">
                                  {step.completed && (
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                  )}
                                </div>
                                {index < 3 && <div className="step-line"></div>}
                              </div>
                              <span className="step-label">{step.label}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="order-items-section">
                    <h3>Items in this order</h3>
                    <div className="order-items-list">
                      {selectedOrder.items?.map((item) => (
                        <div key={item.orderItemId} className="order-item-card">
                          <div className="order-item-main">
                            <img
                              src={getImageUrl(item.productImage)}
                              alt={item.productName}
                              className="item-image"
                              onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                            />
                            <div className="item-details">
                              <h4 
                                className="item-name clickable"
                                onClick={() => navigate(`/product/${item.productId}`)}
                              >
                                {item.productName}
                              </h4>
                              <div className="item-meta">
                                <span className="item-qty">Qty: {item.quantity}</span>
                                <span className="item-price">₹{item.unitPrice?.toFixed(2)} each</span>
                              </div>
                            </div>
                            <div className="item-total">
                              ₹{item.total?.toFixed(2)}
                            </div>
                          </div>
                          <div className="item-delivery-info">
                            <div className="delivery-status-row">
                              <span className={`item-delivery-status ${item.deliveryStatus?.toLowerCase() || 'pending'}`}>
                                {item.deliveryStatus || 'Pending'}
                              </span>
                              {item.trackingNumber && (
                                <span className="tracking-number">
                                  Tracking: {item.trackingNumber}
                                </span>
                              )}
                            </div>
                            <div className="delivery-date-row">
                              {item.deliveryStatus === 'Delivered' && item.actualDeliveryDate ? (
                                <span className="delivered-date">
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                  Delivered on {new Date(item.actualDeliveryDate).toLocaleDateString('en-IN', { 
                                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
                                  })}
                                </span>
                              ) : item.expectedDeliveryDate ? (
                                <span className="expected-date">
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                                  </svg>
                                  Expected by {new Date(item.expectedDeliveryDate).toLocaleDateString('en-IN', { 
                                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
                                  })}
                                </span>
                              ) : (
                                <span className="no-date">Delivery date will be updated soon</span>
                              )}
                            </div>
                            {item.deliveryNotes && (
                              <div className="delivery-notes">
                                <span className="notes-label">Note:</span> {item.deliveryNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-total-section">
                    <div className="total-row">
                      <span>Order Total</span>
                      <span className="total-amount">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="60" height="60">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  <p>Select an order to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
