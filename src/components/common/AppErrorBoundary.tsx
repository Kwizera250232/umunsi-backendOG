import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = { children: ReactNode };
type State = { hasError: boolean };

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Umunsi render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f8f5] flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-[#0b0e11] mb-2">Habaye ikosa</h1>
            <p className="text-gray-600 mb-6">Ongera ugerageze gufungura urupapuro.</p>
            <button type="button" onClick={() => window.location.reload()} className="px-6 py-3 bg-[#fcd535] text-[#0b0e11] font-bold rounded-lg mr-3">Ongera ugerageze</button>
            <Link to="/" className="text-[#0b0e11] underline font-medium">Subira ahabanza</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
