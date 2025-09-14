'use client';

import { Provider } from 'react-redux';
import store from './store';
import ValidateToken from '@/components/ValidateToken'; // ✅ Moved here
import ValidateAdminToken from '@/components/ValidateAdminToken'; // ✅ Admin token validation

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ValidateToken /> {/* ✅ Runs once when app initializes */}
      <ValidateAdminToken /> {/* ✅ Validates admin token on app load */}
      {children}
    </Provider>
  );
}
