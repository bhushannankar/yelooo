import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://localhost:7193/api/Cart';

// Helper to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Async thunks for server operations

// Fetch cart from server
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, { headers: getAuthHeader() });
      return Array.isArray(response.data) ? response.data : (response.data.$values || []);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add item to cart (server)
export const addToCartAsync = createAsyncThunk(
  'cart/addToCartAsync',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, { productId, quantity }, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update cart item quantity (server)
export const updateCartItemAsync = createAsyncThunk(
  'cart/updateCartItemAsync',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${productId}`, { quantity }, { headers: getAuthHeader() });
      return { productId, quantity };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Remove item from cart (server)
export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCartAsync',
  async (productId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${productId}`, { headers: getAuthHeader() });
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Clear cart (server)
export const clearCartAsync = createAsyncThunk(
  'cart/clearCartAsync',
  async (_, { rejectWithValue }) => {
    try {
      await axios.delete(API_URL, { headers: getAuthHeader() });
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Sync local cart with server on login
export const syncCartWithServer = createAsyncThunk(
  'cart/syncCartWithServer',
  async (localItems, { rejectWithValue }) => {
    try {
      const items = localItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      // Use 'replace' strategy to set exact quantities, not add to existing
      const response = await axios.post(`${API_URL}/sync`, { items, mergeStrategy: 'replace' }, { headers: getAuthHeader() });
      return Array.isArray(response.data) ? response.data : (response.data.$values || []);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [], // Array of { productId, productName, price, imageUrl, quantity }
    status: 'idle',
    error: null,
    isLoggedIn: false, // Track if we should sync with server
  },
  reducers: {
    // Local cart operations (for non-logged-in users)
    addToCart: (state, action) => {
      const { productId, productName, price, imageUrl } = action.payload;
      const existingItem = state.items.find((item) => item.productId === productId);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        state.items.push({ productId, productName, price, imageUrl, quantity: 1 });
      }
    },
    removeFromCart: (state, action) => {
      const productIdToRemove = action.payload;
      state.items = state.items.filter((item) => item.productId !== productIdToRemove);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const itemToUpdate = state.items.find((item) => item.productId === productId);

      if (itemToUpdate) {
        itemToUpdate.quantity = quantity;
        if (itemToUpdate.quantity <= 0) {
          state.items = state.items.filter((item) => item.productId !== productId);
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCartLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Sync cart
      .addCase(syncCartWithServer.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(syncCartWithServer.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.isLoggedIn = true;
        state.error = null;
      })
      .addCase(syncCartWithServer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Add to cart async
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        const { productId, productName, price, imageUrl } = action.payload;
        const existingItem = state.items.find((item) => item.productId === productId);
        if (existingItem) {
          existingItem.quantity++;
        } else {
          state.items.push({ productId, productName, price, imageUrl, quantity: 1 });
        }
      })
      // Update cart item
      .addCase(updateCartItemAsync.fulfilled, (state, action) => {
        const { productId, quantity } = action.payload;
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item.productId !== productId);
        } else {
          const item = state.items.find((item) => item.productId === productId);
          if (item) {
            item.quantity = quantity;
          }
        }
      })
      // Remove from cart
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.productId !== action.payload);
      })
      // Clear cart
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.items = [];
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCartLoggedIn,
} = cartSlice.actions;

export default cartSlice.reducer;
