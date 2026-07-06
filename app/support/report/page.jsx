'use client';

import React, { Suspense } from 'react';
import ReportForm from '@/components/support/ReportForm';

const ReportPage = () => {
  return (
    <Suspense fallback={<div>Loading report form...</div>}>
      <ReportForm />
    </Suspense>
  );
};

export default ReportPage;
