
export default function RegisterPage() {
  return(
  <div>
    <h1 className="text-2xl m-5 font-bold italic">
      Register Page 
      </h1>
      <hr />
      <form>
        <div className="flex max-w-sm min-w-200px m-3">
          <p className="mr-5 ml-5">Nombre Completo</p>
          <input type="text" placeholder="Nombre Completo" />
        </div>
        <div className="flex max-w-sm min-w-200px m-3">
          <p className="mr-5 ml-5">Correo Electrónico</p>
          <input type="text" placeholder="Correo@ejemplo.com" />
        </div>
        <div className="flex max-w-sm min-w-200px m-3">
          <p className="mr-18 ml-5">Contraseña</p>
          <input type="text" placeholder="Contraseña" />
        </div>
        <div className="flex max-w-sm min-w-200px m-3">
          <p className="mr-5 ml-4">Confirmar Contraseña</p>
          <input type="text" placeholder="Confirmar Contraseña" />
        </div>
    </form>
  </div>
  )
}