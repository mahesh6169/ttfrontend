// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import advertReducer from './slices/advertSlice';
import userReducer from './slices/userSlice';
import userAdvertReducer from './slices/userAdvertsSlice'; // Import userAdvertReducer
import messages from './slices/messageSlice'; // Import messageSlice
import filterReducer from './slices/filterSlice'; // Import filterSlice
import threadReducer from './slices/threadSlice'; // Import threadSlice
import adminReducer from './slices/adminSlice'; // Import adminSlice

const store = configureStore({
    reducer: {
        advert: advertReducer,
        user: userReducer,
        userAdverts: userAdvertReducer, // Add userAdvertReducer.
        messages: messages, // Add messages
        filters: filterReducer, // Add filterReducer
        threads: threadReducer, // Add threadReducer
        admin: adminReducer, // Add adminReducer
    },
});

export default store;
