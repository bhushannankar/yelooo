import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { API_URL, normalizeList } from '../config';
import './ManageSellersPage.css';

const sellersApiUrl = `${API_URL}/Sellers`;

/** Build selectable items at Sub, Tertiary, Quaternary levels for category checkboxes. */
function flattenCategorySelections(categories, normalizeList) {
  const items = [];
  normalizeList(categories).forEach((c) => {
    normalizeList(c?.subCategories).forEach((s) => {
      items.push({ type: 'sub', id: s.subCategoryId, path: `${c.categoryName} › ${s.subCategoryName}` });
      normalizeList(s?.tertiaryCategories).forEach((t) => {
        items.push({ type: 'tertiary', id: t.tertiaryCategoryId, path: `${c.categoryName} › ${s.subCategoryName} › ${t.tertiaryCategoryName}` });
        normalizeList(t?.quaternaryCategories).forEach((q) => {
          items.push({ type: 'quaternary', id: q.quaternaryCategoryId, path: `${c.categoryName} › ${s.subCategoryName} › ${t.tertiaryCategoryName} › ${q.quaternaryCategoryName}` });
        });
      });
    });
  });
  return items;
}

const ManageSellersPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryTree, setCategoryTree] = useState([]);

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: '',
    commissionPercent: ''
  });
  const [editSubCategoryIds, setEditSubCategoryIds] = useState([]);
  const [editTertiaryCategoryIds, setEditTertiaryCategoryIds] = useState([]);
  const [editQuaternaryCategoryIds, setEditQuaternaryCategoryIds] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editFetching, setEditFetching] = useState(false);

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

  useEffect(() => {
    axios.get(`${API_URL}/Categories/with-subcategories`)
      .then((res) => setCategoryTree(normalizeList(res.data)))
      .catch(() => setCategoryTree([]));
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching sellers from:', sellersApiUrl);
      console.log('Auth header:', getAuthHeader());
      const response = await axios.get(sellersApiUrl, { headers: getAuthHeader() });
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
  const openEditModal = async (seller) => {
    setEditingSeller(seller);
    setEditForm({
      username: seller.username,
      email: seller.email,
      password: '',
      commissionPercent: seller.commissionPercent != null ? String(seller.commissionPercent) : ''
    });
    setEditSubCategoryIds([]);
    setEditTertiaryCategoryIds([]);
    setEditQuaternaryCategoryIds([]);
    setEditError(null);
    setEditModal(true);
    setEditFetching(true);
    try {
      const res = await axios.get(`${sellersApiUrl}/${seller.userId}`, { headers: getAuthHeader() });
      const data = res.data;
      setEditForm(prev => ({
        ...prev,
        username: data.username ?? prev.username,
        email: data.email ?? prev.email,
        commissionPercent: data.commissionPercent != null ? String(data.commissionPercent) : prev.commissionPercent
      }));
      setEditSubCategoryIds(normalizeList(data.subCategoryIds) ?? []);
      setEditTertiaryCategoryIds(normalizeList(data.tertiaryCategoryIds) ?? []);
      setEditQuaternaryCategoryIds(normalizeList(data.quaternaryCategoryIds) ?? []);
    } catch (err) {
      setEditError(err.response?.data?.message || err.response?.data || 'Failed to load seller details.');
    } finally {
      setEditFetching(false);
    }
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditingSeller(null);
    setEditError(null);
    setEditSubCategoryIds([]);
    setEditTertiaryCategoryIds([]);
    setEditQuaternaryCategoryIds([]);
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
      const payload = { username: editForm.username, email: editForm.email };
      if (editForm.password) payload.password = editForm.password;
      if (editForm.commissionPercent !== '') payload.commissionPercent = parseFloat(editForm.commissionPercent);
      payload.subCategoryIds = editSubCategoryIds || [];
      payload.tertiaryCategoryIds = editTertiaryCategoryIds || [];
      payload.quaternaryCategoryIds = editQuaternaryCategoryIds || [];
      await axios.put(`${sellersApiUrl}/${editingSeller.userId}`, payload, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
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
      await axios.delete(`${sellersApiUrl}/${deletingSeller.userId}`, {
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
    if (dateString == null || dateString === '') return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    const year = d.getFullYear();
    if (year < 1980) return 'N/A'; // default/min date from backend when column missing
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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
            type="button"
            className="add-seller-btn"
            onClick={() => navigate('/admin/add-seller')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add New Seller
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
                  <th>Category</th>
                  <th>Commission %</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map(seller => {
                  const categoryList = normalizeList(seller.categories ?? seller.Categories);
                  return (
                  <tr key={seller.userId}>
                    <td>{seller.userId}</td>
                    <td>{seller.username}</td>
                    <td>{seller.email}</td>
                    <td className="category-cell" title={categoryList.length > 0 ? categoryList.join(', ') : undefined}>
                      {categoryList.length > 0 ? categoryList.join(', ') : '—'}
                    </td>
                    <td>{seller.commissionPercent != null ? `${seller.commissionPercent}%` : '-'}</td>
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
                );})}
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
              <div className="form-group">
                <label>Commission % (Admin receives from seller transactions)</label>
                <input
                  type="number"
                  name="commissionPercent"
                  value={editForm.commissionPercent}
                  onChange={handleEditChange}
                  placeholder="e.g. 10"
                  min="0"
                  max="100"
                  step="0.5"
                  disabled={editLoading}
                />
              </div>
              <div className="form-group categories-edit">
                <label>Categories this seller can sell in</label>
                <small className="form-hint">Select at SubCategory, Tertiary, or Quaternary level. You can update the selection.</small>
                {editFetching ? (
                  <p className="modal-loading-msg">Loading categories...</p>
                ) : (
                  <div className="edit-modal-category-list">
                    {flattenCategorySelections(categoryTree, normalizeList).map((item) => {
                      const checked = item.type === 'sub' ? editSubCategoryIds.includes(item.id)
                        : item.type === 'tertiary' ? editTertiaryCategoryIds.includes(item.id)
                          : editQuaternaryCategoryIds.includes(item.id);
                      const setter = item.type === 'sub' ? setEditSubCategoryIds : item.type === 'tertiary' ? setEditTertiaryCategoryIds : setEditQuaternaryCategoryIds;
                      const typeLabel = item.type === 'sub' ? 'Sub' : item.type === 'tertiary' ? 'Tert' : 'Quat';
                      return (
                        <label key={`${item.type}-${item.id}`} className="edit-category-check">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setter(prev => [...prev, item.id]);
                              } else {
                                setter(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                            disabled={editLoading}
                          />
                          <span className="edit-category-path"><span className="category-type-badge">{typeLabel}</span> {item.path}</span>
                        </label>
                      );
                    })}
                    {flattenCategorySelections(categoryTree, normalizeList).length === 0 && !editFetching && (
                      <p className="no-categories-msg">No categories yet. Add them under Admin → Manage Categories.</p>
                    )}
                  </div>
                )}
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
