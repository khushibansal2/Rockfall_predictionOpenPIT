import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const ROCK_COLORS = { Igneous: '#c06818', Metamorphic: '#6b7280', Sedimentary: '#92400e' }
const RISK_COLORS = ['#22c55e', '#ef4444']

export default function DatasetStats({ stats }) {
  if (!stats) return (
    <div className="bg-rock-900 rounded-xl border border-rock-800 p-5 animate-pulse">
      <div className="h-4 bg-rock-700 rounded w-1/3 mb-4" />
      <div className="h-32 bg-rock-800 rounded" />
    </div>
  )

  const rockData = Object.entries(stats.rock_type_distribution).map(([name, value]) => ({ name, value }))
  const riskData = [
    { name: 'Low Risk', value: stats.low_risk_count },
    { name: 'High Risk', value: stats.high_risk_count },
  ]

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Records', value: stats.total_records, color: 'text-mine-300' },
          { label: 'High Risk Events', value: stats.high_risk_count, color: 'text-red-400' },
          { label: 'Low Risk Events', value: stats.low_risk_count, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-rock-900 rounded-xl border border-rock-800 p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-rock-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rock-900 rounded-xl border border-rock-800 p-4">
          <h4 className="text-xs uppercase tracking-wider text-rock-400 mb-2">Rock Type Distribution</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={rockData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                {rockData.map((entry) => (
                  <Cell key={entry.name} fill={ROCK_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-rock-900 rounded-xl border border-rock-800 p-4">
          <h4 className="text-xs uppercase tracking-wider text-rock-400 mb-2">Risk Distribution</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                {riskData.map((entry, i) => <Cell key={entry.name} fill={RISK_COLORS[i]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature ranges */}
      <div className="bg-rock-900 rounded-xl border border-rock-800 p-4">
        <h4 className="text-xs uppercase tracking-wider text-rock-400 mb-3">Dataset Feature Ranges</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {Object.entries(stats.feature_stats).map(([feat, s]) => (
            <div key={feat} className="flex items-center justify-between text-xs">
              <span className="text-rock-400">{feat.replace(/_/g, ' ')}</span>
              <span className="text-rock-300 font-mono">{s.min} – {s.max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
