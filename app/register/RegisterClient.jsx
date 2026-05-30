'use client';

import React, { Suspense } from 'react';
import RegisterForm from '@/components/users/RegisterForm';

const RegisterClient = () => {
  return (
    <Suspense fallback={<div>Loading registration form...</div>}>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterClient;
