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
  async (userId: number) => {
    const response = await axios.get(`${API_URL}/cart/${userId}`);
    return response.data;
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ userId, productId, quantity }: { userId: number; productId: number; quantity: number }) => {
    const response = await axios.post(
      `${API_URL}/cart/${userId}/add?productId=${productId}&quantity=${quantity}`
    );
    return response.data;
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async ({ userId, productId }: { userId: number; productId: number }) => {
    await axios.delete(`${API_URL}/cart/${userId}/remove/${productId}`);
    return productId;
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
        const existingItem = state.items.find(
          item => item.product.id === action.payload.product.id
        );
        if (existingItem) {
          existingItem.quantity = action.payload.quantity;
        } else {
          state.items.push(action.payload);
        }
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

