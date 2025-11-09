import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
}

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  recommendations: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  recommendations: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async () => {
    const response = await axios.get(`${API_URL}/products`);
    return response.data;
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id: number) => {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  }
);

export const fetchRecommendations = createAsyncThunk(
  'products/fetchRecommendations',
  async (productId: number) => {
    const response = await axios.get(`${API_URL}/products/${productId}/recommendations`);
    return response.data;
  }
);

export const searchProducts = createAsyncThunk(
  'products/search',
  async (query: string) => {
    const response = await axios.get(`${API_URL}/products/search?q=${query}`);
    return response.data;
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    clearRecommendations: (state) => {
      state.recommendations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentProduct = null; // Clear previous product
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.currentProduct = null;
        state.error = action.error.message || 'Failed to fetch product';
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state) => {
        state.recommendations = [];
      });
  },
});

export const { setSearchQuery, setSelectedCategory, clearRecommendations } = productSlice.actions;
export default productSlice.reducer;

