'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const AdminLoginForm = dynamic(() => import('@/components/admin/AdminLoginForm'), {
  ssr: false,
});

const AdminLoginPage = () => {
  return (
    <Suspense fallback={<div>Loading admin login...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
};

export default AdminLoginPage;
