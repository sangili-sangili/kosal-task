import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

/**
 * Route guard that restricts unauthorized roles from accessing a page,
 * renders an Access Restricted modal, and redirects back to previous/current page.
 */
export function PermissionGuard({
  children,
  requiredPermission = 'audit:read',
  moduleName = 'Audit Logs',
  redirectTo = '/dashboard',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isAdmin, loading, currentRoleCode } = usePermissions();
  const [modalOpen, setModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(4);

  const isAllowed = isAdmin || hasPermission(requiredPermission);

  useEffect(() => {
    if (!loading && !isAllowed) {
      setModalOpen(true);
      setCountdown(4);
    }
  }, [loading, isAllowed]);

  // Countdown timer auto-redirecting to previous or current page
  useEffect(() => {
    let timer = null;
    if (modalOpen) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleRedirect();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [modalOpen]);

  const handleRedirect = () => {
    setModalOpen(false);
    // If navigation history exists, return to previous/current page; otherwise dashboard
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(redirectTo, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <>
        {/* Permission Denied Modal Popup */}
        <Modal
          isOpen={modalOpen}
          onClose={handleRedirect}
          size="sm"
          showClose={true}
        >
          <div className="text-center py-3 px-1">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm animate-in zoom-in-95">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Access Restricted
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              You do not have permission to access the <strong className="text-slate-800 font-semibold">{moduleName}</strong> page.
            </p>

            <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Your Role:</span>
                <span className="font-semibold text-slate-800">{currentRoleCode}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Required Permission:</span>
                <span className="font-mono text-rose-600 font-medium">{requiredPermission}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-5">
              Redirecting to current page in <strong className="text-brand-700 font-bold">{countdown}s</strong>...
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={ArrowLeft}
                onClick={handleRedirect}
              >
                Go Back
              </Button>
              <Button
                variant="accent"
                size="sm"
                leftIcon={Home}
                onClick={() => navigate(redirectTo, { replace: true })}
              >
                Dashboard
              </Button>
            </div>
          </div>
        </Modal>

        {/* Minimal backdrop while modal displays */}
        <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
          <div className="text-center">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">Access Restricted</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Redirecting to authorized page...</p>
          </div>
        </div>
      </>
    );
  }

  return children;
}

export default PermissionGuard;
