import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (e) {
      // Error handled by thunk toast
    }
  };

  const fillDemoAdmin = () => {
    setValue('email', 'admin@enterprise.com');
    setValue('password', 'Admin@123456');
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
        <p className="text-sm text-slate-500 mt-1">
          Enter your enterprise credentials to access the system
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Work Email"
          type="email"
          placeholder="admin@enterprise.com"
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

      {/* Demo Credentials Quick Fill */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
          Quick Demo Credentials
        </p>
        <button
          type="button"
          onClick={fillDemoAdmin}
          className="w-full inline-flex items-center justify-between p-2.5 rounded-lg border border-brand-200 bg-brand-50/60 hover:bg-brand-50 text-brand-700 text-xs font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Super Admin: admin@enterprise.com</span>
          </span>
          <span className="font-mono text-[11px] bg-brand-100 px-1.5 py-0.5 rounded text-brand-800">
            Admin@123456
          </span>
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Need a test account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Register new account
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
