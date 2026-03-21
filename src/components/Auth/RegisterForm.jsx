// components/Auth/RegisterForm.jsx
// User registration page.
// Collects username, email, password, and full name with yup-driven validation.
// Inline field errors are shown as soon as each field is blurred or the form
// is submitted.  On success the user is automatically logged in and redirected
// to the dashboard (via the auth context's register action).

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi'

import { useAuth } from '../../context/AuthContext'
import { registerSchema } from '../../utils/validators'

/**
 * RegisterForm
 * Renders the sign-up form at the /register route.
 * Validates all four fields before calling the auth context's register action.
 */
export default function RegisterForm() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(registerSchema) })

  /**
   * Handle form submission.
   * If the backend responds with a 409 (username taken) we surface that
   * message; otherwise we show a generic error toast.
   */
  const onSubmit = async (data) => {
    try {
      await registerUser(data)
      toast.success('Account created! Welcome aboard.')
      navigate('/dashboard')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Registration failed. Please try again.'
      toast.error(typeof msg === 'string' ? msg : 'Registration failed')
    }
  }

  // Helper to return the correct border/bg classes based on whether a field has an error
  const fieldClasses = (fieldError) =>
    `w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
      fieldError
        ? 'border-red-400 focus:border-red-500 bg-red-50'
        : 'border-slate-300 focus:border-blue-500'
    }`

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Page header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FiUserPlus className="text-white" size={26} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Create account</h1>
            <p className="text-slate-500 text-sm mt-1">
              Join the collaborative whiteboard platform
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Full Name field */}
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  {...register('fullName')}
                  className={fieldClasses(errors.fullName)}
                />
              </div>
              {/* Inline validation error shown under the field */}
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Username field */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="username"
                  type="text"
                  placeholder="janesmith"
                  autoComplete="username"
                  {...register('username')}
                  className={fieldClasses(errors.username)}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Email field */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  {...register('email')}
                  className={fieldClasses(errors.email)}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  {...register('password')}
                  className={fieldClasses(errors.password)}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg
                hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Link back to login */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
