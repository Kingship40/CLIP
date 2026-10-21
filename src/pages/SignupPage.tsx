import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Checkbox } from '../components/common/Checkbox';
import { Scissors, Lock, Mail, User as UserIcon, Sparkles, ArrowRight } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signup, loginAsDemo } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Please enter your full name.';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Please enter a valid email.';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!agreeTerms) newErrors.terms = 'You must accept the terms of service.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const result = await signup(fullName, email, password);
    setIsLoading(false);

    if (result.success) {
      addToast({
        title: 'Account created!',
        message: 'Welcome to ClipForge AI Studio.',
        type: 'success',
      });
      navigate('/dashboard');
    } else {
      setErrors({ email: result.error || 'Registration failed' });
    }
  };

  const handleInstantDemo = () => {
    loginAsDemo();
    addToast({ title: 'Demo Mode Activated', type: 'info' });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">
            ClipForge <span className="text-brand-400 text-xs uppercase px-1.5 py-0.5 rounded bg-brand-500/15">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create your free account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Start generating viral short clips from long videos today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-dark-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl">
          <div className="mb-6 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/25 text-center">
            <span className="text-xs text-brand-300 font-semibold flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Demo Mode Available
            </span>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Skip registration and jump right into the studio workspace.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleInstantDemo}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Explore Demo Studio Immediately
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dark-900 px-2 text-slate-500">Or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              leftIcon={<UserIcon className="w-4 h-4" />}
              error={errors.fullName}
            />

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword}
            />

            <div className="pt-1">
              <Checkbox
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                label={
                  <span className="text-xs text-slate-400">
                    I agree to the <a href="#" className="text-brand-400 hover:underline">Terms of Service</a> and <a href="#" className="text-brand-400 hover:underline">Privacy Policy</a>
                  </span>
                }
              />
              {errors.terms && <p className="mt-1 text-xs text-rose-400">{errors.terms}</p>}
            </div>

            <Button
              type="submit"
              variant="secondary"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-white font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
