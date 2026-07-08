import { useEffect, useState } from 'react';
import { FiUser, FiMail, FiShield, FiAward } from 'react-icons/fi';
import ProfileEditor from './ProfileEditor';

function Profile() {
  const [username, setUsername] = useState('Usuario');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('visitante');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUsername(localStorage.getItem('name') || 'Usuario');
      setEmail(localStorage.getItem('email') || '');
      setRole(localStorage.getItem('role') || 'visitante');
    }
  }, []);

  return (
    // CONTENEDOR PADRE: Ajustamos px-4 para que en celular nunca se pegue a los bordes de la pantalla
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12 flex justify-center">
      
      {/* TARJETA PRINCIPAL: py-6 en móvil y py-10 en escritorio para un espaciado balanceado */}
      <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-3xl p-5 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        
        {/* HEADER DEL PERFIL */}
        <div className="mb-6 sm:mb-8 border-b border-gray-100 pb-5 sm:pb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">Mi perfil</h2>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
            Revisa tu información personal y de cuenta dentro del sistema.
          </p>
        </div>

        {/* CONTENEDOR DE CAMPOS */}
        <div className="grid gap-4 sm:gap-5">
          
          {/* NOMBRE DE USUARIO */}
          <div className="rounded-2xl border border-gray-100/70 bg-gray-50/50 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:bg-gray-50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 text-blue-900 shadow-3xs shrink-0">
              <FiUser className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <p className="text-3xs sm:text-xs font-bold uppercase tracking-wider text-gray-400">Nombre de usuario</p>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-base font-semibold text-gray-950">{username}</p>
            </div>
          </div>

          {/* CORREO */}
          <div className="rounded-2xl border border-gray-100/70 bg-gray-50/50 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:bg-gray-50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 text-blue-900 shadow-3xs shrink-0">
              <FiMail className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="w-full min-w-0">
              <p className="text-3xs sm:text-xs font-bold uppercase tracking-wider text-gray-400">Correo Electrónico</p>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-base font-semibold text-gray-950 break-words">{email}</p>
              <p className="mt-1 text-3xs sm:text-2xs font-medium text-gray-400">El correo no puede cambiarse desde aquí.</p>
            </div>
          </div>

          {/* ROL */}
          <div className="rounded-2xl border border-gray-100/70 bg-gray-50/50 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:bg-gray-50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 text-blue-900 shadow-3xs shrink-0">
              <FiShield className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <p className="text-3xs sm:text-xs font-bold uppercase tracking-wider text-gray-400">Rol asignado</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs sm:text-xs font-bold tracking-tight uppercase bg-blue-50 text-blue-900 border border-blue-100/50 mt-1 sm:mt-1.5">
                {role}
              </span>
              <p className="mt-1.5 text-3xs sm:text-2xs font-medium text-gray-400">No se puede cambiar el rol asignado desde aquí.</p>
            </div>
          </div>

          {/* INSTITUCIÓN */}
          <div className="rounded-2xl border border-gray-100/70 bg-gray-50/50 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:bg-gray-50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 text-blue-900 shadow-3xs shrink-0">
              <FiAward className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <p className="text-3xs sm:text-xs font-bold uppercase tracking-wider text-gray-400">Institución</p>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-base font-bold text-blue-900">Escuela Politécnica Nacional</p>
            </div>
          </div>

        </div>
      </div>
      <ProfileEditor />
    </div>
  );
}

export default Profile;