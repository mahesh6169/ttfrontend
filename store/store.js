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
import adminManageAdvertReducer from './slices/adminManageAdvertSlice'; // Import adminManageAdvertSlice
import adminManageEventReducer from './slices/adminManageEventSlice'; // Import adminManageEventSlice
import supportReducer from './slices/supportSlice'; // Import supportSlice
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
        adminManageAdvert: adminManageAdvertReducer, // Add adminManageAdvertReducer
        adminManageEvent: adminManageEventReducer, // Add adminManageEventReducer
        support: supportReducer, // Add supportReducer
    },
});

export default store;
