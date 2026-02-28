import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { API_URL } from '../config';
import './ProductOrderedReport.css';

const ProductOrderedReport = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Expanded order details
  const [expandedOrder, setExpandedOrder] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('jwtToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [isLoggedIn, userRole, navigate]);

  const fetchOrders = async (overrides = {}) => {
    try {
      setLoading(true);
      const start = overrides.startDate !== undefined ? overrides.startDate : startDate;
      const end = overrides.endDate !== undefined ? overrides.endDate : endDate;
      const status = overrides.statusFilter !== undefined ? overrides.statusFilter : statusFilter;

      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      if (status) params.append('status', status);

      const response = await axios.get(`${API_URL}/Reports/orders?${params.toString()}`, {
        headers: getAuthHeader()
      });

      // Handle both direct array and $values wrapped response
      const ordersData = response.data.orders;
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData?.$values || []);
      
      // Normalize order items - they might also be wrapped in $values
      const normalizedOrders = ordersList.map(order => ({
        ...order,
        totalAmount: order.orderAmount ?? order.totalAmount,
        items: Array.isArray(order.items) ? order.items : (order.items?.$values || [])
      }));
      
      setOrders(normalizedOrders);
      setSummary(response.data.summary || null);
    } catch (err) {
      setError('Failed to load orders report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchOrders();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    fetchOrders({ startDate: '', endDate: '', statusFilter: '' });
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toFixed(2)}`;
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'completed' || statusLower === 'delivered') return 'status-success';
    if (statusLower === 'pending') return 'status-pending';
    if (statusLower === 'processing' || statusLower === 'shipped' || statusLower === 'outfordelivery') return 'status-processing';
    if (statusLower === 'cancelled') return 'status-cancelled';
    return 'status-default';
  };

  if (!isLoggedIn || userRole !== 'Admin') {
    return null;
  }

  return (
    <div className="report-wrapper">
      <Header />
      <div className="report-container">
        <h1>Product Ordered Report</h1>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="OutForDelivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-buttons">
            <button className="filter-btn" onClick={handleFilter}>Apply Filters</button>
            <button className="clear-btn" onClick={clearFilters}>Clear</button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Orders</h3>
              <p className="summary-value">{summary.totalOrders}</p>
            </div>
            <div className="summary-card">
              <h3>Total Revenue</h3>
              <p className="summary-value">{formatCurrency(summary.totalRevenue)}</p>
            </div>
            <div className="summary-card">
              <h3>Total Items Sold</h3>
              <p className="summary-value">{summary.totalItems}</p>
            </div>
            <div className="summary-card">
              <h3>Avg Order Value</h3>
              <p className="summary-value">{formatCurrency(summary.averageOrderValue)}</p>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">No orders found for the selected criteria.</div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Order Date</th>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Seller ID</th>
                  <th>Seller Name</th>
                  <th>Order Amount</th>
                  <th>Points</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <React.Fragment key={order.orderId}>
                    <tr className={expandedOrder === order.orderId ? 'expanded-row' : ''}>
                      <td>{order.orderNumber ?? `#${order.orderId}`}</td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td>{order.customerId || '–'}</td>
                      <td>
                        <div className="customer-info">
                          <span className="customer-name">{order.customerName}</span>
                          {order.customerEmail && <span className="customer-email">{order.customerEmail}</span>}
                        </div>
                      </td>
                      <td>{order.sellerId || '–'}</td>
                      <td>{order.sellerName || '–'}</td>
                      <td className="total-cell">{formatCurrency(order.orderAmount ?? order.totalAmount)}</td>
                      <td>{(order.points ?? 0).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="details-btn"
                          onClick={() => toggleOrderDetails(order.orderId)}
                        >
                          {expandedOrder === order.orderId ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedOrder === order.orderId && (
                      <tr className="order-details-row">
                        <td colSpan="10">
                          <div className="order-details">
                            <h4>Order Items</h4>
                            <table className="items-table">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Quantity</th>
                                  <th>Unit Price</th>
                                  <th>Subtotal</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items?.map((item, index) => (
                                  <tr key={index}>
                                    <td>{item.productName}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.unitPrice)}</td>
                                    <td>{formatCurrency(item.subtotal)}</td>
                                    <td>
                                      <span className={`status-badge ${getStatusBadgeClass(item.deliveryStatus)}`}>
                                        {item.deliveryStatus || 'Pending'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOrderedReport;
