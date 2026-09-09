import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">403 - Access Denied</h1>
      <p className="mt-3 text-base text-slate-600 max-w-md">
        You do not have the required role or security permissions to access this enterprise module.
      </p>
      <div className="mt-8">
        <Link to="/dashboard">
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
