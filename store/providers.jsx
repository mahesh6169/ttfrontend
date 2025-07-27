'use client';

import { Provider } from 'react-redux';
import store from './store';
import ValidateToken from '@/components/ValidateToken'; // ✅ Moved here

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ValidateToken /> {/* ✅ Runs once when app initializes */}
      {children}
    </Provider>
  );
}
