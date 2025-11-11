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
  frequentlyBoughtTogether: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  recommendations: [],
  frequentlyBoughtTogether: [],
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
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      if (response.data) {
        return response.data;
      }
      return rejectWithValue('Product not found');
    } catch (error: any) {
      console.error('Error fetching product:', error);
      if (error.response?.status === 404) {
        return rejectWithValue(`Product with ID ${id} not found`);
      }
      if (error.response?.status === 403) {
        return rejectWithValue('Access denied. Please check backend security configuration.');
      }
      if (error.code === 'ECONNREFUSED') {
        return rejectWithValue('Backend server is not running. Please start the backend.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch product');
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  'products/fetchRecommendations',
  async (productId: number) => {
    const response = await axios.get(`${API_URL}/products/${productId}/recommendations`);
    return response.data;
  }
);

export const fetchFrequentlyBoughtTogether = createAsyncThunk(
  'products/fetchFrequentlyBoughtTogether',
  async (productId: number) => {
    try {
      const response = await axios.get(`${API_URL}/products/${productId}/frequently-bought-together`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching frequently bought together:', error);
      return []; // Return empty array on error
    }
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
        state.error = action.payload as string || action.error.message || 'Failed to fetch product';
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state) => {
        state.recommendations = [];
      })
      .addCase(fetchFrequentlyBoughtTogether.fulfilled, (state, action) => {
        state.frequentlyBoughtTogether = action.payload;
      })
      .addCase(fetchFrequentlyBoughtTogether.rejected, (state) => {
        state.frequentlyBoughtTogether = [];
      });
  },
});

export const { setSearchQuery, setSelectedCategory, clearRecommendations } = productSlice.actions;
export default productSlice.reducer;

