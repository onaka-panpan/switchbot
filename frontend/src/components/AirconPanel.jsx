import { useState } from 'react'
import client from '../api/client'

const MODES = [
  { value: 1, label: '自動' },
  { value: 2, label: '冷房' },
  { value: 3, label: '除湿' },
  { value: 4, label: '送風' },
  { value: 5, label: '暖房' },
]

const FAN_SPEEDS = [
  { value: 1, label: '自動' },
  { value: 2, label: '弱' },
  { value: 3, label: '中' },
  { value: 4, label: '強' },
]

export default function AirconPanel({ deviceId, deviceName }) {
  const [isPowerOn, setIsPowerOn] = useState(false)
  const [temperature, setTemperature] = useState(26)
  const [mode, setMode] = useState(2)
  const [fanSpeed, setFanSpeed] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function sendCommand(command, parameter = 'default') {
    setLoading(true)
    setMessage('')
    try {
      await client.post(`/devices/${deviceId}/command`, {
        command,
        parameter,
        commandType: 'command',
      })
      setMessage('送信しました')
    } catch (e) {
      setMessage('送信に失敗しました')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 2000)
    }
  }

  async function togglePower() {
    const nextOn = !isPowerOn
    if (nextOn) {
      await sendCommand('turnOn')
    } else {
      await sendCommand('turnOff')
    }
    setIsPowerOn(nextOn)
  }

  async function applySettings() {
    // parameter: "{温度},{モード},{風量},{電源}"
    const power = isPowerOn ? 'on' : 'off'
    await sendCommand('setAll', `${temperature},${mode},${fanSpeed},${power}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">エアコン</h2>
        <span className="text-sm text-gray-500">{deviceName}</span>
      </div>

      {/* 電源 */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-medium text-gray-700 w-16">電源</span>
        <button
          onClick={togglePower}
          disabled={loading}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
            isPowerOn ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              isPowerOn ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isPowerOn ? 'text-blue-600' : 'text-gray-400'}`}>
          {isPowerOn ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* 温度 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium text-gray-700 w-16">温度</span>
        <button
          onClick={() => setTemperature((t) => Math.max(16, t - 1))}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
        >
          −
        </button>
        <span className="text-2xl font-bold text-blue-600 w-16 text-center">{temperature}°C</span>
        <button
          onClick={() => setTemperature((t) => Math.min(30, t + 1))}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
        >
          ＋
        </button>
      </div>

      {/* 運転モード */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium text-gray-700 w-16">モード</span>
        <div className="flex gap-2 flex-wrap">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                mode === m.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 風量 */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-medium text-gray-700 w-16">風量</span>
        <div className="flex gap-2">
          {FAN_SPEEDS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFanSpeed(f.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                fanSpeed === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={applySettings}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          設定を送信
        </button>
        {message && <span className="text-sm text-green-600">{message}</span>}
      </div>
    </div>
  )
}
