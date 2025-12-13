import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useApp } from '../../context/AppContext';
import { api, tokenManager } from '../../utils/api';

const DEFAULT_APPLY_FORM = {
  fullName: '',
  email: '',
  password: ''
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthenticated, setUser } = useApp();

  const sanitizeInput = (value, type = 'text') => {
    if (typeof value !== 'string') return '';
    let sanitized = value.replace(/[\r\n]/g, ' ').replace(/<|>/g, '');
    if (type === 'email') {
      sanitized = sanitized.replace(/\s/g, '');
    }
    return sanitized;
  };

  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [applyForm, setApplyForm] = useState(DEFAULT_APPLY_FORM);
  const [loading, setLoading] = useState({ login: false, apply: false });
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');

  // Read referral code from URL params and fetch referrer info
  useEffect(() => {
    const code = searchParams.get('referralCode');
    if (code) {
      const trimmedCode = code.trim().toUpperCase();
      setReferralCode(trimmedCode);
      // Switch to apply mode if referral code is present
      setMode('apply');

      // Fetch referrer information
      const fetchReferrerInfo = async () => {
        try {
          const response = await fetch(`/api/auth/referrer-info?referralCode=${encodeURIComponent(trimmedCode)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.referrer) {
              setReferrerName(data.data.referrer.fullName);
            }
          }
        } catch (error) {
          console.error('Error fetching referrer info:', error);
          // If error, just show the code without name
        }
      };

      fetchReferrerInfo();
    }
  }, [searchParams]);

  const toggleMode = (nextMode) => {
    setMode(nextMode);
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: sanitizeInput(value, name === 'email' ? 'email' : 'text')
    }));
  };

  const handleApplyChange = (event) => {
    const { name, value } = event.target;
    setApplyForm((prev) => ({
      ...prev,
      [name]: sanitizeInput(value, name === 'email' ? 'email' : 'text')
    }));
  };

  const showStatusAlert = (status, message) => {
    const alerts = {
      pending: {
        title: 'Application Under Review',
        text: message || 'Your application is being reviewed. We will notify you once a decision is made.',
        icon: 'info'
      },
      rejected: {
        title: 'Application Rejected',
        text: message || 'Unfortunately your application was rejected. Please contact support for further details.',
        icon: 'error'
      },
      banned: {
        title: 'Account Banned',
        text: message || 'Your account has been banned. Please contact support for assistance.',
        icon: 'error'
      },
      not_found: {
        title: 'Application Required',
        text: message || 'No IB application found for this account. Please apply to become a partner first.',
        icon: 'warning'
      }
    };

    const config = alerts[status] || {
      title: 'Login Failed',
      text: message || 'Unable to complete login. Please try again.',
      icon: 'error'
    };

    Swal.fire({
      ...config,
      confirmButtonColor: '#6242a5'
    });
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading((prev) => ({ ...prev, login: true }));

    try {
      const response = await api.auth.login({
        email: loginForm.email.trim(),
        password: loginForm.password
      });

      const { data, message } = response;
      if (data?.token) {
        tokenManager.setToken(data.token);
      }

      const fullName = data?.request?.fullName || data?.request?.email;

      setUser({
        id: data?.request?.id,
        name: fullName,
        email: data?.request?.email,
        role: data?.request?.ibType,
        isAuthenticated: true
      });
      setAuthenticated(true);

      Swal.fire({
        title: 'Welcome Back',
        text: message || 'Login successful.',
        icon: 'success',
        confirmButtonColor: '#6242a5'
      }).then(() => {
        navigate('/');
      });
    } catch (error) {
      const status = error.body?.requestStatus;
      const serverMessage = error.body?.message || error.message;
      if (status) {
        showStatusAlert(status, serverMessage);
      } else {
        Swal.fire({
          title: 'Login Failed',
          text: serverMessage || 'Unable to login. Please check your credentials and try again.',
          icon: 'error',
          confirmButtonColor: '#6242a5'
        });
      }
    } finally {
      setLoading((prev) => ({ ...prev, login: false }));
    }
  };

  const handleApplySubmit = async (event) => {
    event.preventDefault();
    setLoading((prev) => ({ ...prev, apply: true }));

    try {
      const payload = {
        fullName: applyForm.fullName.trim(),
        email: applyForm.email.trim(),
        password: applyForm.password
      };

      // Include referral code if present
      if (referralCode) {
        payload.referralCode = referralCode;
      }

      const response = await api.auth.applyPartner(payload);
      const { message } = response;

      Swal.fire({
        title: 'Application Submitted',
        text: message || 'Your application has been submitted. We will notify you once it is reviewed.',
        icon: 'success',
        confirmButtonColor: '#6242a5'
      });

      setApplyForm(DEFAULT_APPLY_FORM);
      setLoginForm((prev) => ({
        ...prev,
        email: payload.email
      }));
      // Clear referral code from URL after submission
      if (referralCode) {
        navigate('/login', { replace: true });
        setReferralCode('');
      }
      toggleMode('login');
    } catch (error) {
      const serverMessage = error.body?.message || error.message || 'Unable to submit application.';
      Swal.fire({
        title: 'Submission Failed',
        text: serverMessage,
        icon: 'error',
        confirmButtonColor: '#6242a5'
      });
    } finally {
      setLoading((prev) => ({ ...prev, apply: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/favicon.png"
                alt="Solitaire IB"
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-[#6242a5]">Solitaire</span> Partners
            </h1>
            <p className="text-gray-600 mt-2">
              {mode === 'login' ? 'Access your Solitaire partner dashboard' : 'Apply to become a Solitaire partner'}
            </p>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => toggleMode('login')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${mode === 'login'
                ? 'bg-white shadow text-[#6242a5]'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Login as Partner
            </button>
            <button
              type="button"
              onClick={() => toggleMode('apply')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${mode === 'apply'
                ? 'bg-white shadow text-[#6242a5]'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Apply as Partner
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6242a5] focus:border-transparent"
                  placeholder="Enter your email"
                  required
                  disabled={loading.login}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6242a5] focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  disabled={loading.login}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading.login}
              >
                Continue
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Only approved IB partners can access the portal.
              </p>
            </form>
          ) : (
            <form onSubmit={handleApplySubmit} className="space-y-5">
              {referralCode && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800 mb-1">Referral Code Applied</p>
                  <p className="text-xs text-green-700">
                    You were referred by: {referrerName ? (
                      <>
                        <span className="font-semibold">{referrerName}</span>
                        <span className="text-green-600"> ({referralCode})</span>
                      </>
                    ) : (
                      <span className="font-mono font-bold">{referralCode}</span>
                    )}
                  </p>
                </div>
              )}
              <div className="rounded-lg border border-[#6242a5]/30 bg-[#f5f0ff] p-4 text-xs text-[#3f2b80]">
                <p className="text-sm font-semibold text-[#6242a5]">Use Your Account Credentials</p>
                <p className="mt-1 leading-relaxed">
                  Enter the same email and password you already use for your trading account so we can link
                  your partner application without delays.
                </p>
              </div>

              <div>
                <label htmlFor="apply-full-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="apply-full-name"
                  name="fullName"
                  value={applyForm.fullName}
                  onChange={handleApplyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6242a5] focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                  disabled={loading.apply}
                />
              </div>

              <div>
                <label htmlFor="apply-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="apply-email"
                  name="email"
                  value={applyForm.email}
                  onChange={handleApplyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6242a5] focus:border-transparent"
                  placeholder="Enter your email"
                  required
                  disabled={loading.apply}
                />
              </div>

              <div>
                <label htmlFor="apply-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="apply-password"
                  name="password"
                  value={applyForm.password}
                  onChange={handleApplyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6242a5] focus:border-transparent"
                  placeholder="Choose a password"
                  required
                  disabled={loading.apply}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading.apply}
              >
                Submit Application
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Already applied? Switch to login once your application is approved.
              </p>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
