import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/support`;

// 🎯 Thunk: Submit a report
export const submitReport = createAsyncThunk(
  'support/submitReport',
  async ({ type, id, title, itemUrl, reason, message, senderName, senderEmail, captchaToken }, thunkAPI) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/report`, {
        type,
        id,
        title,
        itemUrl,
        reason,
        message,
        senderName,
        senderEmail,
        captchaToken,
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
  async ({ title, category, message, senderName, senderEmail, mobile, captchaToken }, thunkAPI) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/contact`, {
        title,
        category,
        message,
        senderName,
        senderEmail,
        mobile,
        captchaToken,
      });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 🔴 Thunk: Submit a removal request
export const submitRemoval = createAsyncThunk(
  'support/submitRemoval',
  async ({ type, id, title, itemUrl, message, senderName, senderEmail, captchaToken }, thunkAPI) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/removal`, {
        type,
        id,
        title,
        itemUrl,
        message,
        senderName,
        senderEmail,
        captchaToken,
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
  removalStatus: 'idle', // idle | loading | success | failed
  removalError: null,
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
    resetRemovalStatus: (state) => {
      state.removalStatus = 'idle';
      state.removalError = null;
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
      })
      // 🔴 Removal Reducers
      .addCase(submitRemoval.pending, (state) => {
        state.removalStatus = 'loading';
        state.removalError = null;
      })
      .addCase(submitRemoval.fulfilled, (state) => {
        state.removalStatus = 'success';
        state.removalError = null;
      })
      .addCase(submitRemoval.rejected, (state, action) => {
        state.removalStatus = 'failed';
        state.removalError = action.payload;
      });
  },
});

export const { resetReportStatus, resetContactStatus, resetRemovalStatus } = supportSlice.actions;

export default supportSlice.reducer;
