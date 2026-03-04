import { useEffect, useState } from 'react'
import ExecutionLog from '../components/ExecutionLog'
import ScheduleForm from '../components/ScheduleForm'
import ScheduleList from '../components/ScheduleList'
import client from '../api/client'

export default function Automation() {
  const [schedules, setSchedules] = useState([])
  const [logs, setLogs] = useState([])
  const [devices, setDevices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [tab, setTab] = useState('schedules')

  async function loadSchedules() {
    const res = await client.get('/schedules')
    setSchedules(res.data)
  }

  async function loadLogs() {
    const res = await client.get('/logs')
    setLogs(res.data)
  }

  async function loadDevices() {
    try {
      const res = await client.get('/devices')
      const body = res.data.body || {}
      setDevices([...(body.deviceList || []), ...(body.infraredRemoteList || [])])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadSchedules()
    loadLogs()
    loadDevices()
  }, [])

  function handleEdit(schedule) {
    setEditTarget(schedule)
    setShowForm(true)
  }

  function handleNew() {
    setEditTarget(null)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    setEditTarget(null)
    loadSchedules()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">オートメーション</h1>
        {!showForm && (
          <button
            onClick={handleNew}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            ＋ スケジュール追加
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {editTarget ? 'スケジュール編集' : 'スケジュール追加'}
          </h2>
          <ScheduleForm
            initial={editTarget}
            devices={devices}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false)
              setEditTarget(null)
            }}
          />
        </div>
      )}

      <div className="flex border-b border-gray-200 mb-4">
        {['schedules', 'logs'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              if (t === 'logs') loadLogs()
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'schedules' ? 'スケジュール一覧' : '実行履歴'}
          </button>
        ))}
      </div>

      {tab === 'schedules' ? (
        <ScheduleList
          schedules={schedules}
          onEdit={handleEdit}
          onRefresh={loadSchedules}
        />
      ) : (
        <ExecutionLog logs={logs} />
      )}
    </div>
  )
}
