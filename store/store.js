// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import advertReducer from './slices/adverts/advertSlice';
import userReducer from './slices/users/userSlice';
import userAdvertReducer from './slices/adverts/userAdvertsSlice';
import messages from './slices/shared/messageSlice';
import searchAdvertsReducer from './slices/adverts/searchAdvertsSlice';
import searchEventsReducer from './slices/events/searchEventsSlice';
import freeEventReducer from './slices/events/freeEventSlice';
import filterEventReducer from './slices/events/filterEventSlice';
import threadReducer from './slices/threads/threadSlice';
import searchThreadsReducer from './slices/threads/searchThreadsSlice';
import adminReducer from './slices/admin/users/adminSlice';
import eventReducer from './slices/events/eventSlice';
import seatSelectionReducer from './slices/events/seatSelectionSlice';
import ticketPurchaseReducer from './slices/events/ticketPurchaseSlice';
import filterThreadReducer from './slices/threads/filterThreadSlice';
import supportReducer from './slices/supportSlice';
import refundReducer from './slices/events/refundSlice';
import eventCapacityReducer from './slices/events/eventCapacitySlice';
import checkInFreeReducer from './slices/events/checkInFreeSlice';

const store = configureStore({
    reducer: {
        advert: advertReducer,
        user: userReducer,
        userAdverts: userAdvertReducer,
        messages: messages,
        searchAdverts: searchAdvertsReducer,
        threads: threadReducer,
        admin: adminReducer,
        events: eventReducer,
        eventFilters: filterEventReducer,
        searchEvents: searchEventsReducer,
        seatSelection: seatSelectionReducer,
        ticketPurchase: ticketPurchaseReducer,
        freeEvents: freeEventReducer,
        filterThreads: filterThreadReducer,
        searchThreads: searchThreadsReducer,
        support: supportReducer,
        refunds: refundReducer,
        eventCapacity: eventCapacityReducer,
        checkInFree: checkInFreeReducer,
    },
});

export default store;