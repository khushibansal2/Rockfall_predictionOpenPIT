import { useState, useEffect } from 'react'
import axios from 'axios'
import Header from './components/Header'
import SliderInput from './components/SliderInput'
import RiskGauge from './components/RiskGauge'
import FeatureImportanceChart from './components/FeatureImportanceChart'
import DatasetStats from './components/DatasetStats'

const API = import.meta.env.VITE_API_URL ?? ''

const DEFAULT_FORM = {
  rock_type: 'Sedimentary',
  date: '2024-07-15',
  rainfall: 24.5,
  slope_angle: 36.6,
  ndvi: 0.41,
  change_in_ndvi: 0.0,
  soil_moisture: 25.0,
  blast_vibration: 0.15,
  seismic_vibration: 0.026,
}

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('predict')

  useEffect(() => {
    axios.get(`${API}/dataset-stats`).then(r => setStats(r.data)).catch(() => {})
  }, [])

  function handleChange(e) {
    const { name, value, type } = e.target
    setForm(f => ({ ...f, [name]: type === 'range' || type === 'number' ? parseFloat(value) : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post(`${API}/predict`, form)
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to connect to prediction API. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setForm(DEFAULT_FORM)
    setResult(null)
    setError(null)
  }

  const inputClass = "w-full bg-rock-800 border border-rock-700 text-rock-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mine-500 focus:border-transparent"
  const labelClass = "block text-sm font-medium text-rock-300 mb-1"

  return (
    <div className="min-h-screen bg-rock-950">
      <Header />

      {/* Tab bar */}
      <div className="bg-rock-900 border-b border-rock-800">
        <div className="max-w-7xl mx-auto px-4">
          {['predict', 'dataset'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-mine-500 text-mine-300'
                  : 'border-transparent text-rock-400 hover:text-rock-200'
              }`}
            >
              {tab === 'predict' ? 'Risk Prediction' : 'Dataset Overview'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'predict' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Input form — 3 cols */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-rock-900 rounded-xl border border-rock-800 p-5">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-mine-400">Site Parameters</span>
                  <span className="text-xs font-normal text-rock-500">— enter current conditions</span>
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Rock type + Date row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Rock Type</label>
                      <select name="rock_type" value={form.rock_type} onChange={handleChange} className={inputClass}>
                        <option>Igneous</option>
                        <option>Metamorphic</option>
                        <option>Sedimentary</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <SliderInput label="Rainfall" name="rainfall" value={form.rainfall}
                      onChange={handleChange} min={0} max={50} step={0.1} unit=" mm" />
                    <SliderInput label="Slope Angle" name="slope_angle" value={form.slope_angle}
                      onChange={handleChange} min={5} max={70} step={0.1} unit="°" />
                    <SliderInput label="NDVI" name="ndvi" value={form.ndvi}
                      onChange={handleChange} min={0.1} max={0.7} step={0.01} />
                    <SliderInput label="Change in NDVI" name="change_in_ndvi" value={form.change_in_ndvi}
                      onChange={handleChange} min={-0.05} max={0.05} step={0.001} />
                    <SliderInput label="Soil Moisture" name="soil_moisture" value={form.soil_moisture}
                      onChange={handleChange} min={10} max={40} step={0.1} unit="%" />
                    <SliderInput label="Blast Vibration (PPV)" name="blast_vibration" value={form.blast_vibration}
                      onChange={handleChange} min={0} max={0.3} step={0.001} unit=" m/s" />
                    <SliderInput label="Seismic Vibration" name="seismic_vibration" value={form.seismic_vibration}
                      onChange={handleChange} min={0} max={0.05} step={0.001} unit=" m/s" />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-mine-600 hover:bg-mine-500 disabled:opacity-60 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Analyzing...
                        </>
                      ) : 'Predict Risk'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="bg-rock-800 hover:bg-rock-700 text-rock-300 font-medium py-2.5 px-4 rounded-lg transition-colors border border-rock-700"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>

              {/* Feature importance */}
              {result?.feature_importances && (
                <FeatureImportanceChart importances={result.feature_importances} />
              )}
            </div>

            {/* Result panel — 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-rock-900 rounded-xl border border-rock-800 p-5 flex flex-col items-center">
                <h2 className="text-sm font-semibold text-rock-300 uppercase tracking-wider mb-4">Risk Assessment</h2>

                {error && (
                  <div className="w-full bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm mb-4">
                    {error}
                  </div>
                )}

                {result ? (
                  <>
                    <RiskGauge score={result.risk_score} label={result.risk_label} prediction={result.prediction} />
                    <div className="w-full mt-4 space-y-2">
                      {[
                        { label: 'Risk Score', value: `${result.risk_score}%`, color: result.risk_score >= 65 ? 'text-red-400' : result.risk_score >= 40 ? 'text-amber-400' : 'text-green-400' },
                        { label: 'Confidence', value: `${result.confidence}%`, color: 'text-mine-300' },
                        { label: 'Classification', value: result.risk_label, color: result.prediction === 1 ? 'text-red-400' : 'text-green-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between items-center bg-rock-800 rounded-lg px-3 py-2 border border-rock-700">
                          <span className="text-rock-400 text-sm">{label}</span>
                          <span className={`font-semibold text-sm ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>

                    {result.prediction === 1 && (
                      <div className="w-full mt-3 bg-red-950/60 border border-red-800/60 rounded-lg p-3">
                        <p className="text-xs text-red-300 font-medium">HIGH RISK ALERT</p>
                        <p className="text-xs text-red-400 mt-1">Consider slope stabilization, reduced blasting, and increased monitoring frequency.</p>
                      </div>
                    )}
                    {result.prediction === 0 && (
                      <div className="w-full mt-3 bg-green-950/60 border border-green-800/60 rounded-lg p-3">
                        <p className="text-xs text-green-300 font-medium">LOW RISK</p>
                        <p className="text-xs text-green-400 mt-1">Conditions appear stable. Continue standard monitoring protocols.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 text-rock-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 mx-auto mb-3 opacity-40">
                      <path d="M9 17H7A5 5 0 017 7h1M15 7h1a5 5 0 010 10h-1M9 12h6" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm">Set parameters and click<br /><span className="text-mine-400 font-medium">Predict Risk</span> to assess</p>
                  </div>
                )}
              </div>

              {/* Quick guide */}
              <div className="bg-rock-900 rounded-xl border border-rock-800 p-4">
                <h3 className="text-xs font-semibold text-rock-400 uppercase tracking-wider mb-3">Risk Factors Guide</h3>
                <div className="space-y-1.5 text-xs text-rock-500">
                  {[
                    ['Slope Angle > 45°', 'Critical instability threshold'],
                    ['Rainfall > 30 mm', 'Significant saturation risk'],
                    ['NDVI < 0.25', 'Sparse vegetation, weak cohesion'],
                    ['Seismic > 0.04 m/s', 'Elevated structural stress'],
                    ['Blast PPV > 0.2 m/s', 'High vibration impact'],
                    ['Soil Moisture > 35%', 'Near-saturated conditions'],
                  ].map(([factor, desc]) => (
                    <div key={factor} className="flex gap-2">
                      <span className="text-mine-500 shrink-0">•</span>
                      <span><span className="text-rock-300">{factor}</span> — {desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dataset' && (
          <div className="max-w-4xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Training Dataset Overview</h2>
              <p className="text-sm text-rock-400 mt-1">
                Synthetic dataset of 500 records generated for open pit rockfall prediction research.
                Features include geological, meteorological, and geotechnical parameters.
              </p>
            </div>
            <DatasetStats stats={stats} />
          </div>
        )}
      </main>

      <footer className="mt-10 border-t border-rock-800 py-4 text-center text-xs text-rock-600">
        Rockfall Prediction System — Model: Voting Ensemble (RF + XGBoost + LightGBM + CatBoost) — Dataset: Synthetic Open Pit Mining Data (500 records)
        &nbsp;•&nbsp; Source: <a href="https://github.com/khushibansal2/Rockfall_predictionOpenPIT" target="_blank" rel="noreferrer" className="text-mine-600 hover:text-mine-400">khushibansal2/Rockfall_predictionOpenPIT</a>
      </footer>
    </div>
  )
}
