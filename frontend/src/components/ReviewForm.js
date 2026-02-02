import React, { useState } from 'react';
import axios from 'axios';
import StarRating from './StarRating';
import './ReviewForm.css';

const API_URL = 'https://localhost:7193/api/Reviews';

const ReviewForm = ({ productId, onReviewSubmitted, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('jwtToken');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review.');
      return;
    }

    setSubmitting(true);

    try {
      if (!token) {
        setError('Please login to submit a review.');
        return;
      }

      const response = await axios.post(
        `${API_URL}`,
        {
          productId: productId,
          rating: rating,
          comment: comment.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.message) {
        // Success
        setRating(0);
        setComment('');
        onReviewSubmitted();
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError('Please login to submit a review.');
        } else {
          setError(err.response.data.message || 'Failed to submit review. Please try again.');
        }
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form-container">
      <h4>Write a Review</h4>
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label>Your Rating *</label>
          <StarRating 
            rating={rating} 
            onRatingChange={setRating} 
            readonly={false}
            size="large"
          />
        </div>

        <div className="form-group">
          <label htmlFor="comment">Your Review *</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={5}
            required
            disabled={submitting}
            maxLength={2000}
          />
          <span className="character-count">
            {comment.length} / 2000 characters
          </span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="cancel-button"
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting || rating === 0 || comment.trim().length < 10}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
