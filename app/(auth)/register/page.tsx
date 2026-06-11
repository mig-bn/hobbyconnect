import RegisterForm from '@/components/Auth/RegisterForm'

export const metadata = {
  title: 'Crear cuenta — HobbyConnect',
}

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Crea tu cuenta</h2>
        <p className="text-sm text-gray-500 mt-1">
          Únete a la comunidad en Barranquilla
        </p>
      </div>
      <RegisterForm />
    </>
  )
}
