import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './ManageSellersPage.css';

const API_URL = 'https://localhost:7193/api/Sellers';

const ManageSellersPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletingSeller, setDeletingSeller] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('jwtToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/');
      return;
    }
    fetchSellers();
  }, [isLoggedIn, userRole, navigate]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching sellers from:', API_URL);
      console.log('Auth header:', getAuthHeader());
      const response = await axios.get(API_URL, { headers: getAuthHeader() });
      console.log('Sellers response:', response.data);
      const data = response.data;
      const sellersArray = Array.isArray(data) ? data : (data?.$values ?? []);
      setSellers(sellersArray);
    } catch (err) {
      console.error('Error fetching sellers:', err);
      const errorMessage = err.response?.status === 401 
        ? 'Unauthorized. Please log in again.'
        : err.response?.status === 403
          ? 'Access denied. Admin role required.'
          : err.response?.data?.message || err.message || 'Failed to load sellers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Edit functions
  const openEditModal = (seller) => {
    setEditingSeller(seller);
    setEditForm({
      username: seller.username,
      email: seller.email,
      password: ''
    });
    setEditError(null);
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditingSeller(null);
    setEditError(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.username.trim() || !editForm.email.trim()) {
      setEditError('Username and email are required');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      await axios.put(`${API_URL}/${editingSeller.userId}`, editForm, {
        headers: getAuthHeader()
      });
      closeEditModal();
      fetchSellers();
    } catch (err) {
      setEditError(err.response?.data || 'Failed to update seller');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete functions
  const openDeleteModal = (seller) => {
    setDeletingSeller(seller);
    setDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteModal(false);
    setDeletingSeller(null);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_URL}/${deletingSeller.userId}`, {
        headers: getAuthHeader()
      });
      closeDeleteModal();
      fetchSellers();
    } catch (err) {
      alert('Failed to delete seller');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isLoggedIn || userRole !== 'Admin') {
    return null;
  }

  return (
    <div className="manage-sellers-wrapper">
      <Header />
      <div className="manage-sellers-container">
        <div className="page-header">
          <h1>Manage Sellers</h1>
          <button 
            className="add-seller-btn"
            onClick={() => navigate('/admin/add-seller')}
          >
            + Add New Seller
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading">Loading sellers...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredSellers.length === 0 ? (
          <div className="no-sellers">
            {searchTerm ? 'No sellers match your search.' : 'No sellers found. Add your first seller!'}
          </div>
        ) : (
          <div className="sellers-table-container">
            <table className="sellers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map(seller => (
                  <tr key={seller.userId}>
                    <td>{seller.userId}</td>
                    <td>{seller.username}</td>
                    <td>{seller.email}</td>
                    <td>{formatDate(seller.createdAt)}</td>
                    <td className="actions-cell">
                      <button 
                        className="edit-btn"
                        onClick={() => openEditModal(seller)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => openDeleteModal(seller)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="total-count">
          Total Sellers: {filteredSellers.length}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Seller</h2>
            {editError && <div className="modal-error">{editError}</div>}
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleEditChange}
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  placeholder="Enter new password"
                  disabled={editLoading}
                />
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={closeEditModal} disabled={editLoading}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Seller</h2>
            <p>Are you sure you want to delete seller <strong>{deletingSeller?.username}</strong>?</p>
            <p className="warning">This action cannot be undone.</p>
            <div className="modal-buttons">
              <button type="button" onClick={closeDeleteModal} disabled={deleteLoading}>
                Cancel
              </button>
              <button 
                type="button" 
                className="confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Seller'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSellersPage;
