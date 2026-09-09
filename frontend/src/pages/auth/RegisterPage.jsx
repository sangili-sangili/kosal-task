import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';

export function RegisterPage() {
  const { register: registerAuth, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await registerAuth(data);
      navigate('/login');
    } catch (e) {
      // Error handled by thunk toast
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Create an Account</h3>
        <p className="text-sm text-slate-500 mt-1">
          Join the enterprise platform with secure access
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="First Name"
            placeholder="John"
            leftIcon={User}
            required
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'First name is required',
              minLength: { value: 2, message: 'Minimum 2 characters' },
            })}
          />

          <Input
            label="Last Name"
            placeholder="Doe"
            required
            error={errors.lastName?.message}
            {...register('lastName', {
              required: 'Last name is required',
              minLength: { value: 2, message: 'Minimum 2 characters' },
            })}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="john.doe@company.com"
          leftIcon={Mail}
          required
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />

        <Input
          label="Phone Number (Optional)"
          type="tel"
          placeholder="+1 555-0100"
          leftIcon={Phone}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={Lock}
          required
          helperText="Must be 8+ chars with 1 uppercase & 1 number"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
            validate: {
              hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain at least 1 uppercase letter',
              hasNumber: (v) => /[0-9]/.test(v) || 'Must contain at least 1 number',
            },
          })}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            leftIcon={UserPlus}
            className="w-full"
          >
            Create Account
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
