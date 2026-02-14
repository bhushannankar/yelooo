import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Header from './Header';
import { API_URL, normalizeList } from '../config';
import './AdminCategoriesPage.css';

const AdminCategoriesPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);
  const token = localStorage.getItem('jwtToken');

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tertiaryCategories, setTertiaryCategories] = useState([]);
  const [quaternaryCategories, setQuaternaryCategories] = useState([]);
  const [maxCategories, setMaxCategories] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingLevel, setEditingLevel] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [addLevel, setAddLevel] = useState(null);
  const [addParentId, setAddParentId] = useState(null);
  const [addName, setAddName] = useState('');

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [isLoggedIn, userRole, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [limitsRes, catRes, subRes, tertRes, quatRes] = await Promise.all([
        axios.get(`${API_URL}/Categories/limits`),
        axios.get(`${API_URL}/Categories`),
        axios.get(`${API_URL}/SubCategories`),
        axios.get(`${API_URL}/TertiaryCategories`),
        axios.get(`${API_URL}/QuaternaryCategories`)
      ]);
      const limits = limitsRes?.data;
      if (limits != null && typeof limits.maxCategories === 'number') {
        setMaxCategories(limits.maxCategories);
      }
      setCategories(normalizeList(catRes.data).sort((a, b) => (a.displayOrder ?? a.categoryId) - (b.displayOrder ?? b.categoryId)));
      setSubCategories(normalizeList(subRes.data));
      setTertiaryCategories(normalizeList(tertRes.data));
      setQuaternaryCategories(normalizeList(quatRes.data));
    } catch (err) {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setError('');
    try {
      if (editingLevel === 'category') {
        await axios.put(`${API_URL}/Categories/${editId}`, { categoryId: editId, categoryName: editName.trim() }, authHeaders());
      } else if (editingLevel === 'subcategory') {
        const sub = subCategories.find(s => s.subCategoryId === editId);
        await axios.put(`${API_URL}/SubCategories/${editId}`, { subCategoryId: editId, subCategoryName: editName.trim(), categoryId: sub?.categoryId }, authHeaders());
      } else if (editingLevel === 'tertiary') {
        const tert = tertiaryCategories.find(t => t.tertiaryCategoryId === editId);
        await axios.put(`${API_URL}/TertiaryCategories/${editId}`, { tertiaryCategoryId: editId, tertiaryCategoryName: editName.trim(), subCategoryId: tert?.subCategoryId }, authHeaders());
      } else if (editingLevel === 'quaternary') {
        const quat = quaternaryCategories.find(q => q.quaternaryCategoryId === editId);
        await axios.put(`${API_URL}/QuaternaryCategories/${editId}`, { quaternaryCategoryId: editId, quaternaryCategoryName: editName.trim(), tertiaryCategoryId: quat?.tertiaryCategoryId }, authHeaders());
      }
      setSuccess('Updated successfully.');
      setEditingLevel(null);
      setEditId(null);
      setEditName('');
      fetchAll();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setError('');
    try {
      if (addLevel === 'category') {
        await axios.post(`${API_URL}/Categories`, { categoryName: addName.trim() }, authHeaders());
      } else if (addLevel === 'subcategory') {
        await axios.post(`${API_URL}/SubCategories`, { subCategoryName: addName.trim(), categoryId: addParentId }, authHeaders());
      } else if (addLevel === 'tertiary') {
        await axios.post(`${API_URL}/TertiaryCategories`, { tertiaryCategoryName: addName.trim(), subCategoryId: addParentId }, authHeaders());
      } else if (addLevel === 'quaternary') {
        await axios.post(`${API_URL}/QuaternaryCategories`, { quaternaryCategoryName: addName.trim(), tertiaryCategoryId: addParentId }, authHeaders());
      }
      setSuccess('Added successfully.');
      setAddLevel(null);
      setAddParentId(null);
      setAddName('');
      fetchAll();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Add failed.');
    }
  };

  const handleDelete = async (level, id) => {
    if (!window.confirm('Delete this item? It may have children.')) return;
    setError('');
    try {
      if (level === 'category') await axios.delete(`${API_URL}/Categories/${id}`, authHeaders());
      else if (level === 'subcategory') await axios.delete(`${API_URL}/SubCategories/${id}`, authHeaders());
      else if (level === 'tertiary') await axios.delete(`${API_URL}/TertiaryCategories/${id}`, authHeaders());
      else if (level === 'quaternary') await axios.delete(`${API_URL}/QuaternaryCategories/${id}`, authHeaders());
      setSuccess('Deleted.');
      fetchAll();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const startEdit = (level, id, name) => {
    setEditingLevel(level);
    setEditId(id);
    setEditName(name);
  };

  const startAdd = (level, parentId = null) => {
    setAddLevel(level);
    setAddParentId(parentId);
    setAddName('');
  };

  const handleCategoryMove = async (direction, index) => {
    if (direction !== 'up' && direction !== 'down') return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const reordered = [...categories];
    const [removed] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, removed);
    const orderedCategoryIds = reordered.map((c) => c.categoryId);
    setError('');
    try {
      await axios.put(`${API_URL}/Categories/reorder`, { orderedCategoryIds }, authHeaders());
      setSuccess('Order updated.');
      fetchAll();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order.');
    }
  };

  if (!isLoggedIn || userRole !== 'Admin') return null;

  if (loading) {
    return (
      <div className="admin-categories-page">
        <Header />
        <div className="admin-categories-container"><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="admin-categories-page">
      <Header />
      <div className="admin-categories-container">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>← Back</button>
        <h1>Manage Categories</h1>
        <p className="admin-categories-desc">Add or edit Category, Subcategory, Tertiary and Quaternary categories. These appear in Add Product and Add Seller.</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Category */}
        <section className="category-level-section">
          <h2>Category <span className="category-limit-badge">({categories.length} / {maxCategories})</span></h2>
          <p className="category-order-hint">Order below is how categories appear in the header. Use ↑ ↓ to change sequence.</p>
          {categories.length >= maxCategories && (
            <p className="category-limit-message">Maximum categories ({maxCategories}) reached. Delete one to add another.</p>
          )}
          <ul className="category-list">
            {categories.map((c, index) => (
              <li key={c.categoryId}>
                {editingLevel === 'category' && editId === c.categoryId ? (
                  <>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <button type="button" className="btn-save" onClick={handleSaveEdit}>Save</button>
                    <button type="button" className="btn-cancel" onClick={() => { setEditingLevel(null); setEditId(null); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="category-item-name">{c.categoryName}</span>
                    <div className="category-item-actions">
                      <button type="button" className="btn-move" onClick={() => handleCategoryMove('up', index)} title="Move up" disabled={index === 0}>↑</button>
                      <button type="button" className="btn-move" onClick={() => handleCategoryMove('down', index)} title="Move down" disabled={index === categories.length - 1}>↓</button>
                      <button type="button" className="btn-edit" onClick={() => startEdit('category', c.categoryId, c.categoryName)}>Edit</button>
                      <button type="button" className="btn-delete" onClick={() => handleDelete('category', c.categoryId)}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          {addLevel === 'category' ? (
            <div className="add-row">
              <input type="text" placeholder="New category name" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <button type="button" className="btn-save" onClick={handleAdd} disabled={categories.length >= maxCategories}>Add</button>
              <button type="button" className="btn-cancel" onClick={() => { setAddLevel(null); setAddName(''); }}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="btn-add" onClick={() => startAdd('category')} disabled={categories.length >= maxCategories}>+ Add Category</button>
          )}
        </section>

        {/* SubCategory */}
        <section className="category-level-section">
          <h2>SubCategory</h2>
          <ul className="category-list">
            {subCategories.map((s) => (
              <li key={s.subCategoryId}>
                {editingLevel === 'subcategory' && editId === s.subCategoryId ? (
                  <>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <button type="button" className="btn-save" onClick={handleSaveEdit}>Save</button>
                    <button type="button" className="btn-cancel" onClick={() => { setEditingLevel(null); setEditId(null); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span>{s.categoryName} › {s.subCategoryName}</span>
                    <button type="button" className="btn-edit" onClick={() => startEdit('subcategory', s.subCategoryId, s.subCategoryName)}>Edit</button>
                    <button type="button" className="btn-delete" onClick={() => handleDelete('subcategory', s.subCategoryId)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {addLevel === 'subcategory' ? (
            <div className="add-row">
              <select value={addParentId ?? ''} onChange={(e) => setAddParentId(parseInt(e.target.value, 10))}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
              </select>
              <input type="text" placeholder="New subcategory name" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <button type="button" className="btn-save" onClick={handleAdd} disabled={!addParentId}>Add</button>
              <button type="button" className="btn-cancel" onClick={() => { setAddLevel(null); setAddParentId(null); setAddName(''); }}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="btn-add" onClick={() => startAdd('subcategory')}>+ Add SubCategory</button>
          )}
        </section>

        {/* Tertiary */}
        <section className="category-level-section">
          <h2>Tertiary Category</h2>
          <ul className="category-list">
            {tertiaryCategories.map((t) => (
              <li key={t.tertiaryCategoryId}>
                {editingLevel === 'tertiary' && editId === t.tertiaryCategoryId ? (
                  <>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <button type="button" className="btn-save" onClick={handleSaveEdit}>Save</button>
                    <button type="button" className="btn-cancel" onClick={() => { setEditingLevel(null); setEditId(null); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span>{t.subCategoryName} › {t.tertiaryCategoryName}</span>
                    <button type="button" className="btn-edit" onClick={() => startEdit('tertiary', t.tertiaryCategoryId, t.tertiaryCategoryName)}>Edit</button>
                    <button type="button" className="btn-delete" onClick={() => handleDelete('tertiary', t.tertiaryCategoryId)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {addLevel === 'tertiary' ? (
            <div className="add-row">
              <select value={addParentId ?? ''} onChange={(e) => setAddParentId(parseInt(e.target.value, 10))}>
                <option value="">Select subcategory</option>
                {subCategories.map((s) => <option key={s.subCategoryId} value={s.subCategoryId}>{s.categoryName} › {s.subCategoryName}</option>)}
              </select>
              <input type="text" placeholder="New tertiary name" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <button type="button" className="btn-save" onClick={handleAdd} disabled={!addParentId}>Add</button>
              <button type="button" className="btn-cancel" onClick={() => { setAddLevel(null); setAddParentId(null); setAddName(''); }}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="btn-add" onClick={() => startAdd('tertiary')}>+ Add Tertiary Category</button>
          )}
        </section>

        {/* Quaternary */}
        <section className="category-level-section">
          <h2>Quaternary Category</h2>
          <ul className="category-list">
            {quaternaryCategories.map((q) => (
              <li key={q.quaternaryCategoryId}>
                {editingLevel === 'quaternary' && editId === q.quaternaryCategoryId ? (
                  <>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <button type="button" className="btn-save" onClick={handleSaveEdit}>Save</button>
                    <button type="button" className="btn-cancel" onClick={() => { setEditingLevel(null); setEditId(null); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span>{q.tertiaryCategoryName} › {q.quaternaryCategoryName}</span>
                    <button type="button" className="btn-edit" onClick={() => startEdit('quaternary', q.quaternaryCategoryId, q.quaternaryCategoryName)}>Edit</button>
                    <button type="button" className="btn-delete" onClick={() => handleDelete('quaternary', q.quaternaryCategoryId)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {addLevel === 'quaternary' ? (
            <div className="add-row">
              <select value={addParentId ?? ''} onChange={(e) => setAddParentId(parseInt(e.target.value, 10))}>
                <option value="">Select tertiary category</option>
                {tertiaryCategories.map((t) => <option key={t.tertiaryCategoryId} value={t.tertiaryCategoryId}>{t.subCategoryName} › {t.tertiaryCategoryName}</option>)}
              </select>
              <input type="text" placeholder="New quaternary name" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <button type="button" className="btn-save" onClick={handleAdd} disabled={!addParentId}>Add</button>
              <button type="button" className="btn-cancel" onClick={() => { setAddLevel(null); setAddParentId(null); setAddName(''); }}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="btn-add" onClick={() => startAdd('quaternary')}>+ Add Quaternary Category</button>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
