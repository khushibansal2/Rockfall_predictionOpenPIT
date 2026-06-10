export default function SliderInput({ label, name, value, onChange, min, max, step = 0.001, unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-rock-300">{label}</label>
        <span className="text-sm font-mono font-semibold text-mine-300 bg-rock-800 px-2 py-0.5 rounded border border-rock-700">
          {typeof value === 'number' ? value.toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 1) : value}{unit}
        </span>
      </div>
      <div className="relative">
        <div className="h-2 bg-rock-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-mine-500 to-mine-400 rounded-full transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
      </div>
      <div className="flex justify-between text-xs text-rock-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}
