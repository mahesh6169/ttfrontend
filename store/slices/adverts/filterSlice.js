import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/adverts/filters`;


/* 🔥 First Thunk (All Filter) */
export const fetchAdvertsAll = createAsyncThunk(
  'filters/fetchAdvertsAll',
  async (_, { getState, rejectWithValue }) => {
    const { all } = getState().filters;
    try {
      const params = {
        ...(all.category && { category: all.category }),
        ...(all.location && { location: all.location }),
        ...(all.proximity && { proximity: all.proximity }),
        page: all.page,
        limit: all.limit,
      };
      const response = await axios.get(`${API_BASE_URL}/all`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ API Fetch Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch adverts');
    }
  }
);

/* 🔥 Thunk for Categories Filter */
export const fetchAdvertsByCategory = createAsyncThunk(
  'filters/fetchAdvertsByCategory',
  async (_, { getState, rejectWithValue }) => {
    const { categories } = getState().filters;

    try {
      const params = {
        ...(categories.selectedCategories.length > 0 && {
          categories: categories.selectedCategories.join(','),
        }),
        page: categories.page,
        limit: categories.limit,
      };

      const response = await axios.get(`${API_BASE_URL}/categories`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch adverts by categories');
    }
  }
);


/* 🔥 Thunk for Cities Filter */
export const fetchAdvertsByCity = createAsyncThunk(
  'filters/fetchAdvertsByCity',
  async (_, { getState, rejectWithValue }) => {
    const { cities } = getState().filters;

    try {
      const params = {
        ...(cities.location && { location: cities.location }),
        page: cities.page,
        limit: cities.limit,
      };

      const response = await axios.get(`${API_BASE_URL}/cities`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch adverts by city');
    }
  }
);

/* 🔥 Thunk for Telugufy Filter */
export const fetchAdvertsTelugufy = createAsyncThunk(
  'filters/fetchAdvertsTelugufy',
  async (_, { getState, rejectWithValue }) => {
    const { telugufy } = getState().filters;
    const TELUGUFY_CATEGORIES = ['Overseas', 'Real Estate'];

    try {
      // If user selected categories, use those
      // If no categories selected, use the default TELUGUFY_CATEGORIES
      const categoriesToUse = telugufy.selectedCategories.length > 0 
        ? telugufy.selectedCategories 
        : TELUGUFY_CATEGORIES;
        
      const params = {
        categories: categoriesToUse.join(','),
        page: telugufy.page,
        limit: telugufy.limit,
      };

      const response = await axios.get(`${API_BASE_URL}/customcategories`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch Telugufy adverts');
    }
  }
);


/* 🟡 Initial State */
const initialState =  {
  mode: 'all',
  all: { category: '', location: '', locationInputText: '', proximity: 10, page: 1, limit: 12 },
  categories: { selectedCategories: [], page: 1, limit: 12 },
  cities: { location: '',  page: 1, limit: 12 },
  telugufy: { selectedCategories: [], page: 1, limit: 12 },  
  adverts: [],
  meta: {},
  status: 'idle',
  error: null,
};

/* 🟢 Slice */
const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    updateFilter: (state, action) => {
      const { mode, values } = action.payload;
      state.mode = mode;
      state[mode] = { ...state[mode], ...values };
      
    },
    resetFilters: (state, action) => {
      const mode = action.payload || 'all';  // Default to 'all' if not specified
    
      state.mode = mode;
    
      const defaultStates = {
        all: { category: '', location: '', locationInputText: '', proximity: 10, page: 1, limit: 12 },
        categories: { selectedCategories: [], page: 1, limit: 12 },
        cities: { location: '',  page: 1, limit: 12 },
        telugufy: { selectedCategories: [], page: 1, limit: 12 },  
      };
    
      state[mode] = defaultStates[mode];
    
      state.adverts = [];
      state.meta = {};
      state.status = 'idle';
      state.error = null;
    
      if (typeof window !== 'undefined') {
        localStorage.removeItem('advertFilters');
      }
    }
    ,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdvertsAll.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAdvertsAll.fulfilled, (state, action) => {
        state.status = 'success';
        state.adverts = action.payload.adverts;
        state.meta = action.payload.meta;
      })
      .addCase(fetchAdvertsAll.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      })
      // ✅ Add handling for category thunk:
    .addCase(fetchAdvertsByCategory.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    })
    .addCase(fetchAdvertsByCategory.fulfilled, (state, action) => {
      state.status = 'success';
      state.adverts = action.payload.adverts;
      state.meta = action.payload.meta;
    })
    .addCase(fetchAdvertsByCategory.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload || 'Something went wrong';
    })
    // ✅ Cities mode
    .addCase(fetchAdvertsByCity.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    })
    .addCase(fetchAdvertsByCity.fulfilled, (state, action) => {
      state.status = 'success';
      state.adverts = action.payload.adverts;
      state.meta = action.payload.meta;
    })
    .addCase(fetchAdvertsByCity.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload || 'Something went wrong';
    })

    // ✅ Telugufy mode
    .addCase(fetchAdvertsTelugufy.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    })
    .addCase(fetchAdvertsTelugufy.fulfilled, (state, action) => {
      state.status = 'success';
      state.adverts = action.payload.adverts;
      state.meta = action.payload.meta;
    })
    .addCase(fetchAdvertsTelugufy.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload || 'Something went wrong';
    });
  },
});

export const { updateFilter, resetFilters } = filterSlice.actions;
export default filterSlice.reducer;
