// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import advertReducer from './slices/adverts/advertSlice';
import userReducer from './slices/users/userSlice';
import userAdvertReducer from './slices/adverts/userAdvertsSlice'; // Import userAdvertReducer
import messages from './slices/shared/messageSlice'; // Import messageSlice
import filterReducer from './slices/adverts/filterSlice'; // Import filterSlice
import filterEventReducer from './slices/events/filterEventSlice'; // Import filterEventSlice
import threadReducer from './slices/threads/threadSlice'; // Import threadSlice
import adminReducer from './slices/admin/users/adminSlice'; // Import adminSlice
import eventReducer from './slices/events/eventSlice'; // Import eventSlice
import filterThreadReducer from './slices/threads/filterThreadSlice'; // Import filterThreadSlice
import adminManageAdvertReducer from './slices/admin/adverts/adminManageAdvertSlice'; // Import adminManageAdvertSlice
import adminManageEventReducer from './slices/admin/events/adminManageEventSlice'; // Import adminManageEventSlice
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
