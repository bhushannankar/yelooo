import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

const paymentMethodsApiUrl = `${API_URL}/PaymentMethods`;

export const fetchPaymentMethods = createAsyncThunk(
  'paymentMethods/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(paymentMethodsApiUrl);
      return response.data.$values; // Adjust for $values wrapper
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);

const paymentMethodsSlice = createSlice({
  name: 'paymentMethods',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default paymentMethodsSlice.reducer;
