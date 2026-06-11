import { Suspense } from 'react'
import LoginForm from '@/components/Auth/LoginForm'

export const metadata = {
  title: 'Iniciar sesión — HobbyConnect',
}

export default function LoginPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Bienvenido de vuelta</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ingresa a tu cuenta para continuar
        </p>
      </div>
      {/* Suspense required because LoginForm uses useSearchParams */}
      <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-xl" />}>
        <LoginForm />
      </Suspense>
    </>
  )
}
