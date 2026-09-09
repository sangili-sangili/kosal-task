import React from 'react';
import { Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-600 items-center justify-center text-white shadow-xl mb-4">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Real Estate CRM Portal
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Intelligent Lead Pipeline & Unit Inventory Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
