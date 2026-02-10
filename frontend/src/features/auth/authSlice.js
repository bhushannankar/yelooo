import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

const authApiUrl = `${API_URL}/Auth`;

// Helper function to decode JWT
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// Async thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for user login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${authApiUrl}/login`, credentials);
      const token = response.data;
      localStorage.setItem('jwtToken', token);
      return token;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);

const getTokenDetails = () => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    const decodedToken = parseJwt(token);
    return {
      token,
      isLoggedIn: true,
      userRole: decodedToken ? decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] : null,
      username: decodedToken ? decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken['name'] || decodedToken['unique_name'] : null,
    };
  }
  return { token: null, isLoggedIn: false, userRole: null, username: null };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    ...getTokenDetails(),
    status: 'idle',
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.isLoggedIn = false;
      state.userRole = null;
      state.username = null;
      localStorage.removeItem('jwtToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload;
        state.isLoggedIn = true;
        const decodedToken = parseJwt(action.payload);
        state.userRole = decodedToken ? decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] : null;
        state.username = decodedToken ? decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken['name'] || decodedToken['unique_name'] : null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.token = null;
        state.isLoggedIn = false;
        state.userRole = null;
        state.username = null;
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
