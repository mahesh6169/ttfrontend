// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import advertReducer from './slices/adverts/advertSlice';
import userReducer from './slices/users/userSlice';
import userAdvertReducer from './slices/adverts/userAdvertsSlice';
import messages from './slices/shared/messageSlice';

import freeEventReducer from './slices/events/freeEventSlice';
import threadReducer from './slices/threads/threadSlice';
import adminReducer from './slices/admin/users/adminSlice';
import eventReducer from './slices/events/eventSlice';
import supportReducer from './slices/supportSlice';
import refundReducer from './slices/events/refundSlice';
import eventCapacityReducer from './slices/events/eventCapacitySlice';
import checkInFreeReducer from './slices/events/checkInFreeSlice';
import checkinRsvpReducer from './slices/events/checkinRsvpSlice';
import checkInPaidReducer from './slices/events/checkInPaidSlice';
import searchCouponsReducer from './slices/coupons/searchCouponsSlice';
import dealReducer from './slices/dailydeals/dealSlice';

const store = configureStore({
    reducer: {
        advert: advertReducer,
        user: userReducer,
        userAdverts: userAdvertReducer,
        messages: messages,

        threads: threadReducer,
        admin: adminReducer,
        events: eventReducer,
        freeEvents: freeEventReducer,
        support: supportReducer,
        refunds: refundReducer,
        eventCapacity: eventCapacityReducer,
        checkInFree: checkInFreeReducer,
        checkinRsvp: checkinRsvpReducer,
        checkInPaid: checkInPaidReducer,
        searchCoupons: searchCouponsReducer,
        deal: dealReducer,
    },
});

export default store;