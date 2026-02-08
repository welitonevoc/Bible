
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Added constructor to ensure this.props is correctly initialized and typed in class components
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada.
            </p>
            {this.state.error && (
              <pre className="bg-gray-100 p-3 rounded text-xs text-left text-red-700 overflow-auto mb-6 max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:bg-slate-800"
            >
              Voltar para o Início
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
