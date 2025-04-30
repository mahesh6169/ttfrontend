'use client';

import React, { useEffect, useState } from 'react';
import ResetPasswordContent from '@/components/users/Pwdreset';



const ResetPasswordPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <ResetPasswordContent />;
};

export default ResetPasswordPage;
