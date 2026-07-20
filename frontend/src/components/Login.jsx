import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser, googleSignIn } from '../services/authService';
import { supabase } from '../../supabaseClient';
import imgLogin from '../assets/imagen_login.jpeg';
import icono from '../assets/icono_sistema.png';
import { Mail, Lock , Eye, EyeOff} from 'lucide-react'; // iconos de correo y contraseña

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [sessionAlertVisible, setSessionAlertVisible] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [mantenerSesion, setMantenerSesion] = useState(false);

  useEffect(() => {
    const sessionParam = new URLSearchParams(location.search).get('sessionExpired');
    const sessionMessage = location.state?.message || (sessionParam === '1' ? 'Sesión expirada. Inicia sesión nuevamente.' : '');

    if (sessionMessage) {
      setMensaje({ texto: sessionMessage, tipo: 'error' });
      setSessionAlertVisible(true);
    }
  }, [location.search, location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });
    const { email, password } = Object.fromEntries(new FormData(e.target));

    if (!email || !password) {
      setMensaje({ texto: 'Ingrese correo y contraseña.', tipo: 'error' });
      return;
    }

    // Allow non-institutional emails (visitors can log in with email/password)

    try {
      const data = await loginUser(email, password);
      if (data?.token && data?.uid) {
        localStorage.setItem('uid', data.uid);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', (data.role || 'visitante').toLowerCase());
        if (data.phone) {
          localStorage.setItem('phone', data.phone);
        } else {
          localStorage.removeItem('phone');
        }
        localStorage.setItem('email', data.email || email);
        localStorage.setItem('name', data.name || '');
        if (data.avatar_url) {
          localStorage.setItem('avatar_url', data.avatar_url);
        } else {
          localStorage.removeItem('avatar_url');
        }
        if (data.avatar_url) {
          localStorage.setItem('avatar_url', data.avatar_url);
        } else {
          localStorage.removeItem('avatar_url');
        }

        const mensajeBienvenida = data.sessionMessage
          ? `${data.message} ${data.sessionMessage}`
          : data.message;

        setMensaje({ texto: mensajeBienvenida || '¡Bienvenido!', tipo: 'success' });
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setMensaje({ texto: data?.message || 'Error en la respuesta del servidor.', tipo: 'error' });
      }
    } catch (error) {
      console.error('Error en el login:', error);
      const mensajeError = error?.response?.data?.message || error?.message || 'Correo o contraseña incorrectos';
      setMensaje({ texto: mensajeError, tipo: 'error' });
    }
  };

  const handleGoogleLogin = async () => {
    setMensaje({ texto: 'Redirigiendo a Google...', tipo: 'success' });
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Error Google OAuth:', err);
      setMensaje({ texto: err?.message || 'No se pudo iniciar sesión con Google.', tipo: 'error' });
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        try {
          const accessToken = session.access_token;
          const googleData = await googleSignIn(accessToken);
          if (googleData?.uid) {
            localStorage.setItem('uid', googleData.uid);
            localStorage.setItem('token', accessToken);
            localStorage.setItem('role', (googleData.role || 'visitante').toLowerCase());
            localStorage.setItem('email', googleData.email || '');
            localStorage.setItem('name', googleData.name || '');
            if (googleData.avatar_url) {
              localStorage.setItem('avatar_url', googleData.avatar_url);
            } else {
              localStorage.removeItem('avatar_url');
            }
            setMensaje({ texto: googleData.message || 'Bienvenido', tipo: 'success' });
            setTimeout(() => navigate('/dashboard'), 800);
          }
        } catch (err) {
          console.error('Error al finalizar Google login (onAuthStateChange):', err);
          setMensaje({ texto: err?.response?.data?.message || 'Error al completar inicio con Google.', tipo: 'error' });
        }
      }
    });

    return () => {
      try { listener?.subscription?.unsubscribe?.(); } catch {}
      try { if (listener && typeof listener?.unsubscribe === 'function') listener.unsubscribe(); } catch {}
    };
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-auto">
      {/* Panel izquierdo: formulario */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 md:px-16 py-8 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto flex flex-col gap-3">

          <Link to="/" className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-white border border-neutral-border flex items-center justify-center">
              <img src={icono} alt="SWES" className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-brand-500">SWES</span>
          </Link>

          <div className="mb-1">
            <h2 className="text-2xl font-bold text-neutral-text leading-tight">¡Hola, emprendedor!</h2>
            <p className="text-sm text-neutral-muted mt-1">Tu próximo emprendimiento comienza con un solo paso.</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-neutral-border bg-white hover:bg-gray-50 py-2.5 rounded-btn font-medium flex items-center justify-center gap-2 transition text-sm text-neutral-text"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.66z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3a7.4 7.4 0 0 1-11-3.9H1.07v3.09A12 12 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M5.05 14.19a7.2 7.2 0 0 1 0-4.38V6.72H1.07a12 12 0 0 0 0 10.56z"/>
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.07 6.72l3.98 3.09A7.16 7.16 0 0 1 12 4.77z"/>
            </svg>
            Google
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-neutral-border" />
            <span className="text-xs text-neutral-muted whitespace-nowrap">O continúa con tu correo electrónico</span>
            <div className="flex-1 h-px bg-neutral-border" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-text">Correo electrónico</label>
              <div className="flex items-center border border-neutral-border rounded-input px-3 gap-2 bg-white focus-within:border-brand-primary focus-within:shadow-input transition-all">
                <Mail className="w-4 h-4 text-neutral-muted shrink-0" />

                <input name="email" type="email" placeholder="usuario@epn.edu.ec" required className="flex-1 py-2.5 text-sm text-neutral-text placeholder:text-neutral-muted outline-none bg-transparent" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-text">Contraseña</label>
                <Link to="/forgot-password" className="text-xs text-neutral-muted hover:text-brand-primary transition-colors">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="flex items-center border border-neutral-border rounded-input px-3 gap-2 bg-white focus-within:border-brand-primary focus-within:shadow-input transition-all">
                <Lock className="w-4 h-4 text-neutral-muted shrink-0" />
                <input name="password" type={verPassword ? 'text' : 'password'} placeholder="••••••••" required className="flex-1 py-2.5 text-sm text-neutral-text placeholder:text-neutral-muted outline-none bg-transparent" />
                <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="text-neutral-muted hover:text-neutral-text transition-colors focus:outline-none shrink-0"
                >{verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mantenerSesion}
                onChange={() => setMantenerSesion(!mantenerSesion)}
                className="w-4 h-4 rounded border-neutral-border accent-brand-primary"
              />
              Mantener sesión iniciada
            </label>

            {mensaje.texto && (
              <div className={`text-sm px-4 py-3 rounded-xl text-center font-medium ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                {mensaje.texto}
              </div>
            )}

            <button type="submit" className="w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold py-3 rounded-btn text-sm transition-all">Iniciar Sesión</button>
          </form>

          <p className="text-center text-sm text-neutral-muted">¿No tienes una cuenta? <Link to="/register" className="text-brand-accent font-semibold">Regístrate gratis</Link></p>
          <p className="text-center text-xs text-neutral-subtle">© 2026 Escuela Politécnica Nacional</p>
        </div>
      </div>

      {/* Panel derecho: imagen */}
      <div className="hidden md:block w-1/2 relative bg-brand-panel">
        <img src={imgLogin} alt="SWES" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {sessionAlertVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-black-700">Sesión expirada</h2>
            <p className="mt-3 text-sm text-gray-600">Tu sesión ha caducado. Debes iniciar sesión nuevamente para continuar.</p>
            <button
              type="button"
              onClick={() => {
                setSessionAlertVisible(false);
                navigate('/login', { replace: true, state: {} });
              }}
              className="mt-6 w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
