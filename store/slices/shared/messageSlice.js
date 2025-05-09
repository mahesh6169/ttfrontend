// messageSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/messages`;

/* -------------------------------- Thunks -------------------------------- */

// 1) Fetch all conversation “cards”
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/conversations`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch conversations'
      );
    }
  }
);

// 2) Fetch all messages for one conversation
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ resourceId, resourceType, otherUserId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/fetch`, {
        params: { resourceId, resourceType, otherUserId },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch messages'
      );
    }
  }
);

// 3) Send a new message
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ resourceId, resourceType, participantId, message, createdAt }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/send`,
        { resourceId, resourceType, participantId, message, createdAt }, // ✅ include createdAt
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send message'
      );
    }
  }
);


// 4) Delete a conversation
export const deleteConversation = createAsyncThunk(
  'messages/deleteConversation',
  async ({ resourceId, resourceType, otherUserId }, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${BASE_URL}/deleteConversation`, {
        data: { resourceId, resourceType, otherUserId },
        withCredentials: true,
      });
      return { resourceId, resourceType, otherUserId }; // Optional if you still want to use this data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete conversation'
      );
    }
  }
);


/* -------------------------------- Slice -------------------------------- */

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    conversations: [],
    activeConversation: {
      resource: null,      // event or advert
      resourceType: null,  // 'advert' or 'event'
      participants: null,
      messages: [],
    },
    status: 'idle',
    error: null,
    deleteConversationStatus: 'idle',
    unreadExists: false,
  },
  reducers: {
    setActiveConversation(state, { payload }) {
      state.activeConversation = {
        ...state.activeConversation,
        ...payload,
      };
    },
    resetMessagesState(state) {
      state.conversations = [];
      state.activeConversation = {
        resource: null,
        resourceType: null,
        participants: null,
        messages: [],
      };
      state.status = 'idle';
      state.error = null;
    },

    addNewMessage(state, { payload }) {
      state.activeConversation.messages.push(payload);
    },
    markMessageAsRead(state, { payload }) {
      const { messageId, userId } = payload;   // ✅ Expect both messageId and userId
      const message = state.activeConversation.messages.find((msg) => msg._id === messageId);
      if (message) {
        message.readBy = userId;                // ✅ Correct field is readBy (not readUser)
        message.isRead = true;                  // Optional, for your UI logic
      }
    },
    setUnreadExists(state, action) {
      state.unreadExists = action.payload;
    },
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, { payload }) => {
        state.status = 'success';
        state.conversations = payload;
        state.deleteConversationStatus = 'idle';
      })
      .addCase(fetchConversations.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, { payload }) => {
        const { messages, resourceType, participants } = payload;
      
        // Dynamically get the actual resource (advert or event)
        const resource = payload[resourceType];
      
        state.status = 'success';
        state.activeConversation = {
          resource,
          resourceType,
          participants,
          messages: messages || [],
        };
      })
      
      .addCase(fetchMessages.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      .addCase(sendMessage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.status = 'success';
      })
      .addCase(sendMessage.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      .addCase(deleteConversation.pending, (state) => {
        state.deleteConversationStatus = 'loading'; // ✅ Change here
        state.error = null;
      })
      .addCase(deleteConversation.fulfilled, (state) => {
        state.deleteConversationStatus = 'success'; // ✅ Success here
      })
      .addCase(deleteConversation.rejected, (state, { payload }) => {
        state.deleteConversationStatus = 'failed'; // ✅ Failed here
        state.error = payload;
      });

  },
});

export const {
  setActiveConversation,
  resetMessagesState,
  addNewMessage,
  markMessageAsRead,
  setUnreadExists,
} = messageSlice.actions;

export default messageSlice.reducer;