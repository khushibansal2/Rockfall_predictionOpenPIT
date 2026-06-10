export default function Header() {
  return (
    <header className="bg-rock-900 border-b border-rock-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mine-600 flex items-center justify-center shadow-inner">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-mine-100" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 19h20L12 2z" />
              <path d="M12 9v5M12 16v1" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Rockfall Risk Predictor</h1>
            <p className="text-xs text-rock-400 leading-tight">Open Pit Mining — ML Prediction System</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-rock-400">
          <span className="inline-flex items-center gap-1.5 bg-rock-800 rounded-full px-3 py-1 border border-rock-700">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></span>
            Model Active
          </span>
          <span className="hidden sm:inline bg-rock-800 rounded-full px-3 py-1 border border-rock-700">
            Random Forest • 200 trees
          </span>
        </div>
      </div>
    </header>
  )
}
