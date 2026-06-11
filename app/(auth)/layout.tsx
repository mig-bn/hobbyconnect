export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4 text-3xl">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HobbyConnect</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Conecta con tu pasión en Barranquilla
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7">
          {children}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Al continuar aceptas nuestros términos y política de privacidad
        </p>
      </div>
    </div>
  )
}
