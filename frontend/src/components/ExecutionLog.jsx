function formatAction(action) {
  if (!action) return ''
  const cmd = action.command
  if (cmd === 'turnOn') return '電源 ON'
  if (cmd === 'turnOff') return '電源 OFF'
  if (cmd === 'setAll') return `setAll (${action.parameter})`
  return cmd
}

export default function ExecutionLog({ logs }) {
  if (logs.length === 0) {
    return <p className="text-gray-500 text-sm py-4">実行履歴がありません</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-2 pr-4 font-medium text-gray-600">日時</th>
            <th className="pb-2 pr-4 font-medium text-gray-600">デバイス</th>
            <th className="pb-2 pr-4 font-medium text-gray-600">アクション</th>
            <th className="pb-2 font-medium text-gray-600">結果</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                {new Date(log.executed_at).toLocaleString('ja-JP')}
              </td>
              <td className="py-2 pr-4 text-gray-700">{log.device_name}</td>
              <td className="py-2 pr-4 text-gray-700">{formatAction(log.action_json)}</td>
              <td className="py-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    log.status === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {log.status === 'success' ? '成功' : '失敗'}
                </span>
                {log.error_message && (
                  <span className="text-red-500 text-xs ml-2">{log.error_message}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
