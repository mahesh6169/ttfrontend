'use client';

import { Provider } from 'react-redux';
import store from './store';
import ValidateToken from '@/components/ValidateToken'; // ✅ Moved here
import ValidateAdmin from '@/components/admin/ValidateAdmin'; // ✅ Admin validation

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ValidateToken /> {/* ✅ Runs once when app initializes */}
      <ValidateAdmin /> {/* ✅ Validates admin session */}
      {children}
    </Provider>
  );
}
