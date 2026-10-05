import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070B19] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0D152D] border border-amber-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold text-white">
              {this.props.fallbackTitle || 'Dhaka Night Market'}
            </h2>
            <p className="text-sm text-slate-300">
              The application encountered a display glitch. Please reload the page to refresh your session.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
              >
                Reload Website
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
