import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axiosConfig';
import { Product } from './productSlice';
import { logout } from './authSlice';

interface WishlistState {
  items: Product[];
  loading: boolean;
  error: string | null;
  wishlistStatus: Record<number, boolean>; // productId -> isInWishlist
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
  wishlistStatus: {},
};

// Fetch user's wishlist
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/wishlist');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Please login to view your wishlist');
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch wishlist');
    }
  }
);

// Add product to wishlist
export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId: number, { rejectWithValue }) => {
    try {
      console.log('Making wishlist add request for productId:', productId);
      const response = await axios.post(`/wishlist/add/${productId}`, {});
      console.log('Wishlist add response:', response.data);
      return { productId, message: response.data.message || 'Product added to wishlist' };
    } catch (error: any) {
      console.error('Add to wishlist error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        config: error?.config
      });
      if (error.response?.status === 401) {
        return rejectWithValue('Please login to add items to wishlist');
      }
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add to wishlist';
      return rejectWithValue(errorMessage);
    }
  }
);

// Remove product from wishlist
export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/wishlist/remove/${productId}`);
      return productId;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Please login to remove items from wishlist');
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to remove from wishlist');
    }
  }
);

// Check if product is in wishlist
export const checkWishlistStatus = createAsyncThunk(
  'wishlist/checkWishlistStatus',
  async (productId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/wishlist/check/${productId}`);
      return { productId, isInWishlist: response.data.isInWishlist };
    } catch (error: any) {
      // If not authenticated, return false
      return { productId, isInWishlist: false };
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
      state.wishlistStatus = {};
    },
    updateWishlistStatus: (state, action: PayloadAction<{ productId: number; isInWishlist: boolean }>) => {
      state.wishlistStatus[action.payload.productId] = action.payload.isInWishlist;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // Update wishlist status for all items
        action.payload.forEach((product: Product) => {
          state.wishlistStatus[product.id] = true;
        });
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.wishlistStatus[action.payload.productId] = true;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.wishlistStatus[action.payload] = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Check wishlist status
      .addCase(checkWishlistStatus.fulfilled, (state, action) => {
        state.wishlistStatus[action.payload.productId] = action.payload.isInWishlist;
      })
      // Clear wishlist when user logs out
      .addCase(logout, (state) => {
        state.items = [];
        state.wishlistStatus = {};
        state.error = null;
      });
  },
});

export const { clearWishlist, updateWishlistStatus } = wishlistSlice.actions;
export default wishlistSlice.reducer;

