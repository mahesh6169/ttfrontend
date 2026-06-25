import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`;

// Thunk for fetching profile data
export const fetchuserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/fetchuserProfile`, {
        withCredentials: true, // Include cookies in the request
      });

      console.log('UserSlice/fetchProfile user details as response:', response.data);
      return response.data; // Expected: { user: { _id, name, email }, adverts: [...] }
    } catch (err) {
      // Handle 401 specifically
      if (err.response?.status === 401) {
        return rejectWithValue('Authentication required. Please log in.');
      }
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred. Please try again later.'
      );
    }
  }
);



// Register user thunk
export const registerUser = createAsyncThunk(
  'user/registerUser',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/register`,
        formData, // ✅ send all fields
        {
          withCredentials: true,
        }
      );

      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred during registration. Please try again.'
      );
    }
  }
);


// Send OTP for email verification
export const sendVerifyOtp = createAsyncThunk(
  'user/sendVerifyOtp',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/sendVerifyOtp`,
        {},
        {
          withCredentials: true, // Include cookies in the request
        }
      );

      console.log('UserSlice/sendVerifyOtp response:', response.data);
      return response.data; // Expected: { success: true, message: 'OTP sent successfully' }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred while sending OTP. Please try again.'
      );
    }
  }
);


// Verify email with OTP
export const verifyEmail = createAsyncThunk(
  'user/verifyEmail',
  async ({ otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/verifyEmail`,
        { otp },
        {
          withCredentials: true, // Include cookies for authentication
        }
      );

      return response.data; // Expected: { message: 'Account verified successfully' }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred. Please try again.'
      );
    }
  }
);


// Thunk for logging in user
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/login`,
        { email, password },
        {
          withCredentials: true, // Include cookies in the request
        }
      );

      return response.data.user; // Return only the user data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred. Please try again later.'
      );
    }
  }
);


// Thunk for validating token
export const validateToken = createAsyncThunk(
  'user/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/validate`, {
        withCredentials: true, // Include cookies in the request
      });

      return response.data; // { isAuthenticated: true, user }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred during token validation'
      );
    }
  }
);

// Thunk for logging out user
export const logoutUser = createAsyncThunk(
  'user/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/logout`,
        {},
        {
          withCredentials: true, // Include cookies in the request
        }
      );

      return true; // Successful logout
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred. Please try again later.'
      );
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
      return response.data.wishlist; // Now contains full advert objects
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
      const response = await axios.post(`${API_BASE_URL}/sendResetOtp`, { email });

      console.log('UserSlice/sendResetOtp response:', response.data);
      return response.data; // Expected: { success: true, message: 'OTP sent successfully' }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred while sending reset OTP. Please try again.'
      );
    }
  }
);

//Thunk to Reset Password
export const resetPassword = createAsyncThunk(
  'user/resetPassword',
  async ({ email, otp, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/resetPassword`, {
        email,
        otp,
        newPassword,
        confirmPassword,
      });

      return response.data; // { message: 'Password reset successfully' }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred while resetting password.'
      );
    }
  }
);

// ✅ 3. REDUX THUNK TO FETCH ACCOUNT DETAILS
export const fetchAccountDetails = createAsyncThunk(
  'user/fetchAccountDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/account/details`, {
        withCredentials: true,
      });

      return response.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'An unexpected error occurred.'
      );
    }
  }
);

// ✅ 4. REDUX THUNK TO UPDATE ACCOUNT DETAILS
export const updateAccountDetails = createAsyncThunk(
  'user/updateAccountDetails',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/account/details`,
        formData,
        {
          withCredentials: true,
        }
      );

      return response.data.message;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Update failed. Please try again.'
      );
    }
  }
);

// REDUX THUNK TO DELETE ACCOUNT
export const deleteUserAccount = createAsyncThunk(
  'user/deleteUserAccount',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('🔸 deleteUserAccount called with userId:', userId); // 👈 logging the incoming value

      const response = await axios.delete(
        `${API_BASE_URL}/account/delete`,
        {
          data: { userId }, // Optional: Only if your backend expects body
          withCredentials: true,
        }
      );

      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Unexpected error'
      );
    }
  }
);

// REDUX THUNK TO ACCEPT UPDATED TERMS
export const acceptUpdatedTerms = createAsyncThunk(
  'user/acceptUpdatedTerms',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/accept-terms`,
        {},
        {
          withCredentials: true,
        }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to accept terms'
      );
    }
  }
);

// REDUX THUNK TO MUTE THREAD NOTIFICATION
export const muteThreadNotification = createAsyncThunk(
  'user/muteThreadNotification',
  async (threadId, thunkAPI) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/mute/${threadId}`,
        {},
        { withCredentials: true }
      );
      return { threadId };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// REDUX THUNK TO UNMUTE THREAD NOTIFICATION
export const unmuteThreadNotification = createAsyncThunk(
  'user/unmuteThreadNotification',
  async (threadId, thunkAPI) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/unmute/${threadId}`,
        {},
        { withCredentials: true }
      );
      return { threadId };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


const initialState = {
  tokenValidated: false,
  user: null,
  adverts: [],
  status: 'idle',
  error: null,
  profileLoaded: false,
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
  mutedThreads: [],

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
          role: payload.user.role,
          isAccountVerified: payload.user.isAccountVerified,
          acceptedTermsVersion: payload.user.acceptedTermsVersion || null,
          acceptedTermsAt: payload.user.acceptedTermsAt || null,
        };
        state.adverts = payload.adverts || [];
        state.error = null;
        state.profileLoaded = true; // Set profileLoaded to true after fetching
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
          role: payload.user.role,
          stripeAccountId: payload.user.stripeAccountId || null,
            stripeAccountStatus: payload.user.stripeAccountStatus || 'no_account',
          // 🏷️ Host-type flags (see HostTypeFlags.md) - drive the Organiser menu
          freeHost: payload.user.freeHost || false,
          paidHost: payload.user.paidHost || false,
          promoHost: payload.user.promoHost || false,
        };
        state.mutedThreads = payload.user.mutedThreads || [];
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
      })

      // ✅ Accept Updated Terms
      .addCase(acceptUpdatedTerms.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(acceptUpdatedTerms.fulfilled, (state, action) => {
        state.status = 'success';
        if (state.user) {
          state.user.acceptedTermsVersion = action.payload.acceptedTermsVersion;
          state.user.acceptedTermsAt = action.payload.acceptedTermsAt;
        }
      })
      .addCase(acceptUpdatedTerms.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // Mute thread notification
.addCase(muteThreadNotification.pending, (state) => {
  state.status = 'loading';
})
.addCase(muteThreadNotification.fulfilled, (state, action) => {
  const threadId = action.payload.threadId;
  if (!state.mutedThreads.includes(threadId)) {
    state.mutedThreads.push(threadId); // ✅ Add threadId if not already present
  }
  state.status = 'success';
})
.addCase(muteThreadNotification.rejected, (state, action) => {
  state.status = 'failed';
  state.error = action.payload;
})

// Unmute thread notification
.addCase(unmuteThreadNotification.pending, (state) => {
  state.status = 'loading';
})
.addCase(unmuteThreadNotification.fulfilled, (state, action) => {
  const threadId = action.payload.threadId;
  state.mutedThreads = state.mutedThreads.filter((id) => id !== threadId); // ✅ Remove threadId
  state.status = 'success';
})
.addCase(unmuteThreadNotification.rejected, (state, action) => {
  state.status = 'failed';
  state.error = action.payload;
});



  },
});

export const { resetError, resetValidation, resetOtpState } = userSlice.actions;
export default userSlice.reducer;
