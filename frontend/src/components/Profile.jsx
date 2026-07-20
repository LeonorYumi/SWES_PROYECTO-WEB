import { useEffect, useState } from 'react';
import { FiUser, FiMail, FiShield, FiAward, FiEdit2, FiX } from 'react-icons/fi';
import ProfileEditor from './ProfileEditor';

function Profile() {
  const [username, setUsername] = useState('Usuario');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('visitante');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUsername(localStorage.getItem('name') || 'Usuario');
      setEmail(localStorage.getItem('email') || '');
      setRole(localStorage.getItem('role') || 'visitante');
    }
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12 flex justify-center">

      <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-3xl p-5 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">

        {/* HEADER DEL PERFIL */}
        <div className="mb-6 sm:mb-8 border-b border-gray-100 pb-5 sm:pb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-medium text-gray-950 tracking-tight">Mi perfil</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Revisa tu información personal de tu cuenta en SWES. 
            </p>
          </div>
          
        </div>

        {/* CONTENEDOR DE CAMPOS */}
        <div className="grid gap-4 sm:gap-5">

          {/* NOMBRE DE USUARIO */}
          <div className="rounded-2xl border border-gray-100/70 bg-gray-50/50 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:bg-gray-50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 text-blue-900 shadow-3xs shrink-0">
              <FiUser className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <p className="text-4xs sm:text-[13px] font-medium uppercase tracking-wider text-gray-500">Nombre de usuario</p>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-base font-medium text-gray-950">{username}</p>
            </div>
          </div>

          {/* CORREO */}
          <div className="rounded-2xl border border-gray-100/70 bg-gray-50/50 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:bg-gray-50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 text-blue-900 shadow-3xs shrink-0">
              <FiMail className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="w-full min-w-0">
              <p className="text-4xs sm:text-[13px] font-medium uppercase tracking-wider text-gray-500">Correo Electrónico</p>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-base font-medium text-gray-950 break-words">{email}</p>
            </div>
          </div>

          {/* ROL */}
          <div className="rounded-2xl border border-gray-100/70 bg-gray-50/50 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:bg-gray-50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 text-blue-900 shadow-3xs shrink-0">
              <FiShield className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <p className="text-4xs sm:text-[13px] font-medium uppercase tracking-wider text-gray-500">Rol asignado</p>
              <span className="mt-0.5 sm:mt-1 text-sm sm:text-base font-medium text-gray-950 break-words">
                {role}
              </span>
            </div>
          </div>

          {/* INSTITUCIÓN */}
          <div className="rounded-2xl border border-gray-100/70 bg-gray-50/50 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:bg-gray-50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 text-blue-900 shadow-3xs shrink-0">
              <FiAward className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <p className="text-4xs sm:text-[13px] font-medium uppercase tracking-wider text-gray-500">Institución</p>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-base font-medium text-gray-950 break-words">
                Escuela Politécnica Nacional
              </p>
            </div>
          </div>

          {/* BOTÓN EDITAR PERFIL */}
          
          <div className="mt-6 flex justify-end">
            <button
            onClick={() => setShowEditor(true)}
            className="inline-flex w-auto items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors duration-200 shadow-sm"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              Editar perfil
            </button>
          </div>

        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
      {showEditor && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
    <div
      className="absolute inset-0 bg-black/60"
      onClick={() => setShowEditor(false)}
    ></div>

    <div className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8">
      <button
        onClick={() => setShowEditor(false)}
        aria-label="Cerrar"
        className="absolute top-5 right-5 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
      <ProfileEditor />
    </div>
  </div>
)}

    </div>
  );
}

export default Profile;