// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import advertReducer from './slices/adverts/advertSlice';
import userReducer from './slices/users/userSlice';
import userAdvertReducer from './slices/adverts/userAdvertsSlice';
import messages from './slices/shared/messageSlice';
import searchAdvertsReducer from './slices/adverts/searchAdvertsSlice';
import searchEventsReducer from './slices/events/searchEventsSlice';
import freeEventReducer from './slices/events/freeEventSlice';
import threadReducer from './slices/threads/threadSlice';
import searchThreadsReducer from './slices/threads/searchThreadsSlice';
import adminReducer from './slices/admin/users/adminSlice';
import eventReducer from './slices/events/eventSlice';
import supportReducer from './slices/supportSlice';
import refundReducer from './slices/events/refundSlice';
import eventCapacityReducer from './slices/events/eventCapacitySlice';
import checkInFreeReducer from './slices/events/checkInFreeSlice';
import checkInPaidReducer from './slices/events/checkInPaidSlice';
import searchCouponsReducer from './slices/coupons/searchCouponsSlice';
import searchDealsReducer from './slices/dailydeals/searchDealsSlice';
import dealReducer from './slices/dailydeals/dealSlice';

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
        searchEvents: searchEventsReducer,
        freeEvents: freeEventReducer,
        searchThreads: searchThreadsReducer,
        support: supportReducer,
        refunds: refundReducer,
        eventCapacity: eventCapacityReducer,
        checkInFree: checkInFreeReducer,
        checkInPaid: checkInPaidReducer,
        searchCoupons: searchCouponsReducer,
        searchDeals: searchDealsReducer,
        deal: dealReducer,
    },
});

export default store;