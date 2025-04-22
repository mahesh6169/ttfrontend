'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateToken } from '@/store/slices/users/userSlice';

const ValidateToken = () => {
  const dispatch = useDispatch();
  const tokenValidated = useSelector((state) => state.user.tokenValidated); // Only track token validation state

  useEffect(() => {
    // Only dispatch validateToken if token hasn't been validated yet
    if (!tokenValidated) {
      console.log('🔄 Dispatching validateToken...');
      dispatch(validateToken())
        .unwrap()
        .then(() => console.log('✅ Token validated successfully'))
        .catch((error) => console.log('❌ Token validation failed:', error));
    }
  }, [dispatch, tokenValidated]);

  return null;
};

export default ValidateToken;
