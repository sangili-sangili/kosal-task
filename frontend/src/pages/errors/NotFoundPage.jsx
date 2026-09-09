import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-6 shadow-subtle border border-slate-200">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        404 - Page Not Found
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md">
        The page you are looking for might have been moved, renamed, or does not exist in the Real Estate CRM.
      </p>
      <div className="mt-8">
        <Link to="/dashboard">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
