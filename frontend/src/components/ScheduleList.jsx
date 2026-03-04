import client from '../api/client'

const DAY_LABELS = { mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日' }

function formatDays(daysStr) {
  if (!daysStr) return ''
  return daysStr
    .split(',')
    .map((d) => DAY_LABELS[d.trim()] || d)
    .join('・')
}

function formatAction(action) {
  if (!action) return ''
  const cmd = action.command
  if (cmd === 'turnOn') return '電源 ON'
  if (cmd === 'turnOff') return '電源 OFF'
  if (cmd === 'setAll') return `setAll (${action.parameter})`
  return cmd
}

export default function ScheduleList({ schedules, onEdit, onRefresh }) {
  async function handleToggle(id) {
    await client.patch(`/schedules/${id}/toggle`)
    onRefresh()
  }

  async function handleDelete(id) {
    if (!confirm('このスケジュールを削除しますか？')) return
    await client.delete(`/schedules/${id}`)
    onRefresh()
  }

  if (schedules.length === 0) {
    return <p className="text-gray-500 text-sm py-4">スケジュールが登録されていません</p>
  }

  return (
    <div className="space-y-3">
      {schedules.map((s) => (
        <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800 truncate">{s.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.is_enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s.is_enabled ? '有効' : '無効'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {s.schedule_type === 'recurring'
                  ? `毎週 ${formatDays(s.days_of_week)} ${s.execute_time}`
                  : `${s.execute_date} ${s.execute_time}（一回限り）`}
              </p>
              <p className="text-sm text-gray-500">
                {s.device_name} → {formatAction(s.action_json)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggle(s.id)}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                  s.is_enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    s.is_enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <button
                onClick={() => onEdit(s)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                編集
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
