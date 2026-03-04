import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [tokenMsg, setTokenMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  useEffect(() => {
    client.get('/settings/profile').then((res) => setProfile(res.data))
  }, [])

  async function handleTokenUpdate(e) {
    e.preventDefault()
    setTokenMsg('')
    try {
      await client.put('/settings/token', {
        switchbot_token: token,
        switchbot_secret: secret,
      })
      setTokenMsg('更新しました')
      setToken('')
      setSecret('')
      const res = await client.get('/settings/profile')
      setProfile(res.data)
    } catch {
      setTokenMsg('更新に失敗しました')
    }
    setTimeout(() => setTokenMsg(''), 3000)
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPasswordMsg('')
    try {
      await client.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPasswordMsg('パスワードを変更しました')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordMsg(
        err.response?.data?.detail || 'パスワード変更に失敗しました'
      )
    }
    setTimeout(() => setPasswordMsg(''), 3000)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">プロフィール</h1>

      {/* SwitchBot API 情報 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">SwitchBot API 情報</h2>
        {profile ? (
          <div className="space-y-2 mb-5">
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-32">API トークン</span>
              <span className="font-mono text-gray-700">{profile.token_masked}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-32">デバイス数</span>
              <span className="text-gray-700">
                {profile.device_count !== null ? `${profile.device_count} 台` : '取得失敗'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">読み込み中...</p>
        )}

        <form onSubmit={handleTokenUpdate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しい API トークン
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="API Token"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しい API シークレット
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="API Secret"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              更新
            </button>
            {tokenMsg && (
              <span className="text-sm text-green-600">{tokenMsg}</span>
            )}
          </div>
        </form>
      </div>

      {/* パスワード変更 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">パスワード変更</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={4}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              変更
            </button>
            {passwordMsg && (
              <span className="text-sm text-green-600">{passwordMsg}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
