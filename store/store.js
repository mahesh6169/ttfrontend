// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import advertReducer from './slices/adverts/advertSlice';
import userReducer from './slices/users/userSlice';
import userAdvertReducer from './slices/adverts/userAdvertsSlice'; // Import userAdvertReducer
import messages from './slices/shared/messageSlice'; // Import messageSlice
import searchAdvertsReducer from './slices/adverts/searchAdvertsSlice';
import searchEventsReducer from './slices/events/searchEventsSlice'; // Import searchEventsSlice
import freeEventReducer from './slices/events/freeEventSlice';
import filterEventReducer from './slices/events/filterEventSlice'; // Import filterEventSlice
import threadReducer from './slices/threads/threadSlice'; // Import threadSlice
import searchThreadsReducer from './slices/threads/searchThreadsSlice'; // Import searchThreadsSlice
import adminReducer from './slices/admin/users/adminSlice'; // Import adminSlice
import eventReducer from './slices/events/eventSlice'; // Import eventSlice
import seatSelectionReducer from './slices/events/seatSelectionSlice'; // Import seatSelectionSlice
import filterThreadReducer from './slices/threads/filterThreadSlice'; // Import filterThreadSlice
import adminManageAdvertReducer from './slices/admin/adverts/adminManageAdvertSlice'; // Import adminManageAdvertSlice
import adminManageEventReducer from './slices/admin/events/adminManageEventSlice'; // Import adminManageEventSlice
import supportReducer from './slices/supportSlice'; // Import supportSlice



const store = configureStore({
    reducer: {
        advert: advertReducer,
        user: userReducer,
        userAdverts: userAdvertReducer, // Add userAdvertReducer..
        messages: messages, // Add messages
        searchAdverts: searchAdvertsReducer, // Add searchAdvertsReducer
        threads: threadReducer, // Add threadReducer
        admin: adminReducer, // Add adminReducer
        events: eventReducer, // Add eventReducer
        eventFilters: filterEventReducer, // Add filterEventReducer
        searchEvents: searchEventsReducer, // Add searchEventsReducer
        seatSelection: seatSelectionReducer, // Add seatSelectionReducer
        freeEvents: freeEventReducer, // Add freeEventReducer
        filterThreads: filterThreadReducer, // Add filterThreadsReducer
        searchThreads: searchThreadsReducer, // Add searchThreadsReducer
        adminManageAdvert: adminManageAdvertReducer, // Add adminManageAdvertReducer
        adminManageEvent: adminManageEventReducer, // Add adminManageEventReducer
        support: supportReducer, // Add supportReducer
    },
});

export default store;
