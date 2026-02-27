'use client';

import React, { Suspense } from 'react';
import RemovalForm from '@/components/support/RemovalForm';

const RemovalPage = () => {
  return (
    <Suspense fallback={<div>Loading removal form...</div>}>
      <RemovalForm />
    </Suspense>
  );
};

export default RemovalPage;
