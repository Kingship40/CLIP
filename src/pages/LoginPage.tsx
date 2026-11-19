import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Checkbox } from '../components/common/Checkbox';
import { Scissors, Eye, EyeOff, Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('alex.rivera@clipforge.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginAsDemo } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    let hasErrors = false;
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
      hasErrors = true;
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email address.';
      hasErrors = true;
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required.';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const result = await login(email, password, rememberMe);
    setIsLoading(false);

    if (result.success) {
      addToast({
        title: 'Welcome back!',
        message: 'Signed in with demo session credentials.',
        type: 'success',
      });
      navigate('/dashboard');
    } else {
      setErrors({ email: result.error });
    }
  };

  const handleInstantDemoLogin = () => {
    loginAsDemo();
    addToast({
      title: 'Demo Mode Activated',
      message: 'Signed into test workspace with preloaded sample projects.',
      type: 'info',
    });
    navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
    >
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
            ClipForge <span className="text-brand-600 dark:text-brand-400 text-xs uppercase px-1.5 py-0.5 rounded bg-brand-500/15">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Welcome back
        </h2>
        <p className="mt-2 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          Sign in to your creative clipping workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div
          className="border py-8 px-6 sm:px-10 rounded-2xl shadow-2xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Quick Demo Mode Instant Access Button */}
          <div className="mb-6 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/25 text-center">
            <span className="text-xs text-brand-600 dark:text-brand-300 font-semibold flex items-center justify-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Demo Authentication Flow
            </span>
            <p className="text-[11px] mb-2.5" style={{ color: 'var(--text-muted)' }}>
              Instant login with sample projects and testing media preloaded.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleInstantDemoLogin}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In Instantly as Demo User
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span
                className="px-2"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                }}
              >
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="Remember me"
              />
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  addToast({ title: 'Password Reset', message: 'In demo mode, any password allows instant sign in.', type: 'info' });
                }}
                className="text-brand-400 hover:text-white transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="secondary"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-white font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
