import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import './ProductReviews.css';

const API_URL = 'https://localhost:7193/api/Reviews';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const username = useSelector((state) => state.auth.username);

  useEffect(() => {
    if (!productId) return;
    fetchReviews();
    fetchSummary();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/product/${productId}`);
      // API may return array or object with $values (EF Core Preserve)
      const data = response.data;
      const reviewsArray = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.$values) ? data.$values : []);
      setReviews(reviewsArray);
      setError(null);
    } catch (err) {
      setError('Failed to load reviews.');
      setReviews([]);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/product/${productId}/summary`);
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching review summary:', err);
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews();
    fetchSummary();
    setShowReviewForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!productId) {
    return null;
  }

  if (loading) {
    return <div className="reviews-loading">Loading reviews...</div>;
  }

  const reviewsList = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h3>Customer Reviews</h3>
        {summary && (
          <div className="reviews-summary">
            <div className="average-rating">
              <span className="average-rating-value">
                {typeof summary.averageRating === 'number' ? summary.averageRating.toFixed(1) : '0.0'}
              </span>
              <StarRating rating={Math.round(summary.averageRating)} readonly={true} size="small" />
              <span className="average-rating-count">
                ({(summary.totalReviews ?? 0)} {(summary.totalReviews ?? 0) === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            {summary && summary.totalReviews > 0 && summary.ratingDistribution && (
              <div className="rating-breakdown">
                <div className="rating-bar">
                  <span>5★</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${((summary.ratingDistribution.fiveStar || 0) / summary.totalReviews) * 100}%` }}
                    ></div>
                  </div>
                  <span>{summary.ratingDistribution.fiveStar}</span>
                </div>
                <div className="rating-bar">
                  <span>4★</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${((summary.ratingDistribution.fourStar || 0) / summary.totalReviews) * 100}%` }}
                    ></div>
                  </div>
                  <span>{summary.ratingDistribution.fourStar}</span>
                </div>
                <div className="rating-bar">
                  <span>3★</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${((summary.ratingDistribution.threeStar || 0) / summary.totalReviews) * 100}%` }}
                    ></div>
                  </div>
                  <span>{summary.ratingDistribution.threeStar}</span>
                </div>
                <div className="rating-bar">
                  <span>2★</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${((summary.ratingDistribution.twoStar || 0) / summary.totalReviews) * 100}%` }}
                    ></div>
                  </div>
                  <span>{summary.ratingDistribution.twoStar}</span>
                </div>
                <div className="rating-bar">
                  <span>1★</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${((summary.ratingDistribution.oneStar || 0) / summary.totalReviews) * 100}%` }}
                    ></div>
                  </div>
                  <span>{summary.ratingDistribution.oneStar}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoggedIn && !showReviewForm && (
        <button 
          className="write-review-button"
          onClick={() => setShowReviewForm(true)}
        >
          Write a Review
        </button>
      )}

      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {error && <div className="reviews-error">{error}</div>}

      <div className="reviews-list">
        {reviewsList.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review this product!</p>
            {!isLoggedIn && (
              <p className="login-prompt">
                <a href="/login">Login</a> to write a review.
              </p>
            )}
          </div>
        ) : (
          reviewsList.map((review) => (
            <div key={review.reviewId} className="review-item">
              <div className="review-header">
                <div className="review-user">
                  <strong>{review.username}</strong>
                  <StarRating rating={review.rating} readonly={true} size="small" />
                </div>
                <span className="review-date">{formatDate(review.createdAt)}</span>
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
