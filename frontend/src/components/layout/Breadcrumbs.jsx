import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels = {
  dashboard: 'Dashboard',
  users: 'User Management',
  customers: 'Customers & Transactions',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center text-xs sm:text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-1.5 sm:gap-2">
        <li className="inline-flex items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = routeLabels[value] || value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <li key={to} className="inline-flex items-center gap-1.5 sm:gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {isLast ? (
                <span className="font-semibold text-slate-800" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link to={to} className="text-slate-500 hover:text-brand-600 transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
