import { useEffect, useState } from 'react';
import { changePassword } from '../services/authService';

function Settings() {
  const [alerta, setAlerta] = useState({ mostrar: false, texto: '', tipo: '' });
  const [loading, setLoading] = useState(false);

  // Estados para cambio de contraseña
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordNuevaConfirm, setPasswordNuevaConfirm] = useState('');
  const [erroresPassword, setErroresPassword] = useState({});

  const validarPassword = () => {
    const errores = {};

    if (!passwordActual.trim()) {
      errores.passwordActual = 'La contraseña actual es obligatoria';
    }

    if (!passwordNueva.trim()) {
      errores.passwordNueva = 'La nueva contraseña es obligatoria';
    } else if (passwordNueva.length < 6) {
      errores.passwordNueva = 'Mínimo 6 caracteres';
    }

    if (!passwordNuevaConfirm.trim()) {
      errores.passwordNuevaConfirm = 'Confirma la nueva contraseña';
    } else if (passwordNueva !== passwordNuevaConfirm) {
      errores.passwordNuevaConfirm = 'Las contraseñas no coinciden';
    }

    if (passwordActual === passwordNueva) {
      errores.passwordNueva = 'La nueva contraseña debe ser diferente';
    }

    setErroresPassword(errores);
    return Object.keys(errores).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!validarPassword()) return;

    setLoading(true);
    setAlerta({ mostrar: false, texto: '', tipo: '' });

    try {
      const data = await changePassword(passwordNueva);
      setAlerta({
        mostrar: true,
        texto: data.message || 'Contraseña cambiada correctamente',
        tipo: 'success'
      });

      setPasswordActual('');
      setPasswordNueva('');
      setPasswordNuevaConfirm('');
      setMostrarFormulario(false);
      setErroresPassword({});
    } catch (error) {
      console.error(error);
      setAlerta({
        mostrar: true,
        texto: error.response?.data?.message || error.message || 'No se pudo cambiar la contraseña',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // El px-4 evita que en pantallas móviles el contenedor toque los bordes físicos del celular
    <div className="w-full max-w-2xl mx-auto my-6 sm:my-12 px-4 sm:px-0">
      
      {/* Contenedor Principal Plano */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white text-slate-800 border border-gray-100 shadow-sm">
        
        {/* Cabecera limpia sin cajas de degradados */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Configuración</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Seguridad de la cuenta</h2>
            <p className="text-sm text-slate-500">
              Cambia tu contraseña de forma segura para mantener tu cuenta protegida.
            </p>
          </div>
        </div>

        {/* Sección de la credencial */}
        <section className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Contraseña</h3>
            <p className="text-sm text-slate-500 mt-0.5">Actualiza tus credenciales de acceso.</p>
          </div>

          {!mostrarFormulario ? (
            <button
              type="button"
              onClick={() => setMostrarFormulario(true)}
              className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-6 py-3 text-xs font-medium uppercase tracking-wider text-white shadow-sm hover:bg-blue-800 transition-all duration-200"
            >
              Cambiar contraseña
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-5 mt-4">
              
              {/* Campo: Contraseña Actual */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contraseña Actual</label>
                <input
                  type="password"
                  placeholder="Tu contraseña actual"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-900/10 transition-all"
                />
                {erroresPassword.passwordActual && (
                  <p className="text-xs text-red-600 font-medium">{erroresPassword.passwordActual}</p>
                )}
              </div>

              {/* Campo: Nueva Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-900/10 transition-all"
                />
                {erroresPassword.passwordNueva && (
                  <p className="text-xs text-red-600 font-medium">{erroresPassword.passwordNueva}</p>
                )}
              </div>

              {/* Campo: Confirmar Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="Confirma la nueva contraseña"
                  value={passwordNuevaConfirm}
                  onChange={(e) => setPasswordNuevaConfirm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-900/10 transition-all"
                />
                {erroresPassword.passwordNuevaConfirm && (
                  <p className="text-xs text-red-600 font-medium">{erroresPassword.passwordNuevaConfirm}</p>
                )}
              </div>

              {/* Botones adaptativos: Se apilan ordenadamente en móvil gracias a flex-col-reverse */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setPasswordActual('');
                    setPasswordNueva('');
                    setPasswordNuevaConfirm('');
                    setErroresPassword({});
                  }}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-blue-900 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 text-center"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}

          {/* Bloque de Alertas limpio */}
          {alerta.mostrar && (
            <div className={`mt-4 rounded-xl p-3.5 text-sm font-medium border ${
              alerta.tipo === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {alerta.texto}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Settings;