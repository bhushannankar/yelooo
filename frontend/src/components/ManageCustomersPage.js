import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { API_URL } from '../config';
import './ManageCustomersPage.css';

const customersApiUrl = `${API_URL}/Customers`;

const ManageCustomersPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('jwtToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/');
      return;
    }
    fetchCustomers();
  }, [isLoggedIn, userRole, navigate]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(customersApiUrl, { headers: getAuthHeader() });
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.$values ?? []);
      setCustomers(list);
    } catch (err) {
      const errorMessage = err.response?.status === 401
        ? 'Unauthorized. Please log in again.'
        : err.response?.status === 403
          ? 'Access denied. Admin role required.'
          : err.response?.data?.message || err.message || 'Failed to load customers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.mobile && c.mobile.includes(searchTerm)) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.pinCode && c.pinCode.includes(searchTerm))
  );

  return (
    <div className="manage-customers-wrapper">
      <Header />
      <div className="manage-customers-container">
        <div className="page-header">
          <h1>Customer List</h1>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, email, mobile, city or pin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="manage-customers-loading">Loading customers...</div>
        ) : error ? (
          <div className="manage-customers-error">{error}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="manage-customers-empty">
            {searchTerm ? 'No customers match your search.' : 'No customers found.'}
          </div>
        ) : (
          <div className="customers-table-container">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>City</th>
                  <th>Pin</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.userId}>
                    <td>{customer.name || '—'}</td>
                    <td>{customer.email || '—'}</td>
                    <td>{customer.mobile || '—'}</td>
                    <td>{customer.city || '—'}</td>
                    <td>{customer.pinCode || '—'}</td>
                    <td className="address-cell">{customer.address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="total-count">Total: {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
  );
};

export default ManageCustomersPage;
