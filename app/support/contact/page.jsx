'use client';

import React, { Suspense } from 'react';
import ContactForm from '@/components/support/ContactForm';

const ContactPage = () => {
  return (
    <Suspense fallback={<div>Loading registration form...</div>}>
      <ContactForm />
    </Suspense>
  );
};

export default ContactPage;
