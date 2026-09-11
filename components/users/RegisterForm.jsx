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
import { FaEye, FaEyeSlash } from 'react-icons/fa';
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
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [suburbValidationError, setSuburbValidationError] = useState('');
  
  // Password validation checks
  const getPasswordStrength = () => {
    const checks = {
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
    };
    return checks;
  };

  const honeypotRef = useRef(null);
  const recaptchaRef = useRef(null);
  
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error: reduxError } = useSelector((state) => state.user);
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

    console.log('🔍 Selected place:', place.formatted_address); // ADD THIS
    console.log('🔍 Address components:', addressComponents);    // ADD THIS

    // Validate against generic locations
    const formattedAddressLower = (place.formatted_address || '').toLowerCase().trim();
    const genericLocations = ['australia', 'aus', 'au'];
    
    // Check for country-only entries
    if (genericLocations.includes(formattedAddressLower)) {
      setSuburbValidationError('Please select a specific suburb.');
      // Clear the form data
      setFormData((prev) => ({
        ...prev,
        suburb: {
          name: '',
          state: '',
          postalCode: '',
          location: {
            type: 'Point',
            coordinates: [],
          },
        },
      }));
      return;
    }
    
    // Check for state-only entries
    const stateOnlyPatterns = [
      'western australia, australia', 'wa, australia',
      'new south wales, australia', 'nsw, australia',
      'victoria, australia', 'vic, australia',
      'queensland, australia', 'qld, australia',
      'tasmania, australia', 'tas, australia',
      'northern territory, australia', 'nt, australia',
      'south australia, australia', 'sa, australia',
      'australian capital territory, australia', 'act, australia'
    ];
    
    if (stateOnlyPatterns.includes(formattedAddressLower)) {
      setSuburbValidationError('Please select a specific suburb, not just the state.');
      // Clear the form data
      setFormData((prev) => ({
        ...prev,
        suburb: {
          name: '',
          state: '',
          postalCode: '',
          location: {
            type: 'Point',
            coordinates: [],
          },
        },
      }));
      return;
    }

    // Clear any previous validation error
    setSuburbValidationError('');

    let suburb = '';
    let state = '';
    let postalCode = '';
    let coordinates = [];

    addressComponents.forEach((component) => {
      const types = component.types;
      // 🇦🇺 Try multiple suburb types for Australian locations
    if (!suburb) {
      if (types.includes('locality')) {
        suburb = component.long_name;
      } else if (types.includes('sublocality_level_1')) {
        suburb = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        suburb = component.long_name;
      } else if (types.includes('postal_town')) {
        suburb = component.long_name;
      }
    }
    
    if (types.includes('administrative_area_level_1'))
      state = component.short_name;
    if (types.includes('postal_code')) postalCode = component.long_name;
    });

    // Fallback: Extract from formatted address if no suburb found
  if (!suburb && place.formatted_address) {
    suburb = place.formatted_address.split(',')[0].trim();
  }

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      coordinates = [lng, lat];
    }

    console.log('✅ Final result:', { suburb, state, postalCode, coordinates });

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
  
    // Check reCAPTCHA on every submission
    if (!captchaToken || tokenAge > 110000) {
      toast.error('Please complete the reCAPTCHA verification');
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
      
      // Show error as toast
      toast.error(errorMessage);
      
      // Clear any previous message
      setMessage('');
      
      // Reset reCAPTCHA properly - both the token and the visual widget
      setCaptchaToken(null);
      setCaptchaTokenTime(null);
      
      // Reset the visual ReCAPTCHA widget so it doesn't show as checked
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <>
      {/* Page title — centered (forms.md §2, matches Contact) */}
      <div className="text-center mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">Register</h1>
      </div>

      <div className="mx-auto max-w-[300px]">

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
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                errors.name ? 'border-red-500' : 'border-slate-300'
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
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                errors.email ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Enter your email"
              maxLength={100} // Prevent excessive input
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>
          
          {/* Password Field - Required */}
          <div>
            <label htmlFor="password" className="block font-medium">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordHint(true)}
                onBlur={() => setShowPasswordHint(false)}
                className={`w-full px-3 py-1.5 pr-10 text-sm border rounded ${
                  errors.password ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            {showPasswordHint && formData.password && (
              <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                {(() => {
                  const checks = getPasswordStrength();
                  const allValid = Object.values(checks).every(Boolean);
                  return (
                    <div className="space-y-0.5">
                      <div className={`flex items-center ${checks.length ? 'text-green-600' : 'text-slate-500'}`}>
                        <span className="mr-1">{checks.length ? '✓' : '○'}</span>
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center ${checks.uppercase ? 'text-green-600' : 'text-slate-500'}`}>
                        <span className="mr-1">{checks.uppercase ? '✓' : '○'}</span>
                        <span>One uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center ${checks.lowercase ? 'text-green-600' : 'text-slate-500'}`}>
                        <span className="mr-1">{checks.lowercase ? '✓' : '○'}</span>
                        <span>One lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center ${checks.number ? 'text-green-600' : 'text-slate-500'}`}>
                        <span className="mr-1">{checks.number ? '✓' : '○'}</span>
                        <span>One number (0-9)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          
          {/* Confirm Password Field - Required */}
          <div>
            <label htmlFor="confirmPassword" className="block font-medium">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setShowPasswordHint(true)}
                onBlur={() => setShowPasswordHint(false)}
                className={`w-full px-3 py-1.5 pr-10 text-sm border rounded ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
            {/* Real-time password match indicator */}
            {formData.confirmPassword && formData.password && (
              <div className="mt-1">
                {formData.password === formData.confirmPassword ? (
                  <p className="text-green-600 text-xs flex items-center">
                    <span className="mr-1">✓</span>
                    <span>Passwords match</span>
                  </p>
                ) : (
                  <p className="text-red-500 text-xs flex items-center">
                    <span className="mr-1">✗</span>
                    <span>Passwords do not match</span>
                  </p>
                )}
              </div>
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
                  types: ['geocode'],
                }}
              >
                <input
                  type="text"
                  placeholder="Enter your suburb"
                  className={`w-full px-3 py-1.5 text-sm border rounded ${
                    errors.suburb || suburbValidationError ? 'border-red-500' : 'border-slate-300'
                  }`}
                  onChange={(e) => {
                    // Clear validation error when user starts typing
                    if (suburbValidationError) {
                      setSuburbValidationError('');
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.toLowerCase().trim();
                    const genericLocations = ['australia', 'aus', 'au'];
                    
                    if (genericLocations.includes(value)) {
                      setSuburbValidationError('Please enter a specific suburb.');
                      return;
                    }
                    
                    // Check for state-only entries (with or without ", australia")
                    const states = [
                      'western australia', 'wa',
                      'new south wales', 'nsw',
                      'victoria', 'vic',
                      'queensland', 'qld',
                      'tasmania', 'tas',
                      'northern territory', 'nt',
                      'south australia', 'sa',
                      'australian capital territory', 'act'
                    ];
                    
                    // Check if it's just a state (with optional ", australia" suffix)
                    const valueWithoutAustralia = value.replace(/, australia$/, '').trim();
                    if (states.includes(valueWithoutAustralia)) {
                      setSuburbValidationError('Please enter a specific suburb, not just the state.');
                    }
                  }}
                />
              </Autocomplete>
            </LoadScriptNext>
            {errors.suburb && (
              <p className="text-red-500 text-sm mt-1">{errors.suburb}</p>
            )}
            {suburbValidationError && !errors.suburb && (
              <p className="text-red-500 text-sm mt-1">{suburbValidationError}</p>
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
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                errors.mobile ? 'border-red-500' : 'border-slate-300'
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
            <label htmlFor="marketingOptIn" className="text-sm text-slate-700">
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
            <label htmlFor="acceptTerms" className="text-sm text-slate-700">
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
            ref={recaptchaRef}
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
            className="mx-auto block bg-teal-700 text-white hover:bg-teal-800 rounded-full px-10 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>


        <div className="mt-6 text-center">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-teal-700 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;