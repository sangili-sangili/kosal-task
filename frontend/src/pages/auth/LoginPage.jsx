import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCrm } from '../../context/CrmContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const { setCurrentUser } = useCrm();
  const navigate = useNavigate();
  const location = useLocation();

  const [authError, setAuthError] = useState(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setAuthError(null);
    try {
      const result = await login(data);
      if (result && result.user) {
        setCurrentUser(result.user);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(err?.message || err || 'Invalid email or password');
    }
  };

  const fillDemoAdmin = () => {
    setValue('email', 'admin@crm.com');
    setValue('password', 'Password@1234');
    setAuthError(null);
  };

  const fillDemoSales = () => {
    setValue('email', 'rahul.sales@crm.com');
    setValue('password', 'Password@1234');
    setAuthError(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
        <p className="text-sm text-slate-500 mt-1">
          Enter your Real Estate CRM credentials to access the portal
        </p>
      </div>

      {authError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@crm.com"
          leftIcon={Mail}
          required
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address format',
            },
          })}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={Lock}
          required
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            leftIcon={LogIn}
            className="w-full"
          >
            Sign In
          </Button>
        </div>
      </form>

      {/* Quick Demo Credentials */}
      <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Quick Demo Credentials
        </p>
        <button
          type="button"
          onClick={fillDemoAdmin}
          className="w-full inline-flex items-center justify-between p-2.5 rounded-lg border border-brand-200 bg-brand-50/60 hover:bg-brand-50 text-brand-700 text-xs font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Admin: admin@crm.com</span>
          </span>
          <span className="font-mono text-[11px] bg-brand-100 px-1.5 py-0.5 rounded text-brand-800">
            Password@1234
          </span>
        </button>

        <button
          type="button"
          onClick={fillDemoSales}
          className="w-full inline-flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Sales Rep: rahul.sales@crm.com</span>
          </span>
          <span className="font-mono text-[11px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
            Password@1234
          </span>
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Need a new account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Register new user
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
