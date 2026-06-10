import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#e29f3e', '#c06818', '#d98520', '#9e4f17', '#f3dba6', '#ebc06f', '#823f19', '#6c3518', '#3d1a0a']

export default function FeatureImportanceChart({ importances }) {
  if (!importances) return null

  const data = Object.entries(importances)
    .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(2)) }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="bg-rock-900 rounded-xl border border-rock-800 p-5">
      <h3 className="text-sm font-semibold text-rock-300 mb-4 uppercase tracking-wider">Feature Importance</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }}
            width={110} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${v}%`, 'Importance']}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
