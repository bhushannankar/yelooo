import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { fetchProducts } from '../features/products/productsSlice';
import Header from './Header';
import './AdminProductsPage.css';

const API_URL = 'https://localhost:7193/api';
const BASE_URL = 'https://localhost:7193';

// Helper to convert relative image paths to full URLs
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return url;
};

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);
  const token = localStorage.getItem('jwtToken');

  const [products, setProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImages, setEditImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef(null);

  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/login');
    }
  }, [isLoggedIn, userRole, navigate]);

  useEffect(() => {
    fetchAllProducts();
    fetchSubCategories();
  }, []);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/Products`);
      const data = response.data;
      const arr = Array.isArray(data) ? data : (data?.$values ?? []);
      setProducts(arr);
    } catch (err) {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/SubCategories`);
      const data = response.data;
      const arr = Array.isArray(data) ? data : (data?.$values ?? []);
      setSubCategories(arr);
    } catch (err) {
      console.error('Failed to load subcategories');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subCategory?.subCategoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Edit handlers
  const openEditModal = async (product) => {
    setEditError('');
    setEditProduct(product);
    setEditForm({
      productName: product.productName || '',
      description: product.description || '',
      price: product.price || 0,
      originalPrice: product.originalPrice ?? '',
      stock: product.stock || 0,
      subCategoryId: product.subCategoryId || '',
      brandName: product.brandName || '',
      shortDescription: product.shortDescription || '',
    });

    // Fetch product images
    try {
      const response = await axios.get(`${API_URL}/ProductImages/product/${product.productId}`);
      const images = Array.isArray(response.data) ? response.data : (response.data?.$values ?? []);
      setEditImages(images.map((img) => ({
        id: img.imageId,
        imageUrl: getImageUrl(img.imageUrl),
        isExisting: true,
        uploadedUrl: getImageUrl(img.imageUrl),
      })));
    } catch (err) {
      // Product might not have images
      setEditImages([]);
    }

    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditProduct(null);
    setEditForm({});
    setEditImages([]);
    setEditError('');
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    addEditFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addEditFiles = (files) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type) || file.size > maxSize) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImages((prev) => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result,
          uploadedUrl: null,
          uploading: false,
          isExisting: false,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadEditImage = async (imageId) => {
    const image = editImages.find((img) => img.id === imageId);
    if (!image || !image.file || image.uploadedUrl) return;

    setEditImages((prev) =>
      prev.map((img) => img.id === imageId ? { ...img, uploading: true } : img)
    );

    const formData = new FormData();
    formData.append('file', image.file);

    try {
      const response = await axios.post(`${API_URL}/ImageUpload/product`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      const uploadedUrl = `https://localhost:7193${response.data.imageUrl}`;
      setEditImages((prev) =>
        prev.map((img) => img.id === imageId ? { ...img, uploadedUrl, uploading: false } : img)
      );
    } catch (err) {
      setEditImages((prev) =>
        prev.map((img) => img.id === imageId ? { ...img, uploading: false, error: 'Upload failed' } : img)
      );
    }
  };

  const uploadAllEditImages = async () => {
    const toUpload = editImages.filter((img) => img.file && !img.uploadedUrl && !img.uploading);
    for (const img of toUpload) {
      await uploadEditImage(img.id);
    }
  };

  const removeEditImage = (imageId) => {
    setEditImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    const productName = editForm.productName?.trim();
    const subCategoryId = editForm.subCategoryId ? parseInt(editForm.subCategoryId, 10) : 0;
    const price = parseFloat(editForm.price);
    const originalPrice = editForm.originalPrice !== '' && editForm.originalPrice != null ? parseFloat(editForm.originalPrice) : null;
    const stock = parseInt(editForm.stock, 10);

    if (!productName) {
      setEditError('Product name is required.');
      return;
    }
    if (!subCategoryId) {
      setEditError('Please select a subcategory.');
      return;
    }

    // Check for unuploaded images
    const unuploaded = editImages.filter((img) => img.file && !img.uploadedUrl && !img.error);
    if (unuploaded.length > 0) {
      setEditError('Please upload all images before saving.');
      return;
    }

    const uploadedImages = editImages
      .filter((img) => img.uploadedUrl)
      .map((img) => ({ imageUrl: img.uploadedUrl }));

    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/Products/${editProduct.productId}`,
        {
          productName,
          description: editForm.description?.trim() || null,
          price,
          originalPrice: originalPrice,
          imageUrl: uploadedImages.length > 0 ? uploadedImages[0].imageUrl : editProduct.imageUrl,
          stock,
          subCategoryId,
          brandName: editForm.brandName?.trim() || null,
          shortDescription: editForm.shortDescription?.trim() || null,
          images: uploadedImages.length > 0 ? uploadedImages : null,
        },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      closeEditModal();
      fetchAllProducts();
      dispatch(fetchProducts(null));
    } catch (err) {
      setEditError(err.response?.data || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    setError('');
    try {
      await axios.delete(`${API_URL}/Products/${productToDelete.productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      closeDeleteModal();
      setError('');
      fetchAllProducts();
      dispatch(fetchProducts(null));
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data;
      setError(typeof msg === 'string' ? msg : 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isLoggedIn || userRole !== 'Admin') {
    return null;
  }

  const hasUnuploadedImages = editImages.some((img) => img.file && !img.uploadedUrl && !img.uploading && !img.error);
  const isUploading = editImages.some((img) => img.uploading);

  return (
    <div className="admin-products-page">
      <Header />

      <div className="admin-container">
        <div className="admin-toolbar">
          <h1>Product Management</h1>
          <div className="toolbar-actions">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <Link to="/add-product" className="add-product-btn">+ Add Product</Link>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products">No products found.</div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.productId} className="product-card">
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={getImageUrl(product.imageUrl)} alt={product.productName} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.productName}</h3>
                    <p className="product-brand">{product.brandName || 'No brand'}</p>
                    <p className="product-category">
                      {product.subCategory?.category?.categoryName} › {product.subCategory?.subCategoryName}
                    </p>
                    <div className="product-details">
                      <div className="product-price-block">
                        {product.originalPrice != null && Number(product.originalPrice) > Number(product.price) && Number(product.originalPrice) > 0 && (
                          <>
                            <span className="product-original-price">₹{Number(product.originalPrice).toFixed(2)}</span>
                            <span className="product-discount-badge">
                              {Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100)}% off
                            </span>
                          </>
                        )}
                        <span className="product-price">₹{product.price != null ? Number(product.price).toFixed(2) : 'N/A'}</span>
                      </div>
                      <span className="product-stock">Stock: {product.stock}</span>
                    </div>
                  </div>
                  <div className="product-actions">
                    <button className="edit-btn" onClick={() => openEditModal(product)}>Edit</button>
                    <button className="delete-btn" onClick={() => openDeleteModal(product)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && editProduct && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    name="productName"
                    value={editForm.productName}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>SubCategory *</label>
                  <select
                    name="subCategoryId"
                    value={editForm.subCategoryId}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="">Select subcategory</option>
                    {subCategories.map((s) => (
                      <option key={s.subCategoryId} value={s.subCategoryId}>
                        {s.categoryName} › {s.subCategoryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <input
                  name="shortDescription"
                  value={editForm.shortDescription}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Original Price / MRP (optional, for discount)</label>
                  <input
                    name="originalPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave empty if no discount"
                    value={editForm.originalPrice}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={editForm.stock}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Brand Name</label>
                <input
                  name="brandName"
                  value={editForm.brandName}
                  onChange={handleEditFormChange}
                />
              </div>

              {/* Images */}
              <div className="form-group">
                <label>Product Images</label>
                {editImages.length > 0 && (
                  <div className="edit-images-grid">
                    {editImages.map((img, index) => (
                      <div key={img.id} className={`edit-image-item ${index === 0 ? 'main' : ''}`}>
                        <img src={img.preview || img.imageUrl} alt={`Product ${index + 1}`} />
                        {index === 0 && <span className="main-badge">Main</span>}
                        {img.uploading && <div className="uploading-overlay">Uploading...</div>}
                        {img.uploadedUrl && !img.isExisting && <div className="uploaded-check">✓</div>}
                        <button
                          type="button"
                          className="remove-img-btn"
                          onClick={() => removeEditImage(img.id)}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="add-images-zone" onClick={() => fileInputRef.current?.click()}>
                  <span>+ Add Images</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditFilesSelect}
                    style={{ display: 'none' }}
                  />
                </div>
                {hasUnuploadedImages && (
                  <button type="button" className="upload-btn" onClick={uploadAllEditImages} disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload New Images'}
                  </button>
                )}
              </div>

              {editError && <div className="edit-error">{editError}</div>}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving || isUploading || hasUnuploadedImages}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && productToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Product</h2>
              <button className="close-btn" onClick={closeDeleteModal}>×</button>
            </div>
            <div className="delete-content">
              <p>Are you sure you want to delete this product?</p>
              <div className="delete-product-info">
                <strong>{productToDelete.productName}</strong>
                <span>₹{productToDelete.price?.toFixed(2)}</span>
              </div>
              <p className="warning">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
