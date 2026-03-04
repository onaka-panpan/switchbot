import { useEffect, useState } from 'react'
import AirconPanel from '../components/AirconPanel'
import TvPanel from '../components/TvPanel'
import client from '../api/client'

export default function Home() {
  const [devices, setDevices] = useState([])
  const [hubStatus, setHubStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/devices')
      .then((res) => {
        const body = res.data.body || {}
        const allDevices = [
          ...(body.deviceList || []),
          ...(body.infraredRemoteList || []),
        ]
        setDevices(allDevices)
        const hub = allDevices.find((d) => d.deviceType === 'Hub Mini')
        setHubStatus(hub ? hub.hubDeviceId : null)
      })
      .catch(() => setError('デバイス情報の取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  const aircons = devices.filter((d) => d.remoteType === 'Air Conditioner')
  const tvs = devices.filter((d) => d.remoteType === 'TV')

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">ホーム</h1>

      {/* Hub Status */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-600">Hub Mini:</span>
        {loading ? (
          <span className="text-sm text-gray-400">取得中...</span>
        ) : hubStatus ? (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            オンライン
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            未検出
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm">
          {error}
          <p className="text-gray-500 text-xs mt-1">
            API トークンが設定されているか「プロフィール」画面で確認してください
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">デバイス情報を取得中...</div>
      ) : (
        <div className="space-y-4">
          {aircons.map((d) => (
            <AirconPanel key={d.deviceId} deviceId={d.deviceId} deviceName={d.deviceName} />
          ))}
          {tvs.map((d) => (
            <TvPanel key={d.deviceId} deviceId={d.deviceId} deviceName={d.deviceName} />
          ))}
          {!error && aircons.length === 0 && tvs.length === 0 && (
            <p className="text-gray-500 text-sm">
              エアコン・テレビが見つかりませんでした。Hub Mini に登録されているか確認してください。
            </p>
          )}
        </div>
      )}
    </div>
  )
}
