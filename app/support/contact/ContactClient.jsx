'use client';

import React, { Suspense } from 'react';
import ContactForm from '@/components/support/ContactForm';

const ContactClient = () => {
  return (
    <Suspense fallback={<div>Loading contact form...</div>}>
      <ContactForm />
    </Suspense>
  );
};

export default ContactClient;
