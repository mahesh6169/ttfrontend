'use client';

import React, { Suspense } from 'react';
import RemovalForm from '@/components/support/RemovalForm';
import Footer from '@/components/Footer';

const RemovalPage = () => {
  return (
    <>
      <Suspense fallback={<div>Loading removal form...</div>}>
        <RemovalForm />
      </Suspense>
      <Footer />
    </>
  );
};

export default RemovalPage;
