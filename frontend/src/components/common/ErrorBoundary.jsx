import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Button from '../ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Real Estate CRM Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-card space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-150 flex items-center justify-center mx-auto shadow-subtle">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                An unexpected interface exception occurred. You can reload the application or reset the mock
                session data to restore normal operation.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs font-mono text-slate-700 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => window.location.reload()}
              >
                Reload Application
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={this.handleReset}
              >
                Reset Demo Data
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
