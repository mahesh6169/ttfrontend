import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/support`;

// 🎯 Thunk: Submit a report
export const submitReport = createAsyncThunk(
  'support/submitReport',
  async ({ type, id, title, message, senderName, senderEmail }, thunkAPI) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/report`, {
        type,
        id,
        title,
        message,
        senderName,
        senderEmail,
      });

      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const initialState = {
  reportStatus: 'idle', // idle | loading | success | failed
  reportError: null,
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    resetReportStatus: (state) => {
      state.reportStatus = 'idle';
      state.reportError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitReport.pending, (state) => {
        state.reportStatus = 'loading';
        state.reportError = null;
      })
      .addCase(submitReport.fulfilled, (state) => {
        state.reportStatus = 'success';
        state.reportError = null;
      })
      .addCase(submitReport.rejected, (state, action) => {
        state.reportStatus = 'failed';
        state.reportError = action.payload;
      });
  },
});

export const { resetReportStatus } = supportSlice.actions;

export default supportSlice.reducer;
