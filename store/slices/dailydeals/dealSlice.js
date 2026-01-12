import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

// Fetch deal by id
export const getDealById = createAsyncThunk(
  'deal/getDealById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/dailydeals/view/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch deal');
    }
  }
);

const dealSlice = createSlice({
  name: 'deal',
  initialState: {
    deal: null,
    fetchStatus: 'idle',
    error: null
  },
  reducers: {
    clearDeal(state) {
      state.deal = null;
      state.fetchStatus = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDealById.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addCase(getDealById.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.deal = action.payload.deal;
      })
      .addCase(getDealById.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearDeal } = dealSlice.actions;
export default dealSlice.reducer;
