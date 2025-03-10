// store/slices/advertSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/adverts`;


export const fetchAdverts = createAsyncThunk(
    'adverts/fetchAdverts',
    async (token, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/fetchAdverts`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 404) {
                return []; // No adverts found
            }

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message || 'Failed to fetch adverts');
            }

            return response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchAdvertById = createAsyncThunk(
    'adverts/fetchAdvertById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/views/${id}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message || 'Failed to fetch advert');
            }

            return response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addAdvert = createAsyncThunk(
    'adverts/addAdvert',
    async (advertData, { rejectWithValue }) => {
        console.log("🔹 Sending API request with data:", advertData);
        try {
            const response = await axios.post(`${API_BASE_URL}/addadvert`, advertData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                return response.data.advert; // Return advert data
            } else {
                return rejectWithValue(response.data.message || 'Failed to add advert');
            }
        } catch (error) {
            console.error('addAdvert Thunk - Error:', error);
            const errorMessage =
                error.response?.data?.message || 'addAdvert thunk unable to reach addAdvert Controller due to a network/server issue';
            return rejectWithValue(errorMessage);
        }
    }
);


const advertSlice = createSlice({
    name: 'advert',
    initialState: {
        adverts: [],
        selectedAdvert: null,
        status: 'idle',
        error: null,
    },
    reducers: {
        clearAdverts(state) {
            state.adverts = []; // Clear adverts list
            state.status = 'idle'; // Reset status
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdverts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAdverts.fulfilled, (state, action) => {
                state.status = 'success';
                // Deduplicate adverts by _id
                const combinedAdverts = [...state.adverts, ...action.payload];
                const uniqueAdverts = [
                    ...new Map(combinedAdverts.map((advert) => [advert._id, advert])).values(),
                ];

                state.adverts = uniqueAdverts; // Set deduplicated adverts in the state
            })
            .addCase(fetchAdverts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })

            // Fetch Advert By ID Reducers
            .addCase(fetchAdvertById.pending, (state) => {
                state.status = 'loading';
                state.selectedAdvert = null;
                state.error = null;
            })
            .addCase(fetchAdvertById.fulfilled, (state, action) => {
                state.status = 'success';
                state.selectedAdvert = action.payload;
            })
            .addCase(fetchAdvertById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })

            // Add Advert Extra Reducers
            .addCase(addAdvert.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addAdvert.fulfilled, (state) => {
                state.status = 'success';
            })
            .addCase(addAdvert.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            });
    },
});

export const { clearAdverts } = advertSlice.actions;
export default advertSlice.reducer;
