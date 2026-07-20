import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { forgotPassword, resetPasswordWithCode } from '../services/authService';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [alerta, setAlerta] = useState({ mostrar: false, texto: '', tipo: '' });
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showTokenBox, setShowTokenBox] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setAlerta({ mostrar: false, texto: '', tipo: '' });
    setLoading(true);
    setPreviewUrl('');
    setShowTokenBox(false);

    try {
      const data = await forgotPassword(email.trim());
      setEmailSent(true);
      setResetToken(data.resetToken || '');
      setPreviewUrl(data.previewUrl || '');
      setAlerta({
        mostrar: true,
        texto: data.message || 'Código enviado. Presiona “Obtener token” para ver tu código.',
        tipo: 'success'
      });
    } catch (error) {
      console.error('Error en recuperación de contraseña:', error);
      setAlerta({
        mostrar: true,
        texto: error.response?.data?.message || error.message || 'Ocurrió un inconveniente al procesar la solicitud de recuperación.',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAlerta({ mostrar: false, texto: '', tipo: '' });
    setLoading(true);

    try {
      const data = await resetPasswordWithCode(email.trim(), code.trim(), newPassword);
      setAlerta({
        mostrar: true,
        texto: data.message || 'Contraseña actualizada correctamente.',
        tipo: 'success'
      });
      setEmailSent(false);
      setCode("");
      setNewPassword("");
      setResetToken('');
      setShowTokenBox(false);
      // redirect to login after a short delay
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      console.error('Error al restablecer contraseña por código:', error);
      setAlerta({
        mostrar: true,
        texto: error.response?.data?.message || error.message || 'Ocurrió un error al cambiar la contraseña.',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 py-8">
      <div className="w-full max-w-xl flex flex-col gap-5 bg-white rounded-[28px] px-7 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.12)] border border-slate-200 overflow-hidden">

        {/* Encabezado */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            Recuperar contraseña
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {!emailSent
              ? 'Introduce tu correo para recibir el código de recuperación por correo.'
              : 'Ya se envió un código. Completa email, código y nueva contraseña para cambiarla.'}
          </p>
        </div>

        {/* ALERTA VISUAL*/}
        {alerta.mostrar && (
          <div className={`border-l-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 ${
            alerta.tipo === 'error' 
              ? 'bg-red-50 border-red-500 text-red-700' 
              : 'bg-green-50 border-green-500 text-green-700'
          }`}>
            <span>{alerta.tipo === 'error' ? '⚠️' : '✅'}</span>
            <p>{alerta.texto}</p>
          </div>
        )}

        {/* Formulario*/}
        {!emailSent ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Correo electrónico</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 bg-white
                              focus-within:border-blue-900 focus-within:ring-2 focus-within:ring-blue-900/10 transition-all">
                <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
                </svg>
                <input
                  type="email"
                  placeholder="usuario@epn.edu.ec"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="flex-1 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 outline-none bg-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-950 disabled:bg-gray-300 text-white font-semibold
                         py-3 rounded-xl text-sm transition-all"
            >
              {loading ? 'Enviando código...' : 'Enviar código de recuperación'}
            </button>
          </form>

        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Correo electrónico</label>
              <input
                type="email"
                placeholder="usuario@epn.edu.ec"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Código de verificación</label>
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Nueva contraseña</label>
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowTokenBox(true)}
              disabled={!resetToken}
              className="w-full rounded-xl bg-blue-900 text-white py-3 text-sm font-semibold transition hover:bg-blue-950 disabled:bg-slate-300"
            >
              Obtener token
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 text-white py-3 text-sm font-semibold transition hover:bg-emerald-700 disabled:bg-slate-300"
            >
              {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>

            <p className="text-center text-xs text-slate-500 mt-2">
              Si ya copiaste el token, ingresa el código y tu nueva contraseña para completar la recuperación.
            </p>

            {previewUrl && (
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700 border border-gray-200 break-words">
                <p className="font-semibold">Vista de correo de desarrollo:</p>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  Abrir correo de prueba
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
                setCode("");
                setNewPassword("");
                setPreviewUrl('');
                setResetToken('');
                setShowTokenBox(false);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
            >
              Enviar otro código
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-500 mt-1">© 2026 Escuela Politécnica Nacional</p>

      </div>

      {resetToken && showTokenBox && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-700 bg-slate-950 p-6 shadow-2xl shadow-slate-950/40 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Token de recuperación</p>
                <h2 className="mt-2 text-xl font-semibold">Copia tu código</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTokenBox(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-900 p-6 text-center text-[2rem] font-semibold tracking-[0.32em] text-slate-100">
              {resetToken}
            </div>

            <div className="mt-5 rounded-3xl bg-slate-800/90 p-4 text-sm text-slate-300">
              <p className="font-semibold text-slate-100">¿Qué sigue?</p>
              <p className="mt-2 text-slate-400">Cierra esta ventana, pega el código en “Código de verificación” y crea tu nueva contraseña.</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resetToken);
                  setAlerta({ mostrar: true, texto: 'Token copiado al portapapeles', tipo: 'success' });
                }}
                className="rounded-full bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Copiar token
              </button>
              <button
                type="button"
                onClick={() => setShowTokenBox(false)}
                className="rounded-full border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForgotPassword;
