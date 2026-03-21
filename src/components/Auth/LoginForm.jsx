// components/Auth/LoginForm.jsx
// Login page component.
// Uses react-hook-form for form state management and yup for client-side
// validation.  Inline validation errors are shown beneath each field as soon
// as the user blurs the field or attempts to submit.
// On success the user is redirected to /dashboard.
// On failure a toast notification shows the error returned by the backend.

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi'

import { useAuth } from '../../context/AuthContext'
import { loginSchema } from '../../utils/validators'

/**
 * LoginForm
 * Renders the sign-in form at the /login route.
 * Validates username (min 3 chars) and password (min 6 chars) before
 * calling the auth context's login action.
 */
export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()

  // Register the form with the yup validation schema
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(loginSchema) })

  // Demo users for quick login during development
  const demoUsers = [
    { username: 'srinidhi', password: 'password123', label: 'Srinidhi' },
    { username: 'alice', password: 'password123', label: 'Alice' },
    { username: 'bob', password: 'password123', label: 'Bob' },
  ]

  const fillDemoUser = (user) => {
    setValue('username', user.username, { shouldValidate: true })
    setValue('password', user.password, { shouldValidate: true })
  }

  /**
   * Handle form submission.
   * Calls the auth service and navigates on success, or shows a toast on error.
   */
  const onSubmit = async (data) => {
    try {
      await login(data)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      // Show the server's error message if available, otherwise a generic one
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Invalid username or password'
      toast.error(typeof msg === 'string' ? msg : 'Login failed')
    }
  }

  return (
    // Full-viewport centred layout with a subtle gradient background
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* Card container */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FiLogIn className="text-white" size={26} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Log in</h1>
            <p className="text-slate-500 text-sm mt-1">
              Access your collaborative whiteboards
            </p>
          </div>

          {/* Demo user quick-fill buttons */}
          <div className="mb-6">
            <p className="text-xs text-slate-400 text-center mb-2">Quick login as demo user</p>
            <div className="flex gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.username}
                  type="button"
                  onClick={() => fillDemoUser(user)}
                  className="flex-1 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {user.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sign-in form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Username field */}
            <div className="mb-5">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Username
              </label>
              <div className="relative">
                <FiUser
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  {...register('username')}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors
                    ${errors.username
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-slate-300 focus:border-blue-500'
                    }`}
                />
              </div>
              {/* Inline validation error - shown immediately on blur / submit */}
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors
                    ${errors.password
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-slate-300 focus:border-blue-500'
                    }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button - shows loading state while the API call is in flight */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg
                hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Link to registration page */}
          <p className="text-center text-sm text-slate-500 mt-6">
            No account yet?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
