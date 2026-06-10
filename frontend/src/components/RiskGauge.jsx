function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const s = polarToCartesian(cx, cy, r, startAngle)
  const e = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
}

export default function RiskGauge({ score = 0, label = 'Low Risk', prediction = 0 }) {
  // Map 0–100 score to -135° → +135° arc (270° total)
  const START = -135
  const END = 135
  const angle = START + (score / 100) * (END - START)

  const CX = 100, CY = 90, R = 72

  const zones = [
    { from: -135, to: -45, color: '#22c55e', label: 'Low' },
    { from: -45, to: 45, color: '#f59e0b', label: 'Med' },
    { from: 45, to: 135, color: '#ef4444', label: 'High' },
  ]

  const needleTip = polarToCartesian(CX, CY, R - 8, angle)
  const needleBase1 = polarToCartesian(CX, CY, 12, angle - 90)
  const needleBase2 = polarToCartesian(CX, CY, 12, angle + 90)

  const color = score < 40 ? '#22c55e' : score < 65 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 130" className="w-64 h-40">
        {/* Track */}
        <path
          d={arcPath(CX, CY, R, -135, 135)}
          fill="none"
          stroke="#374151"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {score > 0 && (
          <path
            d={arcPath(CX, CY, R, -135, angle)}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}99)` }}
          />
        )}
        {/* Zone tick labels */}
        {[
          { a: -135, t: '0' }, { a: -45, t: '40' },
          { a: 45, t: '65' }, { a: 135, t: '100' },
        ].map(({ a, t }) => {
          const p = polarToCartesian(CX, CY, R + 14, a)
          return (
            <text key={t} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
              className="fill-rock-500" fontSize="7">
              {t}
            </text>
          )
        })}
        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={color}
          opacity="0.9"
        />
        <circle cx={CX} cy={CY} r="6" fill="#1f2937" stroke={color} strokeWidth="2" />
        {/* Center score text */}
        <text x={CX} y={CY + 26} textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
          {score.toFixed(1)}%
        </text>
        <text x={CX} y={CY + 38} textAnchor="middle" fontSize="7" fill="#9ca3af">
          RISK SCORE
        </text>
      </svg>

      <div
        className="px-5 py-2 rounded-full font-bold text-lg tracking-wide border-2"
        style={{
          color,
          borderColor: color,
          backgroundColor: `${color}18`,
          boxShadow: `0 0 16px ${color}44`,
        }}
      >
        {label}
      </div>
    </div>
  )
}
