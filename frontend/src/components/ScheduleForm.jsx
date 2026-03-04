import { useEffect, useState } from 'react'
import client from '../api/client'

const DAYS = [
  { value: 'mon', label: '月' },
  { value: 'tue', label: '火' },
  { value: 'wed', label: '水' },
  { value: 'thu', label: '木' },
  { value: 'fri', label: '金' },
  { value: 'sat', label: '土' },
  { value: 'sun', label: '日' },
]

const AIRCON_MODES = [
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

const DEFAULT_FORM = {
  name: '',
  schedule_type: 'recurring',
  days_of_week: [],
  execute_date: '',
  execute_time: '07:00',
  device_id: '',
  device_name: '',
  command: 'turnOn',
  temperature: 26,
  ac_mode: 2,
  fan_speed: 1,
  ac_power: 'on',
}

export default function ScheduleForm({ initial, devices, onSaved, onCancel }) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      const aj = initial.action_json || {}
      const parts = (aj.parameter || '').split(',')
      setForm({
        name: initial.name,
        schedule_type: initial.schedule_type,
        days_of_week: initial.days_of_week ? initial.days_of_week.split(',') : [],
        execute_date: initial.execute_date || '',
        execute_time: initial.execute_time,
        device_id: initial.device_id,
        device_name: initial.device_name,
        command: aj.command || 'turnOn',
        temperature: parseInt(parts[0]) || 26,
        ac_mode: parseInt(parts[1]) || 2,
        fan_speed: parseInt(parts[2]) || 1,
        ac_power: parts[3] || 'on',
      })
    }
  }, [initial])

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day],
    }))
  }

  function getSelectedDevice() {
    return devices.find((d) => d.deviceId === form.device_id)
  }

  function isAircon() {
    const dev = getSelectedDevice()
    return dev && dev.remoteType === 'Air Conditioner'
  }

  function buildActionJson() {
    if (isAircon() && form.command === 'setAll') {
      return {
        command: 'setAll',
        parameter: `${form.temperature},${form.ac_mode},${form.fan_speed},${form.ac_power}`,
        commandType: 'command',
      }
    }
    return { command: form.command, parameter: 'default', commandType: 'command' }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const payload = {
      name: form.name,
      schedule_type: form.schedule_type,
      days_of_week:
        form.schedule_type === 'recurring' ? form.days_of_week.join(',') : null,
      execute_date: form.schedule_type === 'once' ? form.execute_date : null,
      execute_time: form.execute_time,
      device_id: form.device_id,
      device_name: form.device_name,
      action_json: buildActionJson(),
    }
    try {
      if (initial) {
        await client.put(`/schedules/${initial.id}`, payload)
      } else {
        await client.post('/schedules', payload)
      }
      onSaved()
    } catch (e) {
      setError('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">スケジュール名</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">実行タイプ</label>
        <select
          value={form.schedule_type}
          onChange={(e) => setForm((f) => ({ ...f, schedule_type: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recurring">繰り返し</option>
          <option value="once">一回限り</option>
        </select>
      </div>

      {form.schedule_type === 'recurring' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">曜日</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  form.days_of_week.includes(d.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.schedule_type === 'once' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
          <input
            type="date"
            value={form.execute_date}
            onChange={(e) => setForm((f) => ({ ...f, execute_date: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">時刻</label>
        <input
          type="time"
          value={form.execute_time}
          onChange={(e) => setForm((f) => ({ ...f, execute_time: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">デバイス</label>
        <select
          value={form.device_id}
          onChange={(e) => {
            const dev = devices.find((d) => d.deviceId === e.target.value)
            setForm((f) => ({
              ...f,
              device_id: e.target.value,
              device_name: dev?.deviceName || '',
            }))
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">選択してください</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.deviceName} ({d.remoteType || d.deviceType})
            </option>
          ))}
        </select>
      </div>

      {form.device_id && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">コマンド</label>
          <select
            value={form.command}
            onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="turnOn">電源 ON</option>
            <option value="turnOff">電源 OFF</option>
            {isAircon() && <option value="setAll">詳細設定 (setAll)</option>}
          </select>
        </div>
      )}

      {isAircon() && form.command === 'setAll' && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 w-16">温度</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, temperature: Math.max(16, f.temperature - 1) }))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold"
            >
              −
            </button>
            <span className="text-xl font-bold text-blue-600 w-16 text-center">{form.temperature}°C</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, temperature: Math.min(30, f.temperature + 1) }))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold"
            >
              ＋
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 w-16">モード</span>
            {AIRCON_MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, ac_mode: m.value }))}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  form.ac_mode === m.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 w-16">風量</span>
            {FAN_SPEEDS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, fan_speed: f.value }))}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  form.fan_speed === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          {loading ? '保存中...' : '保存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
