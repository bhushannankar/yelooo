import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

const categoriesApiUrl = `${API_URL}/Categories`;

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async () => {
  const response = await axios.get(categoriesApiUrl);
  return response.data;
});

export const fetchCategoriesWithSubCategories = createAsyncThunk(
  'categories/fetchCategoriesWithSubCategories',
  async () => {
    const response = await axios.get(`${categoriesApiUrl}/with-subcategories`);
    return response.data;
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    itemsWithSubCategories: [],
    status: 'idle',
    subCategoriesStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.$values || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchCategoriesWithSubCategories.pending, (state) => {
        state.subCategoriesStatus = 'loading';
      })
      .addCase(fetchCategoriesWithSubCategories.fulfilled, (state, action) => {
        state.subCategoriesStatus = 'succeeded';
        // Handle $values format from .NET API at all levels; no hardcoded list
        const rawData = action.payload.$values || action.payload || [];
        const sorted = [...rawData].sort((a, b) => (a.displayOrder ?? a.categoryId ?? 0) - (b.displayOrder ?? b.categoryId ?? 0));
        // Process all nested levels
        state.itemsWithSubCategories = sorted.map(category => ({
          ...category,
          subCategories: (category.subCategories?.$values || category.subCategories || []).map(subCat => ({
            ...subCat,
            tertiaryCategories: (subCat.tertiaryCategories?.$values || subCat.tertiaryCategories || []).map(tertiary => ({
              ...tertiary,
              quaternaryCategories: tertiary.quaternaryCategories?.$values || tertiary.quaternaryCategories || []
            }))
          }))
        }));
      })
      .addCase(fetchCategoriesWithSubCategories.rejected, (state, action) => {
        state.subCategoriesStatus = 'failed';
        state.error = action.error.message;
      });
  },
});

export default categoriesSlice.reducer;
