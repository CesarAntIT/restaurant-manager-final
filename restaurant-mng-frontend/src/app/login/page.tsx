export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl m-5 font-bold italic">
        Login Page
      </h1>
      <form>
        <div className="flex max-w-sm min-w-200px m-3">
          <p className="mr-5 ml-5">Correo Electrónico</p>
          <input type="text" placeholder="Correo@ejemplo.com" />
        </div>
        <div className="flex max-w-sm min-w-200px m-3">
          <p className="mr-18 ml-5">Contraseña</p>
          <input type="text" placeholder="Contraseña" />
        </div>
      </form>
    </div>
  )
}