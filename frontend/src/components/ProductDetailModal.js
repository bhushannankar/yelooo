import React from 'react';
import ProductReviews from './ProductReviews';
import placeholderImage from '../images/Kurti1.avif';
import './ProductDetailModal.css';

const ProductDetailModal = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-body">
          <div className="product-detail-header">
            <img 
              src={product.imageUrl || placeholderImage} 
              alt={product.productName} 
              className="product-detail-image"
            />
            <div className="product-detail-info">
              <h2>{product.productName}</h2>
              <p className="product-detail-description">{product.description}</p>
              <p className="product-detail-price">₹{product.price ? product.price.toFixed(2) : 'N/A'}</p>
            </div>
          </div>
          <ProductReviews productId={product.productId} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
