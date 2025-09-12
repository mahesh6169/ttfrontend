import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

// 🔹 Define Base URL Inside the Slice
const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin`;

// 📌 Async Thunks - Only authentication related
export const adminLogin = createAsyncThunk('admin/login', async (credentials, { rejectWithValue }) => {
    try {
        const { data } = await axios.post(`${BASE_URL}/login`, credentials, {
            withCredentials: true, // Ensure cookies are sent
        });
        return data.user; // Only return user details
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
});

export const validateAdmin = createAsyncThunk('admin/validateAdmin', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`${BASE_URL}/validate`, {
            withCredentials: true, // Ensure cookies are sent
        });
        return data.user; // Return admin details
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Admin validation failed');
    }
});

// 📌 Initial State - Simplified for auth only
const initialState = {
    adminInfo: null, // Stores logged-in admin details
    status: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
    error: null, // Stores any errors from API
};

// 📌 Slice
const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        resetAdminState: (state) => {
            state.error = null;
            state.status = 'idle';
        },
        logoutAdmin: (state) => {
            state.adminInfo = null;
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // 🔹 Admin Login
            .addCase(adminLogin.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(adminLogin.fulfilled, (state, action) => {
                state.status = 'success';
                state.adminInfo = action.payload;
            })
            .addCase(adminLogin.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // 🔹 Validate Admin
            .addCase(validateAdmin.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(validateAdmin.fulfilled, (state, action) => {
                state.status = 'success';
                state.adminInfo = action.payload;
            })
            .addCase(validateAdmin.rejected, (state, action) => {
                state.status = 'failed';
                state.adminInfo = null;
            });
    },
});

// 📌 Export Actions
export const { resetAdminState, logoutAdmin } = adminSlice.actions;

// 📌 Export Reducer
export default adminSlice.reducer;