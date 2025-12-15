import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

// Helper to restore user from token on initial load
const getInitialAuthState = (): AuthState => {
  const token = localStorage.getItem('token');
  // Try to get user from localStorage as backup
  const storedUser = localStorage.getItem('user');
  let user: User | null = null;
  
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return {
    user: user,
    isAuthenticated: !!(token && user),
    token: token,
  };
};

const initialState: AuthState = getInitialAuthState();

// Async thunk to restore auth state from token
export const restoreAuth = createAsyncThunk(
  'auth/restoreAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await axios.get('http://localhost:8080/api/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        user: response.data.user,
        token: token,
      };
    } catch (error: any) {
      // DON'T remove token on validation failure - it might be a network issue
      // Only remove token if it's explicitly invalid (401 with specific error)
      if (error.response?.status === 401 && error.response?.data?.error?.includes('Invalid') || 
          error.response?.data?.error?.includes('expired')) {
        // Only remove if explicitly invalid/expired
        console.warn('Token is invalid, but keeping it for now');
      }
      return rejectWithValue(error.response?.data?.error || 'Token validation failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      // Persist user to localStorage
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        // Persist user to localStorage as backup
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(restoreAuth.rejected, (state) => {
        // Keep existing user and token if they exist
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token) {
          state.token = token;
          // Try to restore user from localStorage backup
          if (storedUser) {
            try {
              state.user = JSON.parse(storedUser);
              state.isAuthenticated = true;
            } catch (e) {
              // If parse fails, keep current state
              state.isAuthenticated = !!state.user;
            }
          } else if (state.user) {
            // Keep existing user in state
            state.isAuthenticated = true;
          } else {
            // No user, but we have token - keep token and try again later
            state.isAuthenticated = false;
          }
        } else {
          // No token - clear everything
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem('user');
        }
      });
  },
});

export const { setUser, setToken, logout } = authSlice.actions;
export default authSlice.reducer;

