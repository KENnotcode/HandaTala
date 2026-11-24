'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Utensils, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Input, Card } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';


export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') {
      // The URL is read after hydration to avoid a server/client render mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('signup');
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (mode === 'signup') {
      const result = await signup(name, email, password);
      if (result.success) {
        toast.success(result.message);
        router.replace('/');
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } else if (mode === 'login') {
      const success = await login(email, password);
      if (success) {
        const isAdmin = useAuthStore.getState().isAdmin;
        toast.success('Welcome back!');
        router.replace(isAdmin ? '/admin' : '/');
        router.refresh();
      } else {
        toast.error('Invalid email or password.');
      }
    } else if (mode === 'forgot') {
      const result = await authService.forgotPassword(email);
      if (result.success) {
        toast.success(result.data || 'Password reset link sent to your email.');
        setMode('login');
      } else {
        toast.error('Failed to send reset link.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">HandaTala</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === 'login' ? 'Sign in to continue' : mode === 'signup' ? 'Sign up to start ordering' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        <Card className="p-6">
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-2 mb-5 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <Input
                label="Name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                leftIcon={<Shield className="w-5 h-5" />}
                autoComplete="name"
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              leftIcon={<Shield className="w-5 h-5" />}
              autoComplete="email"
            />

            {mode !== 'forgot' && (
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={mode === 'signup' ? 6 : undefined}
                leftIcon={<Shield className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                autoComplete="current-password"
              />
            )}

            {mode === 'login' && (
              <div className="flex justify-end -mt-3">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
              )}
            </Button>
          </form>

          {mode === 'forgot' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                &larr; Back to Login
              </button>
            </div>
          )}
        </Card>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} HandaTala. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
