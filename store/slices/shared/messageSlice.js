// messageSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axiosConfig';

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
  async ({ resourceId, resourceType, participantId, message, createdAt, replyTo }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/send`,
        { resourceId, resourceType, participantId, message, createdAt, replyTo }, // ✅ include createdAt and replyTo
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

// 5) Delete a single message
export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/message/${messageId}`, {
        withCredentials: true,
      });
      return { messageId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete message'
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
    inActiveChat: false,
    replyingTo: null,     // For reply feature
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
      state.inActiveChat = false;
    },

    addNewMessage(state, { payload }) {
      // Just add the message as is - canDelete should be set by the component
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
    setInActiveChat(state, action) {
      state.inActiveChat = action.payload;
      if (action.payload === true) {
        state.unreadExists = false;
      }
    },
    recalculateUnreadStatus(state, { payload }) {
      const currentUserId = payload?.currentUserId;
      
      if (!currentUserId || !state.conversations || !state.conversations.length) {
        return;
      }
      
      const hasUnread = state.conversations.some(conv => {
        if (!conv.lastMessage || !conv.otherUser) return false;
        
        // Check if the last message is from the other user
        const isFromOtherUser = conv.lastMessage.senderId === conv.otherUser.id;
        
        // Check if the message is unread
        const isUnread = (isFromOtherUser && 
                          (!conv.lastMessage.readBy || 
                           conv.lastMessage.readBy !== currentUserId));
        
        return isUnread;
      });
      
      state.unreadExists = hasUnread;
    },
    // Reply feature reducers
    setReplyingTo(state, action) {
      state.replyingTo = action.payload;
    },
    clearReplyingTo(state) {
      state.replyingTo = null;
    },
    // Handle message deletion
    markMessageAsDeleted(state, { payload }) {
      const message = state.activeConversation.messages.find((msg) => msg._id === payload.messageId);
      if (message) {
        message.deletedAt = new Date().toISOString();
        message.isDeleted = true;
        message.message = '[Message deleted]';
        
        // Update all reply previews that reference this deleted message
        state.activeConversation.messages.forEach((msg) => {
          if (msg.replyTo && typeof msg.replyTo === 'object' && msg.replyTo._id === payload.messageId) {
            msg.replyTo.message = '[Message deleted]';
            msg.replyTo.deletedAt = new Date().toISOString();
          }
        });
        
        // Update the conversation list if this is the last message
        if (state.conversations && state.activeConversation) {
          const conversation = state.conversations.find(conv => 
            conv.resourceId === state.activeConversation.resource._id &&
            conv.resourceType === state.activeConversation.resource.relatedTo
          );
          
          if (conversation && conversation.lastMessage && conversation.lastMessage.id === payload.messageId) {
            conversation.lastMessage.text = '[Message deleted]';
          }
        }
      }
    }
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
        state.inActiveChat = true;
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
      })
      // Delete message handlers
      .addCase(deleteMessage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteMessage.fulfilled, (state, { payload }) => {
        const message = state.activeConversation.messages.find(
          (msg) => msg._id === payload.messageId
        );
        if (message) {
          message.deletedAt = new Date().toISOString();
          message.isDeleted = true;
          message.message = '[Message deleted]';
          message.canDelete = false;
          
          // Update all reply previews that reference this deleted message
          state.activeConversation.messages.forEach((msg) => {
            if (msg.replyTo && typeof msg.replyTo === 'object' && msg.replyTo._id === payload.messageId) {
              msg.replyTo.message = '[Message deleted]';
              msg.replyTo.deletedAt = new Date().toISOString();
            }
          });
          
          // Update the conversation list if this is the last message
          if (state.conversations && state.activeConversation) {
            const conversation = state.conversations.find(conv => 
              conv.resourceId === state.activeConversation.resource._id &&
              conv.resourceType === state.activeConversation.resource.relatedTo
            );
            
            if (conversation && conversation.lastMessage && conversation.lastMessage.id === payload.messageId) {
              conversation.lastMessage.text = '[Message deleted]';
            }
          }
        }
        state.status = 'success';
      })
      .addCase(deleteMessage.rejected, (state, { payload }) => {
        state.status = 'failed';
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
  setInActiveChat,
  recalculateUnreadStatus,
  setReplyingTo,
  clearReplyingTo,
  markMessageAsDeleted,
} = messageSlice.actions;

export default messageSlice.reducer;