import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

const productsApiUrl = `${API_URL}/Products`;

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ categoryId = null, subCategoryId = null, tertiaryCategoryId = null, quaternaryCategoryId = null, search = null } = {}) => {
    let url = productsApiUrl;
    const params = [];
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (subCategoryId) params.push(`subCategoryId=${subCategoryId}`);
    if (tertiaryCategoryId) params.push(`tertiaryCategoryId=${tertiaryCategoryId}`);
    if (quaternaryCategoryId) params.push(`quaternaryCategoryId=${quaternaryCategoryId}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length > 0) url += '?' + params.join('&');
    const response = await axios.get(url);
    return response.data;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Handle both array and $values format
        const data = action.payload;
        state.items = Array.isArray(data) ? data : (data.$values || []);
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default productsSlice.reducer;
