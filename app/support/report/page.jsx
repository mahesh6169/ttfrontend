'use client';

import React, { Suspense } from 'react';
import ReportForm from '@/components/support/ReportForm';
import Footer from '@/components/Footer';

const ReportPage = () => {
  return (
    <>
      <Suspense fallback={<div>Loading report form...</div>}>
        <ReportForm />
      </Suspense>
      <Footer />
    </>
  );
};

export default ReportPage;
