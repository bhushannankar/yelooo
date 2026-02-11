import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { API_URL, BASE_URL, BROKEN_IMAGE_PLACEHOLDER, getImageUrl } from '../config';
import './SellerDashboard.css';
import placeholderImage from '../images/Kurti1.avif';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);
  const username = useSelector((state) => state.auth.username);
  const token = localStorage.getItem('jwtToken');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Seller') {
      navigate('/login');
      return;
    }
    fetchSellerProducts();
  }, [isLoggedIn, userRole, navigate]);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/ProductSellers/my-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      const arr = Array.isArray(data) ? data : (data?.$values ?? []);
      setProducts(arr);
    } catch (err) {
      setError('Failed to load your products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product.productSellerId);
    setEditForm({
      sellerPrice: product.sellerPrice,
      deliveryDays: product.deliveryDays,
      deliveryCharge: product.deliveryCharge,
      sellerAddress: product.sellerAddress || '',
      stockQuantity: product.stockQuantity,
      isActive: product.isActive
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (productSellerId) => {
    try {
      await axios.put(`${API_URL}/ProductSellers/${productSellerId}`, {
        sellerPrice: parseFloat(editForm.sellerPrice),
        deliveryDays: parseInt(editForm.deliveryDays),
        deliveryCharge: parseFloat(editForm.deliveryCharge),
        sellerAddress: editForm.sellerAddress,
        stockQuantity: parseInt(editForm.stockQuantity),
        isActive: editForm.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingProduct(null);
      fetchSellerProducts();
    } catch (err) {
      alert('Failed to update product details.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({});
  };

  const handleToggleActive = async (product) => {
    try {
      await axios.put(`${API_URL}/ProductSellers/${product.productSellerId}`, {
        sellerPrice: product.sellerPrice,
        deliveryDays: product.deliveryDays,
        deliveryCharge: product.deliveryCharge,
        sellerAddress: product.sellerAddress,
        stockQuantity: product.stockQuantity,
        isActive: !product.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSellerProducts();
    } catch (err) {
      alert('Failed to update product status.');
    }
  };

  if (!isLoggedIn || userRole !== 'Seller') {
    return null;
  }

  return (
    <div className="seller-dashboard">
      <Header />
      <div className="seller-dashboard-container">
        <div className="seller-dashboard-header">
          <h1>My Products</h1>
          <p>Welcome, {username}! Manage your product listings below.</p>
        </div>

        {loading && <div className="loading-message">Loading your products...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className="no-products">
            <p>You don't have any products listed yet.</p>
            <p>Contact admin to get products assigned to your seller account.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="seller-products-grid">
            {products.map((product) => (
              <div key={product.productSellerId} className={`seller-product-card ${!product.isActive ? 'inactive' : ''}`}>
                <div className="product-image-container">
                  <img 
                    src={getImageUrl(product.productImage, placeholderImage)} 
                    alt={product.productName}
                    onError={(e) => { e.target.src = BROKEN_IMAGE_PLACEHOLDER; }}
                  />
                  {!product.isActive && <div className="inactive-overlay">Inactive</div>}
                </div>
                
                <div className="product-info">
                  <h3>{product.productName}</h3>
                  <p className="base-price">Base Price: ₹{product.basePrice?.toFixed(2)}</p>
                  
                  {editingProduct === product.productSellerId ? (
                    <div className="edit-form">
                      <div className="form-row">
                        <label>Your Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.sellerPrice}
                          onChange={(e) => handleEditChange('sellerPrice', e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <label>Stock Quantity</label>
                        <input
                          type="number"
                          value={editForm.stockQuantity}
                          onChange={(e) => handleEditChange('stockQuantity', e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <label>Delivery Days</label>
                        <input
                          type="number"
                          value={editForm.deliveryDays}
                          onChange={(e) => handleEditChange('deliveryDays', e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <label>Delivery Charge (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.deliveryCharge}
                          onChange={(e) => handleEditChange('deliveryCharge', e.target.value)}
                          placeholder="0 for free"
                        />
                      </div>
                      <div className="form-row">
                        <label>Your Address</label>
                        <input
                          type="text"
                          value={editForm.sellerAddress}
                          onChange={(e) => handleEditChange('sellerAddress', e.target.value)}
                          placeholder="City, State, Country"
                        />
                      </div>
                      <div className="form-row checkbox-row">
                        <label>
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) => handleEditChange('isActive', e.target.checked)}
                          />
                          Active
                        </label>
                      </div>
                      <div className="edit-actions">
                        <button className="save-btn" onClick={() => handleSaveEdit(product.productSellerId)}>
                          Save
                        </button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="product-details">
                      <p className="seller-price">Your Price: <strong>₹{product.sellerPrice?.toFixed(2)}</strong></p>
                      <p className="stock">Stock: <strong>{product.stockQuantity}</strong> units</p>
                      <p className="delivery">
                        Delivery: {product.deliveryDays} days | 
                        {product.deliveryCharge === 0 ? ' FREE' : ` ₹${product.deliveryCharge?.toFixed(2)}`}
                      </p>
                      {product.sellerAddress && (
                        <p className="address">📍 {product.sellerAddress}</p>
                      )}
                      <div className="product-actions">
                        <button className="edit-btn" onClick={() => handleEditClick(product)}>
                          Edit
                        </button>
                        <button 
                          className={`toggle-btn ${product.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleActive(product)}
                        >
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
