'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center">
        <span className="text-xl font-black text-neon-green tracking-tight">gymslop</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-slate-100">Sin conexión</h1>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Tus datos se sincronizarán automáticamente cuando vuelvas a conectarte.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 rounded-xl border border-neon-green/40 bg-neon-green/10 text-neon-green text-sm font-semibold transition-colors hover:bg-neon-green/20"
      >
        Reintentar
      </button>
    </div>
  );
}
