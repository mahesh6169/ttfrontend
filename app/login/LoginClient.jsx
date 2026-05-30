'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const LoginForm = dynamic(() => import('@/components/users/LoginForm'), {
  ssr: false,
});

const LoginClient = () => {
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginClient;
