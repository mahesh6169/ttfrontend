'use client';

import React, { Suspense } from 'react';
import RegisterForm from '@/components/users/RegisterForm';

const RegisterPage = () => {
  return (
    <Suspense fallback={<div>Loading registration form...</div>}>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;
