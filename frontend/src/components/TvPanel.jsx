import { useState } from 'react'
import client from '../api/client'

const CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function TvPanel({ deviceId, deviceName }) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">テレビ</h2>
        <span className="text-sm text-gray-500">{deviceName}</span>
      </div>

      {/* 電源 */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => sendCommand('turnOn')}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          電源 ON
        </button>
        <button
          onClick={() => sendCommand('turnOff')}
          disabled={loading}
          className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          電源 OFF
        </button>
      </div>

      {/* チャンネル */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">チャンネル</p>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => sendCommand('channelSub')}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
          >
            CH −
          </button>
          <button
            onClick={() => sendCommand('channelAdd')}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
          >
            CH ＋
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => sendCommand('SetChannel', String(ch))}
              disabled={loading}
              className="bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 text-sm font-medium py-1.5 rounded transition-colors"
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* 音量 */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">音量</p>
        <div className="flex gap-2">
          <button
            onClick={() => sendCommand('volumeSub')}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
          >
            音量 −
          </button>
          <button
            onClick={() => sendCommand('setMute')}
            disabled={loading}
            className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-medium py-2 rounded-lg transition-colors"
          >
            ミュート
          </button>
          <button
            onClick={() => sendCommand('volumeAdd')}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
          >
            音量 ＋
          </button>
        </div>
      </div>

      {/* その他 */}
      <div className="flex gap-2">
        <button
          onClick={() => sendCommand('InputSwitching')}
          disabled={loading}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          入力切替
        </button>
        <button
          onClick={() => sendCommand('Guide')}
          disabled={loading}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          番組表
        </button>
      </div>

      {message && <p className="text-sm text-green-600 mt-3">{message}</p>}
    </div>
  )
}
