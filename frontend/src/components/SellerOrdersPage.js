import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import { API_URL, BASE_URL, BROKEN_IMAGE_PLACEHOLDER, getImageUrl } from '../config';
import './SellerOrdersPage.css';

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryStatuses, setDeliveryStatuses] = useState([]);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    expectedDeliveryDate: '',
    deliveryStatus: '',
    trackingNumber: '',
    deliveryNotes: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('jwtToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchOrders();
    fetchDeliveryStatuses();
  }, [statusFilter]);

  const fetchDeliveryStatuses = async () => {
    try {
      const response = await axios.get(`${API_URL}/SellerOrders/delivery-statuses`, {
        headers: getAuthHeader()
      });
      const data = response.data;
      setDeliveryStatuses(Array.isArray(data) ? data : (data?.$values || []));
    } catch (err) {
      console.error('Error fetching statuses:', err);
      setDeliveryStatuses([]);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await axios.get(`${API_URL}/SellerOrders`, {
        headers: getAuthHeader(),
        params
      });
      
      const ordersData = response.data.orders;
      setOrders(Array.isArray(ordersData) ? ordersData : (ordersData?.$values || []));
      setSummary(response.data.summary);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderItemId) => {
    try {
      const response = await axios.get(`${API_URL}/SellerOrders/${orderItemId}`, {
        headers: getAuthHeader()
      });
      setSelectedOrder(response.data);
    } catch (err) {
      console.error('Error fetching order detail:', err);
    }
  };

  const openEditModal = (order) => {
    setEditForm({
      expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.split('T')[0] : '',
      deliveryStatus: order.deliveryStatus || 'Pending',
      trackingNumber: order.trackingNumber || '',
      deliveryNotes: order.deliveryNotes || '',
      notes: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateDelivery = async () => {
    if (!selectedOrder?.orderItem) return;
    
    setSaving(true);
    try {
      const response = await axios.put(
        `${API_URL}/SellerOrders/${selectedOrder.orderItem.orderItemId}/delivery`,
        {
          expectedDeliveryDate: editForm.expectedDeliveryDate || null,
          deliveryStatus: editForm.deliveryStatus,
          trackingNumber: editForm.trackingNumber || null,
          deliveryNotes: editForm.deliveryNotes || null,
          notes: editForm.notes || null
        },
        { headers: getAuthHeader() }
      );
      
      alert('Delivery information updated successfully!');
      setShowEditModal(false);
      fetchOrders();
      fetchOrderDetail(selectedOrder.orderItem.orderItemId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update delivery information');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    return `status-${(status || 'pending').toLowerCase().replace(/\s+/g, '')}`;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="seller-orders-wrapper">
        <Header />
        <div className="seller-orders-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-orders-wrapper">
      <Header />
      <div className="seller-orders-container">
        <div className="page-header">
          <h1>Order Management</h1>
          <p>Manage your product orders and update delivery information</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Summary Cards - database-driven status counts, always reflect latest from server */}
        {summary && (
          <div className="summary-cards">
            <div className="summary-card total">
              <span className="card-value">{summary.totalOrders ?? summary.TotalOrders ?? 0}</span>
              <span className="card-label">Total Orders</span>
            </div>
            <div className="summary-card pending">
              <span className="card-value">{summary.pendingCount ?? summary.PendingCount ?? 0}</span>
              <span className="card-label">Pending</span>
            </div>
            <div className="summary-card processing">
              <span className="card-value">{summary.processingCount ?? summary.ProcessingCount ?? 0}</span>
              <span className="card-label">Processing</span>
            </div>
            <div className="summary-card shipped">
              <span className="card-value">{summary.shippedCount ?? summary.ShippedCount ?? 0}</span>
              <span className="card-label">Shipped</span>
            </div>
            <div className="summary-card outfordelivery">
              <span className="card-value">{summary.outForDeliveryCount ?? summary.OutForDeliveryCount ?? 0}</span>
              <span className="card-label">Out for Delivery</span>
            </div>
            <div className="summary-card delivered">
              <span className="card-value">{summary.deliveredCount ?? summary.DeliveredCount ?? 0}</span>
              <span className="card-label">Delivered</span>
            </div>
            <div className="summary-card revenue">
              <span className="card-value">₹{(summary.totalRevenue ?? summary.TotalRevenue ?? 0)?.toFixed(2)}</span>
              <span className="card-label">Total Revenue</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Orders</option>
              {deliveryStatuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="orders-content">
          {/* Orders List */}
          <div className="orders-list-panel">
            <h3>Orders ({orders.length})</h3>
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>No orders found</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div
                    key={order.orderItemId}
                    className={`order-card ${selectedOrder?.orderItem?.orderItemId === order.orderItemId ? 'active' : ''}`}
                    onClick={() => fetchOrderDetail(order.orderItemId)}
                  >
                    <div className="order-card-header">
                      <span className="order-id">#{order.orderId}-{order.orderItemId}</span>
                      <span className={`delivery-status ${getStatusClass(order.deliveryStatus)}`}>
                        {order.deliveryStatus}
                      </span>
                    </div>
                    <div className="order-card-body">
                      <div className="product-info">
                        <img 
                          src={getImageUrl(order.productImage)} 
                          alt={order.productName}
                          onError={(e) => { e.target.src = BROKEN_IMAGE_PLACEHOLDER; }}
                        />
                        <div className="product-details">
                          <span className="product-name">{order.productName}</span>
                          <span className="product-qty">Qty: {order.quantity}</span>
                        </div>
                      </div>
                      <div className="order-meta">
                        <span className="order-date">{formatDate(order.orderDate)}</span>
                        <span className="order-total">₹{order.totalPrice?.toFixed(2)}</span>
                      </div>
                      {order.expectedDeliveryDate && (
                        <div className="expected-delivery">
                          Expected: {formatDate(order.expectedDeliveryDate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Detail Panel */}
          <div className="order-detail-panel">
            {selectedOrder?.orderItem ? (
              <>
                <div className="detail-header">
                  <h2>Order #{selectedOrder.orderItem.orderId}-{selectedOrder.orderItem.orderItemId}</h2>
                  <button 
                    className="edit-btn"
                    onClick={() => openEditModal(selectedOrder.orderItem)}
                  >
                    Update Delivery
                  </button>
                </div>

                {/* Product Info */}
                <div className="detail-section">
                  <h4>Product</h4>
                  <div className="product-detail-card">
                    <img 
                      src={getImageUrl(selectedOrder.orderItem.productImage)} 
                      alt={selectedOrder.orderItem.productName}
                      onError={(e) => { e.target.src = BROKEN_IMAGE_PLACEHOLDER; }}
                    />
                    <div className="product-info">
                      <h5>{selectedOrder.orderItem.productName}</h5>
                      <p className="product-desc">{selectedOrder.orderItem.productDescription}</p>
                      <div className="price-info">
                        <span>Qty: {selectedOrder.orderItem.quantity}</span>
                        <span>₹{selectedOrder.orderItem.unitPrice?.toFixed(2)} each</span>
                        <strong>Total: ₹{selectedOrder.orderItem.totalPrice?.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="detail-section">
                  <h4>Delivery Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Status</span>
                      <span className={`value status-badge ${getStatusClass(selectedOrder.orderItem.deliveryStatus)}`}>
                        {selectedOrder.orderItem.deliveryStatus}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Expected Delivery</span>
                      <span className="value">{formatDate(selectedOrder.orderItem.expectedDeliveryDate)}</span>
                    </div>
                    {selectedOrder.orderItem.actualDeliveryDate && (
                      <div className="info-item">
                        <span className="label">Actual Delivery</span>
                        <span className="value">{formatDate(selectedOrder.orderItem.actualDeliveryDate)}</span>
                      </div>
                    )}
                    {selectedOrder.orderItem.trackingNumber && (
                      <div className="info-item">
                        <span className="label">Tracking Number</span>
                        <span className="value tracking">{selectedOrder.orderItem.trackingNumber}</span>
                      </div>
                    )}
                    {selectedOrder.orderItem.deliveryNotes && (
                      <div className="info-item full-width">
                        <span className="label">Delivery Notes</span>
                        <span className="value">{selectedOrder.orderItem.deliveryNotes}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="label">Last Updated</span>
                      <span className="value">{formatDateTime(selectedOrder.orderItem.lastUpdatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="detail-section">
                  <h4>Customer Details</h4>
                  <div className="customer-card">
                    <div className="customer-header">
                      <div className="customer-avatar">
                        {selectedOrder.orderItem.customer?.username?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="customer-info">
                        <span className="customer-name">
                          {selectedOrder.orderItem.customer?.fullName || selectedOrder.orderItem.customer?.username}
                        </span>
                        <span className="customer-email">{selectedOrder.orderItem.customer?.email}</span>
                      </div>
                    </div>
                    <div className="customer-details">
                      {selectedOrder.orderItem.customer?.phoneNumber && (
                        <div className="detail-row">
                          <span className="icon">📞</span>
                          <span>{selectedOrder.orderItem.customer.phoneNumber}</span>
                          {selectedOrder.orderItem.customer.alternatePhoneNumber && (
                            <span className="alt-phone">, {selectedOrder.orderItem.customer.alternatePhoneNumber}</span>
                          )}
                        </div>
                      )}
                      {selectedOrder.orderItem.customer?.address && (
                        <div className="detail-row">
                          <span className="icon">📍</span>
                          <span>
                            {selectedOrder.orderItem.customer.address}
                            {selectedOrder.orderItem.customer.addressLine2 && `, ${selectedOrder.orderItem.customer.addressLine2}`}
                            {selectedOrder.orderItem.customer.landmark && ` (${selectedOrder.orderItem.customer.landmark})`}
                            <br />
                            {selectedOrder.orderItem.customer.city}, {selectedOrder.orderItem.customer.state} - {selectedOrder.orderItem.customer.pinCode}
                            {selectedOrder.orderItem.customer.country && `, ${selectedOrder.orderItem.customer.country}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery History */}
                {selectedOrder.deliveryHistory?.length > 0 && (
                  <div className="detail-section">
                    <h4>Delivery History</h4>
                    <div className="history-list">
                      {(Array.isArray(selectedOrder.deliveryHistory) 
                        ? selectedOrder.deliveryHistory 
                        : selectedOrder.deliveryHistory.$values || []
                      ).map((h, idx) => (
                        <div key={h.historyId || idx} className="history-item">
                          <div className="history-icon">
                            <div className="dot"></div>
                            {idx < selectedOrder.deliveryHistory.length - 1 && <div className="line"></div>}
                          </div>
                          <div className="history-content">
                            <div className="history-header">
                              <span className="status-change">
                                {h.oldStatus && <span className="old">{h.oldStatus}</span>}
                                {h.oldStatus && ' → '}
                                <span className="new">{h.newStatus}</span>
                              </span>
                              <span className="history-date">{formatDateTime(h.changedAt)}</span>
                            </div>
                            {h.newDeliveryDate && h.newDeliveryDate !== h.oldDeliveryDate && (
                              <p className="date-change">
                                Delivery date: {formatDate(h.newDeliveryDate)}
                              </p>
                            )}
                            {h.notes && <p className="history-notes">{h.notes}</p>}
                            <span className="changed-by">by {h.changedBy}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Delivery Information</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Delivery Status</label>
                <select
                  value={editForm.deliveryStatus}
                  onChange={(e) => setEditForm({ ...editForm, deliveryStatus: e.target.value })}
                >
                  {deliveryStatuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Expected Delivery Date</label>
                <input
                  type="date"
                  value={editForm.expectedDeliveryDate}
                  onChange={(e) => setEditForm({ ...editForm, expectedDeliveryDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Tracking Number</label>
                <input
                  type="text"
                  value={editForm.trackingNumber}
                  onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="form-group">
                <label>Delivery Notes (visible to customer)</label>
                <textarea
                  value={editForm.deliveryNotes}
                  onChange={(e) => setEditForm({ ...editForm, deliveryNotes: e.target.value })}
                  placeholder="Notes about delivery (e.g., special instructions)"
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Internal Notes (for history)</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Reason for update (internal record)"
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button 
                className="save-btn" 
                onClick={handleUpdateDelivery}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
