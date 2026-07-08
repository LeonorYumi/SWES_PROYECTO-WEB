import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { checkActiveSession } from "../services/authService";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [isValidSession, setIsValidSession] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'visitante').toLowerCase() : 'visitante';

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsValidSession(false);
        return;
      }

      try {
        const result = await checkActiveSession();
        if (result?.active) {
          setIsValidSession(true);
          return;
        }

        localStorage.removeItem('token');
        localStorage.removeItem('uid');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        setIsValidSession(false);
      } catch (err) {
        console.warn('Error verificando sesión activa:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('uid');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        setIsValidSession(false);
      }
    };

    verifySession();
  }, [token]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isValidSession === false) {
    return <Navigate to="/login?sessionExpired=1" replace />;
  }

  if (isValidSession === null) {
    return <div className="flex items-center justify-center h-full text-neutral-muted">Verificando sesión...</div>;
  }

  // Solo admin puede acceder a usuarios y estadísticas
  const adminOnlyPaths = ['/admin/users', '/admin/stats'];
  const isAdminOnly = adminOnlyPaths.some((path) => location.pathname.startsWith(path));
  if (isAdminOnly && role !== 'administrador') {
    return <Navigate to="/dashboard" replace />;
  }

  // Visitantes no pueden acceder a nada de /admin
  if (role === 'visitante' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Emprendedor puede acceder a /admin/products (crear, editar, ver sus productos)
  // Admin puede acceder a todo

  return children;
}

export default ProtectedRoute;