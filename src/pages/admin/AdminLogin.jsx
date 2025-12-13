import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { useAdmin } from '../../hooks/useAdmin';
import authUtils from '../../utils/auth';

const AdminLogin = () => {
  const sanitizeInput = (value, type = 'text') => {
    if (typeof value !== 'string') return '';
    let sanitized = value.replace(/[\r\n]/g, ' ').replace(/<|>/g, '');
    if (type === 'email') {
      sanitized = sanitized.replace(/\s/g, '');
    }
    return sanitized;
  };

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { adminLogin } = useAdmin();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: sanitizeInput(value, name === 'email' ? 'email' : 'text')
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Single login call through AdminContext (uses API base URL correctly)
      const { admin, token } = await adminLogin(formData);

      // Persist token in cookie/localStorage via auth utils
      await authUtils.setAuthToken(token);
      authUtils.setAdminInfo(admin);

      navigate('/admin');
    } catch (err) {
      const message = err?.message || err?.body?.message || 'Invalid credentials. Please try again.';

      // Handle account lock scenario
      if (message && typeof message === 'string' && message.toLowerCase().includes('locked')) {
        Swal.fire({
          icon: 'error',
          title: 'Account Locked',
          text: 'Account is temporarily locked. Please try again in 15 minutes.',
          confirmButtonColor: '#C8F300',
          confirmButtonText: '<span style="color:#081428">OK</span>'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: message,
          confirmButtonColor: '#C8F300',
          confirmButtonText: '<span style="color:#081428">OK</span>'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/favicon.png" alt="Solitaire IB Admin" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-dark-base mb-2 font-heading">Admin Portal</h1>
          <p className="text-dark-base/60">Sign in to access the admin dashboard</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-xl border border-neutral-200 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-base/70 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors text-sm"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-base/70 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>



            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-brand hover:bg-brand-600 text-dark-base border border-brand py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-dark-base mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>



          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              © 2024 Solitaire IB Partners. All rights reserved.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
