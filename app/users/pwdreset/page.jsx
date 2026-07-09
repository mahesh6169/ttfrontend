'use client';

import React, { useEffect, useState } from 'react';
import ResetPasswordContent from '@/components/users/Pwdreset';
import BaseContentShell from '@/components/layout/BaseContentShell';
import Footer from '@/components/Footer';



const ResetPasswordPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="container mx-auto">
      <BaseContentShell>
        <ResetPasswordContent />
      </BaseContentShell>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
