import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { fetchProducts } from '../features/products/productsSlice';
import Header from './Header';
import { API_URL, BASE_URL } from '../config';
import './AddProductPage.css';

const AddProductPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);
  const token = localStorage.getItem('jwtToken');
  const fileInputRef = useRef(null);

  const [subCategories, setSubCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    productName: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    subCategoryId: '',
    brandName: '',
    shortDescription: '',
  });

  // Seller assignments for this product
  const [sellerAssignments, setSellerAssignments] = useState([]);

  // Multiple images state: array of { id, file, preview, uploadedUrl, uploading, error }
  const [images, setImages] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subCatRes, sellersRes] = await Promise.all([
          axios.get(`${API_URL}/SubCategories`),
          axios.get(`${API_URL}/ProductSellers/sellers`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        const subCatData = subCatRes.data;
        const subCatArr = Array.isArray(subCatData) ? subCatData : (subCatData?.$values ?? []);
        setSubCategories(subCatArr);
        
        const sellersData = sellersRes.data;
        const sellersArr = Array.isArray(sellersData) ? sellersData : (sellersData?.$values ?? []);
        setSellers(sellersArr);
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/login');
    }
  }, [isLoggedIn, userRole, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Seller assignment functions
  const addSellerAssignment = () => {
    setSellerAssignments(prev => [...prev, {
      id: Date.now(),
      sellerId: '',
      sellerPrice: '',
      deliveryDays: '5',
      deliveryCharge: '0',
      sellerAddress: '',
      stockQuantity: ''
    }]);
  };

  const removeSellerAssignment = (id) => {
    setSellerAssignments(prev => prev.filter(s => s.id !== id));
  };

  const updateSellerAssignment = (id, field, value) => {
    setSellerAssignments(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const addFiles = (files) => {
    setUploadError('');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    const maxImages = 10;

    if (images.length + files.length > maxImages) {
      setUploadError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const errors = [];

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type.`);
        return;
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large (max 5MB).`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage = {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result,
          uploadedUrl: null,
          uploading: false,
          error: null,
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    if (errors.length > 0) {
      setUploadError(errors.join(' '));
    }
  };

  const uploadImage = async (imageId) => {
    const imageIndex = images.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) return;

    const image = images[imageIndex];
    if (!image.file || image.uploadedUrl) return;

    // Set uploading state
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, uploading: true, error: null } : img
      )
    );

    const formData = new FormData();
    formData.append('file', image.file);

    try {
      const response = await axios.post(
        `${API_URL}/ImageUpload/product`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const uploadedUrl = `${BASE_URL}${response.data.imageUrl}`;
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, uploadedUrl, uploading: false } : img
        )
      );
    } catch (err) {
      const errorMsg =
        err.response?.status === 401
          ? 'Please log in as Admin.'
          : err.response?.data || 'Upload failed.';
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? { ...img, uploading: false, error: typeof errorMsg === 'string' ? errorMsg : 'Upload failed.' }
            : img
        )
      );
    }
  };

  const uploadAllImages = async () => {
    const imagesToUpload = images.filter((img) => img.file && !img.uploadedUrl && !img.uploading);
    for (const img of imagesToUpload) {
      await uploadImage(img.id);
    }
  };

  const removeImage = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  // Drag and drop reordering
  const handleImageDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setImages((prev) => {
      const newImages = [...prev];
      const [draggedItem] = newImages.splice(draggedIndex, 1);
      newImages.splice(index, 0, draggedItem);
      return newImages;
    });
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const productName = form.productName?.trim();
    const subCategoryId = form.subCategoryId ? parseInt(form.subCategoryId, 10) : 0;
    const price = parseFloat(form.price);
    const originalPrice = form.originalPrice !== '' && form.originalPrice != null ? parseFloat(form.originalPrice) : null;
    const stock = parseInt(form.stock, 10);

    if (!productName) {
      setError('Product name is required.');
      return;
    }
    if (!subCategoryId) {
      setError('Please select a subcategory.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price.');
      return;
    }
    if (originalPrice != null && (isNaN(originalPrice) || originalPrice < 0)) {
      setError('Original price must be a valid positive number.');
      return;
    }
    if (originalPrice != null && originalPrice <= price) {
      setError('Original price must be greater than selling price to show discount.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setError('Please enter a valid stock quantity.');
      return;
    }

    // Check if there are images that need uploading
    const unuploadedImages = images.filter((img) => img.file && !img.uploadedUrl && !img.error);
    if (unuploadedImages.length > 0) {
      setError('Please upload all images before saving.');
      return;
    }

    // Get uploaded image URLs
    const uploadedImages = images
      .filter((img) => img.uploadedUrl)
      .map((img) => ({ imageUrl: img.uploadedUrl }));

    setSaving(true);
    try {
      // Create product
      const productResponse = await axios.post(
        `${API_URL}/Products`,
        {
          productName,
          description: form.description?.trim() || null,
          price,
          originalPrice,
          imageUrl: uploadedImages.length > 0 ? uploadedImages[0].imageUrl : null,
          stock,
          subCategoryId,
          brandName: form.brandName?.trim() || null,
          shortDescription: form.shortDescription?.trim() || null,
          images: uploadedImages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Get the created product ID
      const createdProductId = productResponse.data?.productId;

      // Bind sellers to the product
      if (createdProductId && sellerAssignments.length > 0) {
        const validAssignments = sellerAssignments.filter(s => s.sellerId && s.sellerPrice);
        for (const assignment of validAssignments) {
          try {
            await axios.post(
              `${API_URL}/ProductSellers`,
              {
                productId: createdProductId,
                sellerId: parseInt(assignment.sellerId),
                sellerPrice: parseFloat(assignment.sellerPrice),
                deliveryDays: parseInt(assignment.deliveryDays) || 5,
                deliveryCharge: parseFloat(assignment.deliveryCharge) || 0,
                sellerAddress: assignment.sellerAddress?.trim() || null,
                stockQuantity: parseInt(assignment.stockQuantity) || 0
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          } catch (sellerErr) {
            console.error('Failed to bind seller:', sellerErr);
          }
        }
      }

      setSuccess(true);
      dispatch(fetchProducts(null));
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Please log in as Admin.');
      } else if (err.response?.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : 'Failed to add product.');
      } else {
        setError('Failed to add product.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn || userRole !== 'Admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="add-product-page">
        <div className="add-product-loading">Loading...</div>
      </div>
    );
  }

  const hasUnuploadedImages = images.some((img) => img.file && !img.uploadedUrl && !img.uploading && !img.error);
  const isUploading = images.some((img) => img.uploading);

  return (
    <div className="add-product-page">
      <Header />

      <div className="add-product-container">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>← Back</button>
        <div className="add-product-main">
          <h1>Add Product</h1>
          <p className="add-product-desc">Fill in the fields below to add a new product. You can upload multiple images from different angles.</p>

          {success && (
            <div className="success-message">Product added successfully. Redirecting...</div>
          )}

          <form onSubmit={handleSubmit} className="add-product-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="productName">Product Name *</label>
                <input
                  id="productName"
                  name="productName"
                  type="text"
                  value={form.productName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Men's Jeans"
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label htmlFor="subCategoryId">SubCategory *</label>
                <select
                  id="subCategoryId"
                  name="subCategoryId"
                  value={form.subCategoryId}
                  onChange={handleChange}
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
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="shortDescription">Short Description</label>
              <input
                id="shortDescription"
                name="shortDescription"
                type="text"
                value={form.shortDescription}
                onChange={handleChange}
                placeholder="Brief summary (e.g. for About this item)"
                maxLength={500}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label htmlFor="originalPrice">Original Price / MRP (optional, for discount)</label>
                <input
                  id="originalPrice"
                  name="originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.originalPrice}
                  onChange={handleChange}
                  placeholder="Leave empty if no discount"
                />
              </div>
              <div className="form-group">
                <label htmlFor="stock">Stock *</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  required
                  placeholder="0"
                />
              </div>
            </div>

            {/* Multiple Images Upload Section */}
            <div className="form-group image-upload-section">
              <label>Product Images (up to 10)</label>
              <p className="image-hint">First image will be the main product image. Drag to reorder.</p>
              
              {/* Uploaded images grid */}
              {images.length > 0 && (
                <div className="images-grid">
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      className={`image-item ${index === 0 ? 'main-image' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleImageDragStart(e, index)}
                      onDragOver={(e) => handleImageDragOver(e, index)}
                      onDragEnd={handleImageDragEnd}
                    >
                      <img src={img.preview} alt={`Product ${index + 1}`} />
                      {index === 0 && <span className="main-badge">Main</span>}
                      {img.uploading && (
                        <div className="image-overlay">
                          <span className="uploading-indicator">Uploading...</span>
                        </div>
                      )}
                      {img.uploadedUrl && (
                        <div className="image-uploaded-check">✓</div>
                      )}
                      {img.error && (
                        <div className="image-error-badge" title={img.error}>!</div>
                      )}
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(img.id)}
                        title="Remove image"
                        disabled={img.uploading}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone for adding more images */}
              <div 
                className="image-drop-zone multi"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-zone-content">
                  <span className="drop-icon">📷</span>
                  <span>Drag & drop images here, or click to select</span>
                  <span className="file-hint">JPG, PNG, GIF, WebP (max 5MB each, up to 10 images)</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFilesSelect}
                  className="file-input-hidden"
                  multiple
                />
              </div>

              {/* Upload all button */}
              {hasUnuploadedImages && (
                <div className="upload-actions">
                  <button 
                    type="button" 
                    className="upload-btn"
                    onClick={uploadAllImages}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : `Upload ${images.filter(img => img.file && !img.uploadedUrl && !img.error).length} Image(s)`}
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="upload-error">{uploadError}</div>
              )}

              {images.length > 0 && images.every((img) => img.uploadedUrl) && (
                <div className="upload-success">
                  ✓ All {images.length} image(s) uploaded successfully
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="brandName">Brand Name</label>
              <input
                id="brandName"
                name="brandName"
                type="text"
                value={form.brandName}
                onChange={handleChange}
                placeholder="e.g. Levi's"
                maxLength={200}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Seller Assignments Section */}
            <div className="form-group seller-section">
              <label>Seller Assignments</label>
              <p className="seller-hint">Add sellers who will sell this product with their pricing and delivery details.</p>
              
              {sellerAssignments.map((assignment, index) => (
                <div key={assignment.id} className="seller-assignment-card">
                  <div className="seller-card-header">
                    <span>Seller {index + 1}</span>
                    <button 
                      type="button" 
                      className="remove-seller-btn"
                      onClick={() => removeSellerAssignment(assignment.id)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="seller-card-body">
                    <div className="seller-row">
                      <div className="seller-field">
                        <label>Seller *</label>
                        <select
                          value={assignment.sellerId}
                          onChange={(e) => updateSellerAssignment(assignment.id, 'sellerId', e.target.value)}
                        >
                          <option value="">Select Seller</option>
                          {sellers.map(s => (
                            <option key={s.sellerId} value={s.sellerId}>
                              {s.sellerName} ({s.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="seller-field">
                        <label>Seller Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={assignment.sellerPrice}
                          onChange={(e) => updateSellerAssignment(assignment.id, 'sellerPrice', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="seller-row">
                      <div className="seller-field">
                        <label>Delivery Days</label>
                        <input
                          type="number"
                          min="1"
                          value={assignment.deliveryDays}
                          onChange={(e) => updateSellerAssignment(assignment.id, 'deliveryDays', e.target.value)}
                          placeholder="5"
                        />
                      </div>
                      <div className="seller-field">
                        <label>Delivery Charge (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={assignment.deliveryCharge}
                          onChange={(e) => updateSellerAssignment(assignment.id, 'deliveryCharge', e.target.value)}
                          placeholder="0 for free"
                        />
                      </div>
                      <div className="seller-field">
                        <label>Stock Qty</label>
                        <input
                          type="number"
                          min="0"
                          value={assignment.stockQuantity}
                          onChange={(e) => updateSellerAssignment(assignment.id, 'stockQuantity', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="seller-row">
                      <div className="seller-field full-width">
                        <label>Seller Address</label>
                        <input
                          type="text"
                          value={assignment.sellerAddress}
                          onChange={(e) => updateSellerAssignment(assignment.id, 'sellerAddress', e.target.value)}
                          placeholder="e.g. Mumbai, Maharashtra, India"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button type="button" className="add-seller-btn" onClick={addSellerAssignment}>
                + Add Seller
              </button>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={() => navigate(-1)} disabled={saving || isUploading}>
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={saving || isUploading || hasUnuploadedImages}>
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductPage;
