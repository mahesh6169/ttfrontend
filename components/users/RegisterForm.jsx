'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, sendVerifyOtp } from '@/store/slices/users/userSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CURRENT_TERMS_VERSION } from '@/constants/terms';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  sanitizeInput,
  validateAuthForm,
} from '@/utils/forms/validation';
import { isHoneypotTriggered, isFormSubmittedTooQuickly } from '@/utils/forms/antiBot';


const libraries = ['places'];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    suburb: {
      name: '',
      state: '',
      postalCode: '',
      location: {
        type: 'Point',
        coordinates: [],
      },
    },
    marketingOptIn: false,
    acceptTerms: false,
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaTokenTime, setCaptchaTokenTime] = useState(null);

  const honeypotRef = useRef(null);
  
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading } = useSelector((state) => state.user);
  const searchParams = useSearchParams();
  const preserveRedirect = searchParams.get('preserveRedirect') === 'true';


  // Set form load time when component mounts (for bot detection)
  useEffect(() => {
    setFormLoadTime(Date.now());
  }, []);

  useEffect(() => {
    if (!preserveRedirect) {
      localStorage.removeItem('redirectAfterLogin');
    }
  }, [preserveRedirect]);

 
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Sanitize input to prevent XSS
    const sanitizedValue = type === 'checkbox' ? checked : sanitizeInput(value);

    setFormData({
      ...formData,
      [name]: sanitizedValue,
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const addressComponents = place.address_components || [];

    let suburb = '';
    let state = '';
    let postalCode = '';
    let coordinates = [];

    addressComponents.forEach((component) => {
      const types = component.types;
      if (types.includes('locality')) suburb = component.long_name;
      if (types.includes('administrative_area_level_1'))
        state = component.short_name;
      if (types.includes('postal_code')) postalCode = component.long_name;
    });

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      coordinates = [lng, lat];
    }

    setFormData((prev) => ({
      ...prev,
      suburb: {
        name: suburb,
        state,
        postalCode,
        location: {
          type: 'Point',
          coordinates,
        },
      },
    }));

    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: '' }));
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // 🚫 Prevent duplicate submissions
  
    setIsSubmitting(true);
    setMessage('');
  
    const honeypotValue = honeypotRef.current?.value || '';
    const timeElapsed = Date.now() - formLoadTime;
  
    if (isHoneypotTriggered(honeypotValue)) {
      console.log('🛑 Bot blocked by honeypot');
      toast.success('Processing your registration...');
      setTimeout(() => {
        toast.error('Registration failed. Please try again later.');
        setIsSubmitting(false);
      }, 2000);
      return;
    }
  
    if (isFormSubmittedTooQuickly(formLoadTime, 2000)) {
      console.log('🛑 Bot blocked by timing check');
      setTimeout(() => {
        toast.error('An error occurred. Please try again later.');
        setIsSubmitting(false);
      }, 2000);
      return;
    }
  
    const newErrors = validateAuthForm(formData, 'register');
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
  
    const now = Date.now();
    const tokenAge = now - (captchaTokenTime || 0);
  
    if (!captchaToken || tokenAge > 110000) {
      toast.error('reCAPTCHA expired or missing. Please complete it again.');
      setCaptchaToken(null);
      setIsSubmitting(false);
      return;
    }
  
    try {
      formData.acceptedTermsVersion = CURRENT_TERMS_VERSION;
      formData.acceptedTermsAt = new Date().toISOString();
  
      const payload = {
        ...formData,
        captchaToken,
        formMetrics: {
          timeElapsed,
          formLoadTime
        }
      };
  
      const result = await dispatch(registerUser(payload)).unwrap();
      if (result) {
        toast.success('Registration successful. Sending OTP...');
      
        await new Promise((resolve) => setTimeout(resolve, 500)); // ⏳ Small delay before sending OTP
      
        const otpResult = await dispatch(sendVerifyOtp()).unwrap();
        if (otpResult) {
          toast.success('OTP sent successfully. Redirecting...');
      
          await new Promise((resolve) => setTimeout(resolve, 800)); // ⏳ Delay before redirecting
      
          // For direct registration, default to profile page
          // For registration from protected page, preserve the redirect
          const storedRedirect = localStorage.getItem('redirectAfterLogin');
          const redirect = (preserveRedirect && storedRedirect) ? storedRedirect : '/users/profile';
          
          // Ensure the redirect is saved for email verify page
          localStorage.setItem('redirectAfterLogin', redirect);
          router.push('/users/emailverify');
        }
      }
      
    } catch (err) {
      const errorMessage =
    err?.response?.data?.message || // Axios-style error
    err?.message ||                 // JS error object
    err ||                          // rejectWithValue string
    'An unexpected error occurred.';
  setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="flex my-4 w-full justify-center">
      <div className="p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>
        
        {/* Honeypot field - hidden from real users, but bots will fill it */}
        <input
          type="text"
          name="website"
          ref={honeypotRef}
          tabIndex="-1"
          aria-hidden="true"
          style={{ 
            position: 'absolute',
            opacity: 0,
            height: '0',
            width: '0',
            zIndex: -1
          }}
        />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field - Required */}
          <div>
            <label htmlFor="name" className="block font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your name"
              maxLength={50} // Prevent excessive input
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          {/* Email Field - Required */}
          <div>
            <label htmlFor="email" className="block font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              maxLength={100} // Prevent excessive input
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          
          {/* Password Field - Required */}
          <div>
            <label htmlFor="password" className="block font-medium">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          
          {/* Confirm Password Field - Required */}
          <div>
            <label htmlFor="confirmPassword" className="block font-medium">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
          
          
          {/* Suburb Field - Optional */}
          <div>
            <label className="block font-medium">
              Suburb <span className="text-red-500">*</span>
            </label>
            <LoadScriptNext
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              libraries={libraries}
            >
              <Autocomplete
                onLoad={(auto) => setAutocomplete(auto)}
                onPlaceChanged={handlePlaceChanged}
                options={{
                  componentRestrictions: { country: 'AU' }, // Restrict to Australia
                  types: ['(regions)'],
                }}
              >
                <input
                  type="text"
                  placeholder="Enter your suburb"
                  className={`w-full p-2 border rounded ${
                    errors.suburb ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </Autocomplete>
            </LoadScriptNext>
            {errors.suburb && (
              <p className="text-red-500 text-sm mt-1">{errors.suburb}</p>
            )}
          </div>

          {/* Mobile Field - Optional */}
          <div>
            <label htmlFor="mobile" className="block font-medium">
              Mobile (Optional)
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.mobile ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(e.g., 0412 345 678)"
              maxLength={15} // Prevent excessive input
            />
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>


          {/* Marketing Opt-in - Optional */}
          <div className="flex items-center">
            <input
              id="marketingOptIn"
              name="marketingOptIn"
              type="checkbox"
              checked={formData.marketingOptIn}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="marketingOptIn" className="text-sm text-gray-700">
              I agree to receive updates and offers (Optional)
            </label>
          </div>
          
          {/* Terms & Conditions - Required */}
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-1"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700">
              I agree to the{' '}
              <Link
                href="/support/terms"
                target="_blank"
                className="text-teal-700 underline"
              >
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link
                href="/support/privacy"
                target="_blank"
                className="text-teal-700 underline"
              >
                Privacy Policy
              </Link>
              <span className="text-red-500">*</span>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-500 text-sm mt-1">{errors.acceptTerms}</p>
          )}

          {/* ReCAPTCHA */}
          <ReCAPTCHA
  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
  onChange={(token) => {
    setCaptchaToken(token);
    setCaptchaTokenTime(Date.now());
  }}
  onExpired={() => {
    setCaptchaToken(null);
    setCaptchaTokenTime(null);
  }}
/>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100  py-2 transition"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}

        <div className="mt-6 text-center">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-teal-700 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;