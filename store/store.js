// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import advertReducer from './slices/advertSlice';
import userReducer from './slices/userSlice';
import userAdvertReducer from './slices/userAdvertsSlice'; // Import userAdvertReducer
import messages from './slices/messageSlice'; // Import messageSlice
import filterReducer from './slices/filterSlice'; // Import filterSlice
import filterEventReducer from './slices/filterEventSlice'; // Import filterEventSlice
import threadReducer from './slices/threadSlice'; // Import threadSlice
import adminReducer from './slices/adminSlice'; // Import adminSlice
import eventReducer from './slices/eventSlice'; // Import eventSlice
import filterThreadReducer from './slices/filterThreadSlice'; // Import filterThreadSlice
import events from '@/app/events/page';

const store = configureStore({
    reducer: {
        advert: advertReducer,
        user: userReducer,
        userAdverts: userAdvertReducer, // Add userAdvertReducer.
        messages: messages, // Add messages
        filters: filterReducer, // Add filterReducer
        threads: threadReducer, // Add threadReducer
        admin: adminReducer, // Add adminReducer
        events: eventReducer, // Add eventReducer
        eventFilters: filterEventReducer, // Add filterEventReducer
        filterThreads: filterThreadReducer, // Add filterThreadsReducer
    },
});

export default store;
