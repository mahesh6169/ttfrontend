import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/support`;

// 🎯 Thunk: Submit a report
export const submitReport = createAsyncThunk(
  'support/submitReport',
  async ({ type, id, title, message, senderName, senderEmail, captchaToken }, thunkAPI) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/report`, {
        type,
        id,
        title,
        message,
        senderName,
        senderEmail,
        captchaToken, // ✅ Add this!
      });

      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);


// 🟢 Thunk: Submit a contact message
export const submitContact = createAsyncThunk(
  'support/submitContact',
  async ({ title, category, message, senderName, senderEmail, captchaToken }, thunkAPI) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/contact`, {
        title,
        category,
        message,
        senderName,
        senderEmail,
        captchaToken, // ✅ Pass the captchaToken here
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
  contactStatus: 'idle', // idle | loading | success | failed
  contactError: null,
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    resetReportStatus: (state) => {
      state.reportStatus = 'idle';
      state.reportError = null;
    },
    resetContactStatus: (state) => {
      state.contactStatus = 'idle';
      state.contactError = null;
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
      })
      // 🟢 Contact Reducers
    builder
    .addCase(submitContact.pending, (state) => {
      state.contactStatus = 'loading';
      state.contactError = null;
    })
    .addCase(submitContact.fulfilled, (state) => {
      state.contactStatus = 'success';
      state.contactError = null;
    })
    .addCase(submitContact.rejected, (state, action) => {
      state.contactStatus = 'failed';
      state.contactError = action.payload;
    });
  },
});

export const { resetReportStatus, resetContactStatus } = supportSlice.actions;

export default supportSlice.reducer;
