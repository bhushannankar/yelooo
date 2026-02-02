import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../features/auth/authSlice';
import { syncCartWithServer } from '../features/cart/cartSlice';
import MinimalHeader from './MinimalHeader';
import MinimalFooter from './MinimalFooter';
import './Auth.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);
  const authError = useSelector((state) => state.auth.error);
  const cartItems = useSelector((state) => state.cart.items);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(loginUser({ username, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      // Sync local cart with server after login
      if (cartItems.length > 0) {
        await dispatch(syncCartWithServer(cartItems));
      } else {
        // Fetch cart from server if no local items
        const { fetchCart } = await import('../features/cart/cartSlice');
        dispatch(fetchCart());
      }
      navigate('/'); // Redirect to home on successful login
    }
  };

  return (
    <div className="auth-page">
      <MinimalHeader />
      <div className="auth-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={authStatus === 'loading'}>
            {authStatus === 'loading' ? 'Logging In...' : 'Login'}
          </button>
          {authStatus === 'failed' && <p className="error-message">{authError}</p>}
          <p className="auth-link" style={{ marginTop: 'var(--spacing-sm)' }}>
            <span onClick={() => navigate('/forgot-password')} style={{ cursor: 'pointer', color: 'var(--text-link)' }}>
              Forgot Password?
            </span>
          </p>
          <p className="auth-link">
            Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
          </p>
        </form>
      </div>
      <MinimalFooter />
    </div>
  );
};

export default LoginPage;
