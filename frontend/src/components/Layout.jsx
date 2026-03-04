import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'ホーム' },
  { to: '/automation', label: 'オートメーション' },
  { to: '/profile', label: 'プロフィール' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-800 text-lg">SwitchBot Controller</span>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${
                  location.pathname === item.to
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-red-500 px-3 py-1 rounded-md transition-colors"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
