import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 🔹 Define Base URL Inside the Slice
const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin`;

// 📌 Async Thunks
export const adminLogin = createAsyncThunk('admin/login', async (credentials, { rejectWithValue }) => {
    try {
        const { data } = await axios.post(`${BASE_URL}/login`, credentials);
        return data.user; // Only return user details
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
});

export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (page = 1, { rejectWithValue }) => {
    try {
        console.log("🔍 Fetching users from:", `${BASE_URL}/users?page=${page}`);

        const { data } = await axios.get(`${BASE_URL}/users?page=${page}`, {
            withCredentials: true, // ✅ Ensures cookies are sent for authentication
        });

        console.log("✅ Fetched Users:", data);
        return data;
    } catch (error) {
        console.error("❌ Fetch Users Error:", error.response?.data || error.message);
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
});


export const fetchUserById = createAsyncThunk('admin/fetchUserById', async (userId, { rejectWithValue }) => {
    try {
        const { data } = await axios.get(`${BASE_URL}/users/${userId}`, {
            withCredentials: true, // ✅ Ensures authentication token or session is used
        });

        return data.user;
    } catch (error) {
        console.error("❌ Fetch User by ID Error:", error.response?.data || error.message);
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
});

export const createUser = createAsyncThunk(
    'admin/createUser',
    async (payload, { rejectWithValue }) => {
      try {
        console.log('📨 Creating user with full payload:', payload);
  
        const { data } = await axios.post(
          `${BASE_URL}/users`,
          payload,
          { withCredentials: true } // ✅ Sends auth cookies/session
        );
  
        console.log('✅ User Created:', data);
        return data.user;
      } catch (error) {
        console.error('❌ Create User Error:', error.response?.data || error.message);
        return rejectWithValue(error.response?.data?.message || 'Failed to create user');
      }
    }
  );
  


  export const updateUser = createAsyncThunk(
    'admin/updateUser',
    async (payload, { rejectWithValue }) => {
      try {
        const { userId, ...userData } = payload;
  
        const { data } = await axios.put(
          `${BASE_URL}/users/${userId}`,
          userData,
          { withCredentials: true }
        );
  
        return data.user;
      } catch (error) {
        console.error("❌ Update User Error:", error.response?.data || error.message);
        return rejectWithValue(error.response?.data?.message || 'Failed to update user');
      }
    }
  );
  

export const deleteUser = createAsyncThunk('admin/deleteUser', async (userId, { rejectWithValue }) => {
    try {
        await axios.delete(`${BASE_URL}/users/${userId}`, {
            withCredentials: true, // ✅ Ensures authentication is included
        });
        return userId; // Return deleted user's ID for filtering out
    } catch (error) {
        console.error("❌ Delete User Error:", error.response?.data || error.message);
        return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
});
// 📌 Initial State
const initialState = {
    adminInfo: null, // Stores logged-in admin details
    users: [], // Stores list of users
    selectedUser: null, // Stores single user details when editing
    status: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
    error: null, // Stores any errors from API
    successMessage: null, // Stores success messages for UI
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
    },
};

// 📌 Slice
const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        resetAdminState: (state) => {
            state.error = null;
            state.successMessage = null;
            state.status = 'idle';
        },
        logoutAdmin: (state) => {
            state.adminInfo = null;
            state.users = [];
            state.selectedUser = null;
            state.status = 'idle';
            state.error = null;
            state.successMessage = null;
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

            // 🔹 Fetch Users
            .addCase(fetchUsers.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.status = 'success';
                state.users = action.payload.users;
                state.pagination.currentPage = action.payload.currentPage;
                state.pagination.totalPages = action.payload.totalPages;
                state.pagination.totalUsers = action.payload.totalUsers;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // 🔹 Fetch Single User
            .addCase(fetchUserById.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.status = 'success';
                state.selectedUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // 🔹 Handle User Creation
            .addCase(createUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.status = 'success';
                state.successMessage = 'User created successfully';
                state.users.push(action.payload); // ✅ Add new user to the list
            })
            .addCase(createUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })


            // 🔹 Update User
            .addCase(updateUser.pending, (state) => {
                state.status = 'loading';
                state.successMessage = null;
            })
        .addCase(updateUser.fulfilled, (state, action) => {
            state.status = 'success';
            state.successMessage = 'User updated successfully';
             // ✅ Update selectedUser with new data
             state.selectedUser = action.payload;

             // ✅ Ensure users array is populated before updating
             if (state.users.length > 0) {
                 const index = state.users.findIndex(user => user._id === action.payload._id);
                 if (index !== -1) {
                     state.users[index] = action.payload;
                 }
             } else {
                 // ✅ If users array is empty, refetch the users
                 state.status = 'loading'; // Indicate re-fetching
             }
         })
        .addCase(updateUser.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        })

        // 🔹 Delete User
        .addCase(deleteUser.pending, (state) => {
            state.status = 'loading';
            state.successMessage = null;
            state.error = null;
        })
        .addCase(deleteUser.fulfilled, (state, action) => {
            state.status = 'success';
            state.successMessage = 'User deleted successfully';
            state.users = state.users.filter(user => user._id !== action.payload);
        })
        .addCase(deleteUser.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
},
});

// 📌 Export Actions
export const { resetAdminState, logoutAdmin } = adminSlice.actions;

// 📌 Export Reducer
export default adminSlice.reducer;
