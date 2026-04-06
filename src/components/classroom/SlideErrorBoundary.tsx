// FriendlyTeaching.cl — Error Boundary for individual slides
'use client';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  slideIndex: number;
  slideType?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class SlideErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when navigating to a different slide
    if (prevProps.slideIndex !== this.props.slideIndex && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-[#FFFCF7]">
          <div className="text-5xl mb-4">😵</div>
          <h3 className="text-lg font-bold text-[#5A3D7A] mb-2">
            Error al mostrar este slide
          </h3>
          <p className="text-sm text-gray-500 mb-1">
            Slide {this.props.slideIndex + 1}
            {this.props.slideType && (
              <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded">
                {this.props.slideType}
              </span>
            )}
          </p>
          <p className="text-xs text-red-400 mb-4 max-w-sm text-center">
            {this.state.error?.message ?? 'Error desconocido'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Reintentar
            </button>
            {this.props.onRetry && (
              <button
                onClick={this.props.onRetry}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Siguiente slide →
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
