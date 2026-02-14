import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_URL, normalizeList } from '../config';
import './SellersInAreaPage.css';

const SellersInAreaPage = () => {
  const [pinCode, setPinCode] = useState('');
  const [city, setCity] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tertiaryCategories, setTertiaryCategories] = useState([]);
  const [quaternaryCategories, setQuaternaryCategories] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: '',
    subCategoryId: '',
    tertiaryCategoryId: '',
    quaternaryCategoryId: '',
  });
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/Categories`).then((res) => {
      setCategories(normalizeList(res.data));
    }).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!filters.categoryId) {
      setSubCategories([]);
      setFilters((prev) => ({ ...prev, subCategoryId: '', tertiaryCategoryId: '', quaternaryCategoryId: '' }));
      return;
    }
    axios.get(`${API_URL}/SubCategories`, { params: { categoryId: filters.categoryId } })
      .then((res) => setSubCategories(normalizeList(res.data)))
      .catch(() => setSubCategories([]));
    setFilters((prev) => ({ ...prev, subCategoryId: '', tertiaryCategoryId: '', quaternaryCategoryId: '' }));
  }, [filters.categoryId]);

  useEffect(() => {
    if (!filters.subCategoryId) {
      setTertiaryCategories([]);
      setFilters((prev) => ({ ...prev, tertiaryCategoryId: '', quaternaryCategoryId: '' }));
      return;
    }
    axios.get(`${API_URL}/TertiaryCategories`, { params: { subCategoryId: filters.subCategoryId } })
      .then((res) => setTertiaryCategories(normalizeList(res.data)))
      .catch(() => setTertiaryCategories([]));
    setFilters((prev) => ({ ...prev, tertiaryCategoryId: '', quaternaryCategoryId: '' }));
  }, [filters.subCategoryId]);

  useEffect(() => {
    if (!filters.tertiaryCategoryId) {
      setQuaternaryCategories([]);
      setFilters((prev) => ({ ...prev, quaternaryCategoryId: '' }));
      return;
    }
    axios.get(`${API_URL}/QuaternaryCategories`, { params: { tertiaryCategoryId: filters.tertiaryCategoryId } })
      .then((res) => setQuaternaryCategories(normalizeList(res.data)))
      .catch(() => setQuaternaryCategories([]));
    setFilters((prev) => ({ ...prev, quaternaryCategoryId: '' }));
  }, [filters.tertiaryCategoryId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    const params = {};
    if (pinCode.trim()) params.pinCode = pinCode.trim();
    if (city.trim()) params.city = city.trim();
    if (filters.quaternaryCategoryId) params.quaternaryCategoryId = filters.quaternaryCategoryId;
    else if (filters.tertiaryCategoryId) params.tertiaryCategoryId = filters.tertiaryCategoryId;
    else if (filters.subCategoryId) params.subCategoryId = filters.subCategoryId;
    else if (filters.categoryId) params.categoryId = filters.categoryId;

    axios.get(`${API_URL}/SellersList`, { params })
      .then((res) => setSellers(normalizeList(res.data)))
      .catch(() => setSellers([]))
      .finally(() => setLoading(false));
  };

  const handleClearFilters = () => {
    setPinCode('');
    setCity('');
    setFilters({ categoryId: '', subCategoryId: '', tertiaryCategoryId: '', quaternaryCategoryId: '' });
    setSellers([]);
    setSearched(false);
  };

  return (
    <div className="sellers-in-area-wrapper">
      <Header />
      <main className="sellers-in-area-main">
        <h1 className="sellers-in-area-heading">Find Sellers in Your Area</h1>
        <p className="sellers-in-area-subheading">
          Filter by pin code, city, or product category to discover sellers near you.
        </p>

        <form onSubmit={handleSearch} className="sellers-in-area-filters">
          <div className="sellers-in-area-filter-row">
            <label className="sellers-in-area-label">
              Pin code
              <input
                type="text"
                className="sellers-in-area-input"
                placeholder="e.g. 110001"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
              />
            </label>
            <label className="sellers-in-area-label">
              City
              <input
                type="text"
                className="sellers-in-area-input"
                placeholder="e.g. Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
          </div>

          <div className="sellers-in-area-filter-row sellers-in-area-category-row">
            <label className="sellers-in-area-label">
              Primary category
              <select
                className="sellers-in-area-select"
                value={filters.categoryId}
                onChange={(e) => setFilters((p) => ({ ...p, categoryId: e.target.value }))}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </select>
            </label>
            <label className="sellers-in-area-label">
              Sub category
              <select
                className="sellers-in-area-select"
                value={filters.subCategoryId}
                onChange={(e) => setFilters((p) => ({ ...p, subCategoryId: e.target.value }))}
              >
                <option value="">All</option>
                {subCategories.map((s) => (
                  <option key={s.subCategoryId} value={s.subCategoryId}>{s.subCategoryName}</option>
                ))}
              </select>
            </label>
            <label className="sellers-in-area-label">
              Tertiary category
              <select
                className="sellers-in-area-select"
                value={filters.tertiaryCategoryId}
                onChange={(e) => setFilters((p) => ({ ...p, tertiaryCategoryId: e.target.value }))}
              >
                <option value="">All</option>
                {tertiaryCategories.map((t) => (
                  <option key={t.tertiaryCategoryId} value={t.tertiaryCategoryId}>{t.tertiaryCategoryName}</option>
                ))}
              </select>
            </label>
            <label className="sellers-in-area-label">
              Quaternary category
              <select
                className="sellers-in-area-select"
                value={filters.quaternaryCategoryId}
                onChange={(e) => setFilters((p) => ({ ...p, quaternaryCategoryId: e.target.value }))}
              >
                <option value="">All</option>
                {quaternaryCategories.map((q) => (
                  <option key={q.quaternaryCategoryId} value={q.quaternaryCategoryId}>{q.quaternaryCategoryName}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="sellers-in-area-actions">
            <button type="submit" className="sellers-in-area-btn sellers-in-area-btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search Sellers'}
            </button>
            <button type="button" className="sellers-in-area-btn sellers-in-area-btn-secondary" onClick={handleClearFilters}>
              Clear
            </button>
          </div>
        </form>

        {searched && (
          <section className="sellers-in-area-results">
            {loading ? (
              <p className="sellers-in-area-loading">Loading sellers…</p>
            ) : sellers.length === 0 ? (
              <p className="sellers-in-area-empty">No sellers found for your filters. Try different pin code, city, or category.</p>
            ) : (
              <>
                <p className="sellers-in-area-count">{sellers.length} seller{sellers.length !== 1 ? 's' : ''} found</p>
                <div className="sellers-in-area-grid">
                  {sellers.map((seller) => (
                    <article key={seller.userId} className="sellers-in-area-card">
                      <div className="sellers-in-area-card-header">
                        <span className="sellers-in-area-card-name">{seller.fullName || seller.username || '—'}</span>
                        {seller.referralCode && (
                          <span className="sellers-in-area-card-ref">ID: {seller.referralCode}</span>
                        )}
                      </div>
                      <div className="sellers-in-area-card-body">
                        {(seller.city || seller.state || seller.pinCode) && (
                          <p className="sellers-in-area-card-location">
                            {[seller.city, seller.state].filter(Boolean).join(', ')}
                            {seller.pinCode && ` ${seller.pinCode}`}
                          </p>
                        )}
                        {seller.address && (
                          <p className="sellers-in-area-card-address">{seller.address}</p>
                        )}
                        {seller.phoneNumber && (
                          <p className="sellers-in-area-card-phone">{seller.phoneNumber}</p>
                        )}
                        {seller.email && (
                          <p className="sellers-in-area-card-email">{seller.email}</p>
                        )}
                        {Array.isArray(seller.categoryNames) && seller.categoryNames.length > 0 && (
                          <div className="sellers-in-area-card-categories">
                            <span className="sellers-in-area-card-categories-label">Categories:</span>
                            <ul className="sellers-in-area-card-categories-list">
                              {seller.categoryNames.slice(0, 5).map((name, i) => (
                                <li key={i}>{name}</li>
                              ))}
                              {seller.categoryNames.length > 5 && (
                                <li>+{seller.categoryNames.length - 5} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SellersInAreaPage;
