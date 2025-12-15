import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
}

interface CartState {
  items: CartItem[];
  recommendations: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  recommendations: [],
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/cart/${userId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ userId, productId, quantity }: { userId: number; productId: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/cart/${userId}/add?productId=${productId}&quantity=${quantity}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ userId, productId, quantity }: { userId: number; productId: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/cart/${userId}/update?productId=${productId}&quantity=${quantity}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating cart quantity:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async ({ userId, productId }: { userId: number; productId: number }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/cart/${userId}/remove/${productId}`);
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        if (action.payload && action.payload.product) {
          const existingItem = state.items.find(
            item => item.product.id === action.payload.product.id
          );
          if (existingItem) {
            existingItem.quantity = action.payload.quantity;
          } else {
            state.items.push(action.payload);
          }
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        console.error('addToCart.rejected:', action.error, action.payload);
        state.error = action.payload as string || 'Failed to add item to cart';
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        console.log('updateCartQuantity.fulfilled:', action.payload);
        if (action.payload && action.payload.product) {
          const existingItem = state.items.find(
            item => item.product.id === action.payload.product.id
          );
          if (existingItem) {
            existingItem.quantity = action.payload.quantity;
            console.log('Updated item quantity:', existingItem.product.id, 'to', existingItem.quantity);
          } else {
            console.warn('Item not found in state for product:', action.payload.product.id);
          }
        } else if (!action.payload) {
          // Item was removed (quantity was 0)
          const productId = action.meta.arg.productId;
          state.items = state.items.filter(
            item => item.product.id !== productId
          );
          console.log('Removed item from cart:', productId);
        }
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        console.error('updateCartQuantity.rejected:', action.error, action.payload);
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(
          item => item.product.id !== action.payload
        );
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;

