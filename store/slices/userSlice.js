import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`;

// Thunk for fetching profile data
export const fetchuserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/fetchuserProfile`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle 401 specifically
        if (response.status === 401) {
          return rejectWithValue('Authentication required. Please log in.');
        }
        return rejectWithValue(errorData.message || 'Failed to fetch profile data');
      }

      const data = await response.json();
      console.log('UserSlice/fetchProfile user details as response:', data);
      return data; // Expected: { user: { _id, name, email }, adverts: [...] }
    } catch (err) {
      return rejectWithValue('An unexpected error occurred. Please try again later.');
    }
  }
);



// Register user thunk
export const registerUser = createAsyncThunk(
  'user/registerUser',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // ✅ send all fields
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to register user');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      return rejectWithValue('An unexpected error occurred during registration. Please try again.');
    }
  }
);


// Send OTP for email verification
export const sendVerifyOtp = createAsyncThunk(
  'user/sendVerifyOtp',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sendVerifyOtp`, {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to send OTP');
      }

      const data = await response.json();
      console.log('UserSlice/sendVerifyOtp response:', data);
      return data; // Expected: { success: true, message: 'OTP sent successfully' }
    } catch (err) {
      return rejectWithValue('An unexpected error occurred while sending OTP. Please try again.');
    }
  }
);


// Verify email with OTP
export const verifyEmail = createAsyncThunk(
  'user/verifyEmail',
  async ({ otp }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verifyEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to verify account');
      }

      const data = await response.json();
      return data; // Expected: { message: 'Account verified successfully' }
    } catch (err) {
      return rejectWithValue('An unexpected error occurred. Please try again.');
    }
  }
);


// Thunk for logging in user
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Include cookies in the request
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Login failed. Please check your credentials.');
      }
      return data.user; // Return only the user data
    } catch (err) {
      return rejectWithValue(err.message || 'An unexpected error occurred. Please try again later.');
    }
  }
);


// Thunk for validating token
export const validateToken = createAsyncThunk(
  'user/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Token validation failed');
      }

      const data = await response.json();
      return data; // { isAuthenticated: true, user }
    } catch (err) {
      return rejectWithValue('An unexpected error occurred during token validation');
    }
  }
);

// Thunk for logging out user
export const logoutUser = createAsyncThunk(
  'user/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to logout');
      }

      return true; // Successful logout
    } catch (err) {
      return rejectWithValue('An unexpected error occurred. Please try again later.');
    }
  }
);

// Thunk for adding an advert to the wishlist
export const addToWishlist = createAsyncThunk(
  'user/addToWishlist',
  async ({ advertId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/wishlist/add`,
        { advertId },
        { withCredentials: true }
      );
      return response.data.wishlist; // Return updated wishlist as strings
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

// Thunk for removing an advert from the wishlist
export const removeFromWishlist = createAsyncThunk(
  'user/removeFromWishlist',
  async ({ advertId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/wishlist/remove`,
        {
          data: { advertId },
          withCredentials: true,
        }
      );
      return response.data.wishlist; // Return updated wishlist as strings
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

// Thunk for fetching the user's wishlist
export const getWishlist = createAsyncThunk(
  'user/getWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/wishlist`, {
        withCredentials: true,
      });
      return response.data.wishlist; // Return detailed wishlist array from backend
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// Get event wishlist
export const getEventWishlist = createAsyncThunk(
  'user/getEventWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/eventwishlist`, { withCredentials: true });
      return res.data.wishlist;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch event wishlist');
    }
  }
);

// Add event to wishlist
export const addToEventWishlist = createAsyncThunk(
  'user/addToEventWishlist',
  async ({ eventId }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/eventwishlist/add`,
        { eventId },
        { withCredentials: true }
      );
      return res.data.eventWishlist;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add event to wishlist');
    }
  }
);

// Remove event from wishlist
export const removeFromEventWishlist = createAsyncThunk(
  'user/removeFromEventWishlist',
  async ({ eventId }, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/eventwishlist/remove`, {
        data: { eventId },
        withCredentials: true,
      });
      return res.data.eventWishlist;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove event from wishlist');
    }
  }
);


//Thunk to Password Reset OTP
export const sendResetOtp = createAsyncThunk(
  'user/sendResetOtp',
  async (email, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sendResetOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to send reset OTP');
      }

      const data = await response.json();
      console.log('UserSlice/sendResetOtp response:', data);
      return data; // Expected: { success: true, message: 'OTP sent successfully' }
    } catch (err) {
      return rejectWithValue('An unexpected error occurred while sending reset OTP. Please try again.');
    }
  }
);

//Thunk to Reset Password
export const resetPassword = createAsyncThunk(
  'user/resetPassword',
  async ({ email, otp, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/resetPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to reset password');
      }

      return data; // { message: 'Password reset successfully' }
    } catch (err) {
      return rejectWithValue('An unexpected error occurred while resetting password.');
    }
  }
);

// ✅ 3. REDUX THUNK TO FETCH ACCOUNT DETAILS
export const fetchAccountDetails = createAsyncThunk(
  'user/fetchAccountDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/account/details`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch account info');
      }

      const data = await response.json();
      return data.user;
    } catch (err) {
      return rejectWithValue('An unexpected error occurred.');
    }
  }
);

// ✅ 4. REDUX THUNK TO UPDATE ACCOUNT DETAILS
export const updateAccountDetails = createAsyncThunk(
  'user/updateAccountDetails',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/account/details`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to update details');
      }

      const data = await response.json();
      return data.message;
    } catch (err) {
      return rejectWithValue('Update failed. Please try again.');
    }
  }
);

// REDUX THUNK TO DELETE ACCOUNT
export const deleteUserAccount = createAsyncThunk(
  'user/deleteUserAccount',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('🔸 deleteUserAccount called with userId:', userId); // 👈 logging the incoming value

      const response = await fetch(`${API_BASE_URL}/account/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }), // Optional: Only if your backend expects body
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to delete account');
      }

      return data.message;
    } catch (error) {
      return rejectWithValue(error.message || 'Unexpected error');
    }
  }
);




const initialState = {
  tokenValidated: false,
  user: null,
  adverts: [],
  status: 'idle',
  error: null,
  resetStatus: 'idle',
  resetError: null,
  otpMessage: null,
  accountDetails: null,
  accountDetailsStatus: 'idle',
  accountDetailsError: null,
  updateAccountMessage: null,
  deleteStatus: 'idle',
  deleteError: null,
  advertWishlist: [],
  advertWishlistStatus: 'idle',
  advertWishlistError: null,
  eventWishlist: [],
  eventWishlistStatus: 'idle',
  eventWishlistError: null,

};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetError(state) {
      state.error = null;
    },
    resetValidation(state) {
      state.tokenValidated = false; // Reset validation when needed
    },
    resetOtpState(state) {
      state.otpMessage = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // Register user cases
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.status = 'success';
        state.tokenValidated = true;
        state.user = {
          _id: payload._id,
          name: payload.name,
          email: payload.email,
          isAccountVerified: payload.isAccountVerified,
        };
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // Send OTP cases
      .addCase(sendVerifyOtp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(sendVerifyOtp.fulfilled, (state) => {
        state.status = 'success';
      })
      .addCase(sendVerifyOtp.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // Verify email cases
      .addCase(verifyEmail.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.status = 'success';
        state.user.isAccountVerified = true;
      })
      .addCase(verifyEmail.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // Login user cases
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.status = 'success';
        state.tokenValidated = true;
        state.user = {
          _id: payload._id,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          isAccountVerified: payload.isAccountVerified,
        };
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // Fetch profile cases
      .addCase(fetchuserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchuserProfile.fulfilled, (state, { payload }) => {
        state.status = 'success';
        state.tokenValidated = true;
        state.user = {
          _id: payload.user._id,
          name: payload.user.name,
          email: payload.user.email,
          isAccountVerified: payload.user.isAccountVerified,
        };
        state.adverts = payload.adverts || [];
        state.error = null;
      })
      .addCase(fetchuserProfile.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // Logout user cases
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // Validate token cases
      .addCase(validateToken.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(validateToken.fulfilled, (state, { payload }) => {
        state.status = 'success';
        state.tokenValidated = true;
        state.user = {
          _id: payload.user._id,
          name: payload.user.name,
          email: payload.user.email,
          isAccountVerified: payload.user.isAccountVerified,
        };
      })
      .addCase(validateToken.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // ✅ ADD to Advert Wishlist (match event logic)
      .addCase(addToWishlist.pending, (state) => {
        state.advertWishlistStatus = 'loading';
        state.advertWishlistError = null;
      })
      .addCase(addToWishlist.fulfilled, (state, { payload }) => {
        state.advertWishlistStatus = 'success';
        state.user = {
          ...state.user,
          advertWishlist: payload.map((id) => id.toString()), // IDs only
        };
        state.advertWishlist = state.advertWishlist.filter(
          (adv) => payload.includes(adv._id.toString())
        );        
      })
      .addCase(addToWishlist.rejected, (state, { payload }) => {
        state.advertWishlistStatus = 'failed';
        state.advertWishlistError = payload;
      })

      // ✅ REMOVE from Advert Wishlist (match event logic)
      .addCase(removeFromWishlist.pending, (state) => {
        state.advertWishlistStatus = 'loading';
        state.advertWishlistError = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, { payload }) => {
        state.advertWishlistStatus = 'success';
        state.user = {
          ...state.user,
          advertWishlist: payload.map((id) => id.toString()),
        };
        state.advertWishlist = state.advertWishlist.filter(
          (adv) => payload.includes(adv._id.toString())
        );
      })
      .addCase(removeFromWishlist.rejected, (state, { payload }) => {
        state.advertWishlistStatus = 'failed';
        state.advertWishlistError = payload;
      })

      // ✅ GET Advert Wishlist
      .addCase(getWishlist.pending, (state) => {
        state.advertWishlistStatus = 'loading';
        state.advertWishlistError = null;
      })
      .addCase(getWishlist.fulfilled, (state, { payload }) => {
        state.advertWishlistStatus = 'success';
        state.advertWishlist = payload; // full advert objects
        state.user = {
          ...state.user,
          advertWishlist: payload.map((adv) => adv._id.toString()),
        };
      })
      .addCase(getWishlist.rejected, (state, { payload }) => {
        state.advertWishlistStatus = 'failed';
        state.advertWishlistError = payload;
      })


      // Send reset OTP cases
      .addCase(sendResetOtp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(sendResetOtp.fulfilled, (state, { payload }) => {
        state.status = 'success';
        state.error = null;
        state.otpMessage = payload.message; // Optional: if you want to store success message
      })
      .addCase(sendResetOtp.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // Password Reset
      .addCase(resetPassword.pending, (state) => {
        state.resetStatus = 'loading';
        state.resetError = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetStatus = 'success';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetStatus = 'failed';
        state.resetError = action.payload;
      })

      // 🟦 FETCH ACCOUNT DETAILS
      .addCase(fetchAccountDetails.pending, (state) => {
        state.accountDetailsStatus = 'loading';
        state.accountDetailsError = null;
      })
      .addCase(fetchAccountDetails.fulfilled, (state, { payload }) => {
        state.accountDetailsStatus = 'succeeded';
        state.accountDetails = payload;
      })
      .addCase(fetchAccountDetails.rejected, (state, { payload }) => {
        state.accountDetailsStatus = 'failed';
        state.accountDetailsError = payload;
      })

      // 🟩 UPDATE ACCOUNT DETAILS
      .addCase(updateAccountDetails.pending, (state) => {
        state.accountDetailsStatus = 'updating';
        state.accountDetailsError = null;
        state.updateAccountMessage = null;
      })
      .addCase(updateAccountDetails.fulfilled, (state, { payload }) => {
        state.accountDetailsStatus = 'updated';
        state.updateAccountMessage = payload;
      })
      .addCase(updateAccountDetails.rejected, (state, { payload }) => {
        state.accountDetailsStatus = 'update_failed';
        state.accountDetailsError = payload;
      })

      // 🟥 DELETE ACCOUNT
      .addCase(deleteUserAccount.pending, (state) => {
        state.deleteStatus = 'loading';
        state.deleteError = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        state.deleteStatus = 'succeeded';
        state.user = null;
        state.accountDetails = null;
        state.tokenValidated = false;
      })
      .addCase(deleteUserAccount.rejected, (state, { payload }) => {
        state.deleteStatus = 'failed';
        state.deleteError = payload;
      })

      // ✅ GET Event Wishlist
      .addCase(getEventWishlist.pending, (state) => {
        state.eventWishlistStatus = 'loading';
        state.eventWishlistError = null;
      })
      .addCase(getEventWishlist.fulfilled, (state, { payload }) => {
        state.eventWishlistStatus = 'success';
        state.eventWishlist = payload;
        state.user = {
          ...state.user,
          eventWishlist: payload.map((event) => event._id.toString()),
        };
      })
      .addCase(getEventWishlist.rejected, (state, { payload }) => {
        state.eventWishlistStatus = 'failed';
        state.eventWishlistError = payload;
      })

      // ✅ ADD to Event Wishlist
      .addCase(addToEventWishlist.pending, (state) => {
        state.eventWishlistStatus = 'loading';
        state.eventWishlistError = null;
      })
      .addCase(addToEventWishlist.fulfilled, (state, { payload }) => {
        state.eventWishlistStatus = 'success';
        state.user = {
          ...state.user,
          eventWishlist: payload.map((id) => id.toString()),
        };
        state.eventWishlist = state.eventWishlist.filter(
          (event) => payload.includes(event._id.toString())
        );
      })
      .addCase(addToEventWishlist.rejected, (state, { payload }) => {
        state.eventWishlistStatus = 'failed';
        state.eventWishlistError = payload;
      })


      // ✅ REMOVE from Event Wishlist
      .addCase(removeFromEventWishlist.pending, (state) => {
        state.eventWishlistStatus = 'loading';
        state.eventWishlistError = null;
      })
      .addCase(removeFromEventWishlist.fulfilled, (state, { payload }) => {
        state.eventWishlistStatus = 'success';
        state.user = {
          ...state.user,
          eventWishlist: payload.map((id) => id.toString()),
        };
        state.eventWishlist = state.eventWishlist.filter(
          (event) => payload.includes(event._id.toString())
        );
      })
      .addCase(removeFromEventWishlist.rejected, (state, { payload }) => {
        state.eventWishlistStatus = 'failed';
        state.eventWishlistError = payload;
      });


  },
});

export const { resetError, resetValidation, resetOtpState } = userSlice.actions;
export default userSlice.reducer;
