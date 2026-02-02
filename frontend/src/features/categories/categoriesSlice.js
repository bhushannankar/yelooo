import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://localhost:7193/api/Categories'; // Adjust as per your API URL

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async () => {
  const response = await axios.get(API_URL);
  return response.data;
});

export const fetchCategoriesWithSubCategories = createAsyncThunk(
  'categories/fetchCategoriesWithSubCategories',
  async () => {
    const response = await axios.get(`${API_URL}/with-subcategories`);
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
        // Handle $values format from .NET API at all levels
        const rawData = action.payload.$values || action.payload || [];
        
        // Process all nested levels
        state.itemsWithSubCategories = rawData.map(category => ({
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
