// messageSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Your backend URL for messages
const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/messages`;


/* -------------------------------- Thunks -------------------------------- */

// 1) Fetch all conversation “cards”
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/conversations`, {
        withCredentials: true, // if using cookies for auth
      });
      // response.data is an array of conversation objects
      // Each object has: { advert, lastMessage, otherUser }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch conversations'
      );
    }
  }
);

// 2) Fetch all messages for one conversation
// Controller expects: /fetch?advertId=...&otherUserId=...
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ advertId, otherUserId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/fetch`, {
        params: { advertId, otherUserId },
        withCredentials: true,
      });
      // response.data = { messages: [...], advert: { id, title, image } }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch messages'
      );
    }
  }
);

// 3) Send a new message to the conversation
// Controller expects { advertId, participantId, message }
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ advertId, participantId, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/send`,
        { advertId, participantId, message },
        { withCredentials: true }
      );
      // response.data.data is the newly created message doc
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
  async ({ advertId, otherUserId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/deleteConversation`, {
        data: { advertId, otherUserId },
        withCredentials: true,
      });
      return { advertId, otherUserId };
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
    conversations: [], // list of all conversation “cards”
    activeConversation: {
      advert: null,      // { id, title, image } from backend
      participants: null,   // You’ll set this from the conversation “card” or a separate user fetch
      messages: [],      // array of the actual message docs
    },
    status: 'idle',
    error: null,
  },
  reducers: {
    // Set or update the currently active conversation 
    setActiveConversation(state, { payload }) {
      // payload might include { advert, otherUser }
      state.activeConversation = {
        ...state.activeConversation,
        ...payload,
      };
    },

    // Completely reset or clear the conversation state
    resetMessagesState(state) {
      state.conversations = [];
      state.activeConversation = {
        advert: null,
        otherUser: null,
        messages: [],
      };
      state.loading = false;
      state.error = null;
    },
    addNewMessage(state, { payload }) {
      state.activeConversation.messages.push(payload);
    },
    markMessageAsRead(state, { payload }) {
      const { messageId, userId } = payload;
      const message = state.activeConversation.messages.find((msg) => msg._id === messageId);
      if (message) {
        message.isRead = true; // Ensure this triggers a UI update
        console.log(`Message ${messageId} updated as read in Redux state`);
      }
    },
    
  },
  extraReducers: (builder) => {
    /* -------------- fetchConversations -------------- */
    builder.addCase(fetchConversations.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(fetchConversations.fulfilled, (state, { payload }) => {
      state.status = 'success';
      // payload is an array of conversation “cards”
      state.conversations = payload;
      console.log(payload);
    });
    builder.addCase(fetchConversations.rejected, (state, { payload }) => {
      state.status = 'failed';
      state.error = payload;
    });

    /* -------------- fetchMessages -------------- */
    builder.addCase(fetchMessages.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(fetchMessages.fulfilled, (state, { payload }) => {
      state.status = 'success';
      // payload = { messages, advert }
      const { messages, advert, participants } = payload;
      // Put them in the activeConversation
      state.activeConversation.advert = advert; // { id, title, image }
      state.activeConversation.messages = messages || [];
      state.activeConversation.participants = participants || null; // Store participants
    });
    builder.addCase(fetchMessages.rejected, (state, { payload }) => {
      state.status = 'failed';
      state.error = payload;
    });

    /* -------------- sendMessage -------------- */
    builder.addCase(sendMessage.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, { payload }) => {
      state.status = 'success';
      // payload is the newly created message doc
      // Append it to the current conversation’s messages
      //state.activeConversation.messages.push(payload);
    });
    builder.addCase(sendMessage.rejected, (state, { payload }) => {
      state.status = 'failed';
      state.error = payload;
    })

    /* -------------- deleteConversation -------------- */

    builder.addCase(deleteConversation.fulfilled, (state, { payload }) => {
      state.conversations = state.conversations.filter(
        (conv) => conv.advert.id !== payload.advertId || conv.otherUser.id !== payload.otherUserId
      );
    });

  },
});

/* ------------------------------- Exports ------------------------------- */

export const { setActiveConversation, resetMessagesState, addNewMessage,   markMessageAsRead } = messageSlice.actions;

export default messageSlice.reducer;
