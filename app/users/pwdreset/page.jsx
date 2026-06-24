'use client';

import React, { useEffect, useState } from 'react';
import ResetPasswordContent from '@/components/users/Pwdreset';
import BaseContentShell from '@/components/layout/BaseContentShell';



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
    </div>
  );
};

export default ResetPasswordPage;
