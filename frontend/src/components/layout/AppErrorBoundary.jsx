import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="min-h-screen flex flex-col items-center justify-center gap-5 p-8 text-center" role="alert">
      <h1 className="text-2xl font-bold">No pudimos abrir esta pantalla</h1>
      <p>Tus datos guardados siguen en este dispositivo. Vuelve a abrir la aplicación para continuar.</p>
      <button className="px-5 py-3 rounded-xl bg-emerald-700 text-white" onClick={() => window.location.reload()}>Volver a abrir ALACENA</button>
    </main>;
  }
}
