import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
  reviewerName: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReviewState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  canReview: boolean;
  reviewReason: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  loading: false,
  error: null,
  canReview: false,
  reviewReason: null,
};

export const fetchReviewsByProduct = createAsyncThunk(
  'reviews/fetchByProduct',
  async (productId: number) => {
    const response = await axios.get(`${API_URL}/reviews/product/${productId}`);
    return response.data;
  }
);

export const createReview = createAsyncThunk(
  'reviews/create',
  async ({ productId, rating, comment }: { productId: number; rating: number; comment: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/reviews`,
        { productId, rating, comment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create review');
    }
  }
);

export const checkCanReview = createAsyncThunk(
  'reviews/checkCanReview',
  async (productId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reviews/can-review/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return { canReview: false, reason: 'Unable to check review eligibility' };
    }
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviews: (state) => {
      state.reviews = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewsByProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviewsByProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchReviewsByProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch reviews';
      })
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews.unshift(action.payload);
        state.canReview = false;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create review';
      })
      .addCase(checkCanReview.fulfilled, (state, action) => {
        state.canReview = action.payload.canReview || false;
        state.reviewReason = action.payload.reason || null;
      });
  },
});

export const { clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;

