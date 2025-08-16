import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/threads`;


/* -------------------------------- Create a Thread --------------------------------- */

export const createThread = createAsyncThunk(
    'threads/createThread',
    async (formData, { rejectWithValue }) => {
      try {
        const response = await axios.post(`${BASE_URL}/create`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (error) {
        console.error("🔴 Error creating thread:", error.response?.data || error.message);
        return rejectWithValue(error.response?.data?.message || "Failed to create thread");
      }
    }
  );



/* -------------------------------- Fetch Threads (Public) -------------------------------- */
export const fetchThreads = createAsyncThunk(
    'threads/fetchThreads',
    async (_, { getState, rejectWithValue }) => {
      try {
        const { page, limit } = getState().threads;
  
        const response = await axios.get(BASE_URL, {
          params: { page, limit },
        });
  
        console.log("✅ Axios response:", response.data); // Debugging line
  
        // Ensure meta is always included
        return {
          threads: response.data.threads || [], // Prevent undefined
          meta: response.data.meta || { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: limit }
        };
  
      } catch (error) {
        console.error("🔴 Error fetching threads:", error.response?.data || error.message);
        return rejectWithValue(error.response?.data?.message || "Failed to fetch threads");
      }
    }
  );
  



/* -------------------------------- Fetch Threads by Category -------------------------------- */
export const fetchThreadsByCategory = createAsyncThunk(
    'threads/fetchThreadsByCategory',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { category, page, limit } = getState().threads; // ✅ Get category, page, limit from state

            const params = {
                ...(category && { category }),
                page,
                limit,
            };

            const response = await axios.get(`${BASE_URL}/categories`, { params });
            return response.data;
        } catch (error) {
            console.error("🔴 Error fetching threads by category:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch threads");
        }
    }
);

/* -------------------------------- Fetch Threads by ID -------------------------------- */
export const fetchThreadById = createAsyncThunk(
    'threads/fetchThreadById',
    async (threadId, { rejectWithValue }) => {
      try {
        const response = await axios.get(`${BASE_URL}/thread/${threadId}`, { withCredentials: true });
        console.log('[Thunk] API success. Response:', response.data);
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch thread');
      }
    }
  );
  

/* -------------------------------- Fetch Messages for a Thread -------------------------------- */
export const fetchThreadMessages = createAsyncThunk(
    'threads/fetchThreadMessages',
    async (threadId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${BASE_URL}/${threadId}/messages`);
            return { threadId, messages: response.data }; // Store messages per thread
        } catch (error) {
            console.error(`🔴 Error fetching messages for thread ${threadId}:`, error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch thread messages");
        }
    }
);

/* -------------------------------- Send a Message in a Thread (Requires Auth) -------------------------------- */
export const sendThreadMessage = createAsyncThunk(
    'threads/sendMessage',
    async ({ threadId, message, createdAt, replyTo }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${BASE_URL}/send`,
                { threadId, message, createdAt, replyTo },
                { withCredentials: true } // ✅ Include authentication
            );
            return { threadId, message: response.data };
        } catch (error) {
            console.error(`🔴 Error sending message to thread ${threadId}:`, error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to send message");
        }
    }
);

/* -------------------------------- Like Message in a Thread (Requires Auth) -------------------------------- */
export const likeMessage = createAsyncThunk(
    "threads/likeMessage",
    async (messageId, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/message/${messageId}/like`, {}, { withCredentials: true });
            return { messageId, likes: response.data.likes, dislikes: response.data.dislikes };
        } catch (error) {
            console.error("🔴 Error liking message:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to like message");
        }
    }
);

/* -------------------------------- Unlike Message in a Thread (Requires Auth) -------------------------------- */
export const unlikeMessage = createAsyncThunk(
    "threads/unlikeMessage",
    async (messageId, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/message/${messageId}/unlike`, {}, { withCredentials: true });
            return { messageId, likes: response.data.likes, dislikes: response.data.dislikes };
        } catch (error) {
            console.error("🔴 Error unliking message:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to unlike message");
        }
    }
);

/* -------------------------------- Delete Message in a Thread (Requires Auth) -------------------------------- */
export const deleteThreadMessage = createAsyncThunk(
    "threads/deleteMessage",
    async ({ threadId, messageId }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${BASE_URL}/message/${messageId}`, { withCredentials: true });
            return { threadId, messageId, deletedAt: new Date().toISOString() };
        } catch (error) {
            console.error("🔴 Error deleting message:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to delete message");
        }
    }
);

/* -------------------------------- Delete a Thread (Requires Auth) -------------------------------- */
export const deleteThread = createAsyncThunk(
    "threads/deleteThread",
    async (threadId, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${BASE_URL}/thread/${threadId}`, { withCredentials: true });

            return { threadId, message: response.data.message }; // ✅ Return thread ID and success message
        } catch (error) {
            console.error("🔴 Error deleting thread:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to delete thread");
        }
    }
);




/* -------------------------------- Fetch User'S Thread-------------------------------- */
export const fetchUserThreads = createAsyncThunk(
    'threads/fetchUserThreads',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${BASE_URL}/user`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error("🔴 Error fetching user threads:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch user threads");
        }
    }
);



  /* -------------------------------- update Thread-------------------------------- */
  export const updateThread = createAsyncThunk(
  'threads/updateThread',
  async ({ threadId, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/update/${threadId}`, // ✅ Note the updated route
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data;
    } catch (error) {
      console.error('🔴 Error updating thread:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update thread');
    }
  }
);


  


/* -------------------------------- Redux Slice -------------------------------- */
const threadSlice = createSlice({
    name: 'threads',
    initialState: {
        threads: [], // Stores all threads
        messages: {}, // Stores messages per thread (e.g., messages[threadId] = [...])
        userThreads: [],
        category: '',  // ✅ Category filter for fetching threads
        page: 1,       // ✅ Current page number
        limit: 10,     // ✅ Number of items per page
        totalPages: 0, // ✅ Total pages available
        totalItems: 0, // ✅ Total number of threads
        status: 'idle',
        error: null,
        selectedThread: null,
        replyingTo: null, // Message being replied to
        scrollToMessage: null, // Message ID to scroll to
    },
    reducers: {
        addNewThreadMessage: (state, action) => {
            const { threadId, message } = action.payload;
            if (!state.messages[threadId]) {
                state.messages[threadId] = [];
            }

            // ✅ **Prevent duplicate messages in Redux**
            const exists = state.messages[threadId].some(msg => msg._id === message._id);
            if (!exists) {
                state.messages[threadId].push(message);
            }
        },
        updateThreadFilter: (state, action) => {
            Object.assign(state, action.payload); // ✅ Update category, page, or limit
        },
        setReplyingTo: (state, action) => {
            state.replyingTo = action.payload;
        },
        clearReplyingTo: (state) => {
            state.replyingTo = null;
        },
        setScrollToMessage: (state, action) => {
            state.scrollToMessage = action.payload;
        },
        clearScrollToMessage: (state) => {
            state.scrollToMessage = null;
        },
        markMessageAsDeleted: (state, action) => {
            const { threadId, messageId } = action.payload;
            if (state.messages[threadId]) {
                const message = state.messages[threadId].find(msg => msg._id === messageId);
                if (message) {
                    message.deletedAt = new Date().toISOString();
                    
                    // Update all reply previews that reference this deleted message
                    state.messages[threadId].forEach((msg) => {
                        if (msg.replyTo && msg.replyTo._id === messageId) {
                            msg.replyTo.deletedAt = new Date().toISOString();
                        }
                    });
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder

            /* --------- Create Thread --------- */
            .addCase(createThread.fulfilled, (state, action) => {
                state.threads.push(action.payload); // ✅ Add new thread to state
                state.userThreads.push(action.payload);
            })

            /* --------- Fetch Threads --------- */
            .addCase(fetchThreads.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchThreads.fulfilled, (state, action) => {
                state.status = 'success';
                state.threads = action.payload.threads;
            
                // Ensure meta properties are always set
                const meta = action.payload.meta || {};
                state.totalItems = meta.totalItems || 0;
                state.totalPages = meta.totalPages || 1;
                state.page = meta.currentPage || 1;
            })
            .addCase(fetchThreads.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            /* --------- Fetch Thread Messages --------- */
            .addCase(fetchThreadMessages.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchThreadMessages.fulfilled, (state, action) => {
                const { threadId, messages } = action.payload;
                state.messages[threadId] = messages;
                state.status = 'success';
            })
            .addCase(fetchThreadMessages.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            /* --------- Send Thread Message --------- */
            .addCase(sendThreadMessage.fulfilled, (state, action) => {
                const { threadId, message } = action.payload;
                if (!state.messages[threadId]) {
                    state.messages[threadId] = [];
                }

                // ✅ **Ensure message isn't duplicated in Redux**
                const exists = state.messages[threadId].some(msg => msg._id === message._id);
                if (!exists) {
                    state.messages[threadId].push(message);
                }
            })

            /* --------- Like Message --------- */

            .addCase(likeMessage.fulfilled, (state, action) => {
                const { messageId, likes, dislikes } = action.payload;
                Object.keys(state.messages).forEach(threadId => {
                    const msgIndex = state.messages[threadId].findIndex(msg => msg._id === messageId);
                    if (msgIndex !== -1) {
                        state.messages[threadId][msgIndex].likes = likes;
                        state.messages[threadId][msgIndex].dislikes = dislikes;
                    }
                });
            })

            /* --------- Unlike Message --------- */

            .addCase(unlikeMessage.fulfilled, (state, action) => {
                const { messageId, likes, dislikes } = action.payload;
                Object.keys(state.messages).forEach(threadId => {
                    const msgIndex = state.messages[threadId].findIndex(msg => msg._id === messageId);
                    if (msgIndex !== -1) {
                        state.messages[threadId][msgIndex].likes = likes;
                        state.messages[threadId][msgIndex].dislikes = dislikes;
                    }
                });
            })

            /* --------- Delete Message --------- */
            .addCase(deleteThreadMessage.fulfilled, (state, action) => {
                const { threadId, messageId, deletedAt } = action.payload;
                if (state.messages[threadId]) {
                    const message = state.messages[threadId].find(msg => msg._id === messageId);
                    if (message) {
                        message.deletedAt = deletedAt;
                        
                        // Update all reply previews that reference this deleted message
                        state.messages[threadId].forEach((msg) => {
                            if (msg.replyTo && msg.replyTo._id === messageId) {
                                msg.replyTo.deletedAt = deletedAt;
                            }
                        });
                    }
                }
            })

            /* --------- Delete Thread --------- */
            .addCase(deleteThread.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(deleteThread.fulfilled, (state, action) => {
                const threadId = action.payload;

                // ✅ Remove the deleted thread from the state
                state.threads = state.threads.filter((thread) => thread._id !== threadId);

                // ✅ Remove the deleted thread from `userThreads`
                state.userThreads = state.userThreads.filter((thread) => thread._id !== threadId);

                // ✅ Remove all messages associated with this thread
                delete state.messages[threadId];

                state.status = "success";
            })
            .addCase(deleteThread.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })


            /* --------- fetchUserThreads --------- */
            .addCase(fetchUserThreads.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUserThreads.fulfilled, (state, { payload }) => {
                state.status = 'success';
                state.threads = payload;
            })
            .addCase(fetchUserThreads.rejected, (state, { payload }) => {
                state.status = 'failed';
                state.error = payload;
            })



            /* --------- updateThread--------- */
            .addCase(updateThread.fulfilled, (state, action) => {
                const updatedThread = action.payload;
                state.selectedThread = updatedThread;
        
                const index = state.threads.findIndex(t => t._id === updatedThread._id);
                if (index !== -1) state.threads[index] = updatedThread;
        
                const userIndex = state.userThreads.findIndex(t => t._id === updatedThread._id);
                if (userIndex !== -1) state.userThreads[userIndex] = updatedThread;
        
                state.status = 'success';
              })
              .addCase(updateThread.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
              })
              

            /* --------- Fetch Threads by Category --------- */
            .addCase(fetchThreadsByCategory.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchThreadsByCategory.fulfilled, (state, action) => {
                state.status = 'success';
                state.threads = action.payload.threads;
                state.totalItems = action.payload.meta.totalItems;
                state.totalPages = action.payload.meta.totalPages;
            })
            .addCase(fetchThreadsByCategory.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            /* --------- Fetch Threads by ID --------- */
            .addCase(fetchThreadById.pending, (state) => {
                state.status = 'loading';
              })
              .addCase(fetchThreadById.fulfilled, (state, action) => {
                state.status = 'success';
                state.selectedThread = action.payload;
              })
              .addCase(fetchThreadById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
              });


    },
});

/* -------------------------------- Exports -------------------------------- */
export const { 
    addNewThreadMessage, 
    updateThreadFilter,
    setReplyingTo,
    clearReplyingTo,
    setScrollToMessage,
    clearScrollToMessage,
    markMessageAsDeleted
} = threadSlice.actions;
export default threadSlice.reducer;
