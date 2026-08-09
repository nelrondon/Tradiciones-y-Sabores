import { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[Tradiciones y Sabores] Error fatal en App:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '40px',
          background: '#1a0a00',
          color: '#fff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>🍽️</div>
          <h1 style={{ color: '#e8601a', fontSize: '24px', margin: 0 }}>
            Tradiciones y Sabores — Error de carga
          </h1>
          <p style={{ color: '#aaa', margin: 0 }}>
            La aplicación encontró un error al iniciar. Por favor recarga la página.
          </p>
          <details style={{ background: '#2a1500', padding: '16px', borderRadius: '8px', color: '#e8601a' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Detalles técnicos</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '8px', color: '#ffa07a' }}>
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#e8601a',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              width: 'fit-content'
            }}
          >
            🔄 Recargar aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
