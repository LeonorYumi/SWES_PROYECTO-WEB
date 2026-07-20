import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, Bell } from 'lucide-react'; // Se añade Bell
import logoSwes from '../assets/icono_sistema.png';
import { useCart } from '../context/CartContext';
import notificationService from '../services/notificationService';

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false); // Estado para el dropdown de notificaciones
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ Contador dinámico de mensajes no leídos
  
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null); // Ref para cerrar al hacer clic afuera
  
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();

  // Obtener ID del usuario actual desde localStorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem('uid') : null;

  // ✅ NUEVO: Estado para notificaciones dinámicas del chat
  const [notifications, setNotifications] = useState([]);

  const [username, setUsername] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem('name') || localStorage.getItem('displayName') || localStorage.getItem('email') || 'Usuario'
      : 'Usuario'
  );
  const [avatarUrl, setAvatarUrl] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('avatar_url') || '' : ''
  );
  const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'visitante').toLowerCase() : 'visitante';

  const handleLogout = () => {
    localStorage.removeItem('uid');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    localStorage.removeItem('phone');
    localStorage.removeItem('avatar_url');
    navigate('/login');
  };

  useEffect(() => {
    setUsername(localStorage.getItem('name') || localStorage.getItem('email') || 'Usuario');
    setAvatarUrl(localStorage.getItem('avatar_url') || '');

    const handleProfileUpdated = (event) => {
      const detail = event?.detail || {};
      if (detail.avatarUrl !== undefined) {
        setAvatarUrl(detail.avatarUrl || '');
      }
      if (detail.name !== undefined) {
        setUsername(detail.name || localStorage.getItem('name') || 'Usuario');
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, []);

  // Manejador de clics externos modificado para soportar ambos dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ✅ NUEVO: Polling automático para obtener el contador de mensajes no leídos
  useEffect(() => {
    if (!userId) return;

    // Función para actualizar el contador
    const updateUnreadCount = async () => {
      try {
        const data = await notificationService.getUnreadCount(userId);
        setUnreadCount(data.unreadCount || 0);

        // Si el backend devuelve detalles por sala, usamos esas entradas para crear notificaciones clicables
        if (Array.isArray(data.unreadRooms) && data.unreadRooms.length > 0) {
          const mapped = data.unreadRooms.map((r) => ({
            id: `room-${r.roomId}-${r.lastCreatedAt || Date.now()}`,
            text: `${r.unreadCount} mensaje${r.unreadCount > 1 ? 's' : ''} de ${r.lastSenderName || 'alguien'}: "${(r.lastMessage || '').slice(0, 60)}${(r.lastMessage||'').length>60? '...' : ''}"`,
            unread: true,
            type: 'chat',
            roomId: r.roomId,            lastSenderId: r.lastSenderId || r.lastSenderId || null,          }));
          setNotifications(mapped);
        } else if (data.unreadCount > 0) {
          setNotifications([
            {
              id: `unread-messages-${Date.now()}`,
              text: `Tienes ${data.unreadCount} mensaje${data.unreadCount > 1 ? 's' : ''} nuevo${data.unreadCount > 1 ? 's' : ''} en el chat`,
              unread: true,
              type: 'chat'
            }
          ]);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error al actualizar contador de notificaciones:', error);
      }
    };

    // Actualizar inmediatamente
    updateUnreadCount();

    // Hacer polling cada 3 segundos para mantener actualizado el contador
    const pollInterval = setInterval(updateUnreadCount, 3000);

    return () => clearInterval(pollInterval);
  }, [userId]);

  const links = [
    { to: '/dashboard', label: 'Tablero' },
    ...(role !== 'visitante' ? [{ to: '/admin/products', label: 'Emprendimientos' }] : []),
    ...(role === 'administrador' ? [
      { to: '/admin/stats', label: 'Estadísticas' },
      { to: '/admin/users', label: 'Usuarios' },
    ] : []),
  ];

  return (
    <nav className="bg-neutral-surface border-b border-neutral-border min-h-16 flex items-start pt-3 pb-5 px-4 md:px-8 relative z-[100] mt-2 mx-2 rounded-xl">
      <div className="w-full flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 select-none">
          <img src={logoSwes} alt="SWES" className="w-7 h-7 object-contain" />
          <span className="font-bold text-neutral-text text-xl">SWES</span>
          <span className="font-bold text-blue-900 text-xl">EPN</span>
        </Link>

        {/* CONTENEDOR DERECHO */}
        <div className="flex items-center gap-3 md:gap-6">

          {/* Links de Navegación - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-1.5 rounded-input text-sm font-medium transition-all
                    ${active
                      ? 'bg-brand-primary text-white'
                      : 'text-neutral-subtle hover:text-neutral-text hover:bg-neutral-bg'
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Icono de Notificaciones */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setDropdownOpen(false); // Cierra el del perfil por si acaso
              }}
              className="relative flex items-center justify-center w-9 h-9 rounded-input text-neutral-subtle hover:text-neutral-text hover:bg-neutral-bg transition-colors"
              aria-label="Ver notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animation-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Notificaciones */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                <div className="px-4 py-3 border-b border-neutral-border bg-neutral-bg/30 flex justify-between items-center">
                  <p className="text-xs font-bold text-neutral-text">Notificaciones de Chat</p>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => {
                        setUnreadCount(0);
                        setNotifications([]);
                      }} 
                      className="text-[11px] text-brand-primary hover:underline font-medium"
                    >
                      Marcar leído
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        onClick={() => {
                          if (notification.roomId) {
                            setNotificationsOpen(false);
                            const target = `/emprendimientos/${notification.roomId}${notification.lastSenderId ? `?chatWith=${encodeURIComponent(notification.lastSenderId)}` : ''}`;
                            navigate(target);
                          }
                        }}
                        role={notification.roomId ? 'button' : 'article'}
                        className={`px-4 py-3 text-xs transition-colors flex items-start gap-2 cursor-pointer ${notification.unread ? 'bg-blue-50/40 font-medium text-neutral-text' : 'text-neutral-subtle'}`}
                      >
                        {notification.unread && <span className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />}
                        <div className="flex-1">
                          <p className="leading-normal">{notification.text}</p>
                          {notification.lastSenderName && (
                            <p className="text-[11px] text-gray-400 mt-1">De: {notification.lastSenderName}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-gray-400">No tienes mensajes nuevos</p>
                      <p className="text-[11px] text-gray-300 mt-1">Cuando alguien te envíe un mensaje, aparecerá aquí</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Carrito de Compras */}
          <Link
            to="/carrito"
            className="relative flex items-center justify-center w-9 h-9 rounded-input text-neutral-subtle hover:text-neutral-text hover:bg-neutral-bg transition-colors"
            aria-label="Ver carrito de compras"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-brand-primary text-[10px] font-bold text-white flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Botón hamburguesa - Mobile/Tablet */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-input text-neutral-subtle hover:text-neutral-text hover:bg-neutral-bg transition-colors"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Avatar con Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setNotificationsOpen(false); // Cierra el de notificaciones por si acaso
              }}
              className="w-9 h-9 rounded-full overflow-hidden bg-blue-950 text-white font-bold text-sm hover:bg-blue-900 transition-colors border border-gray-100 flex items-center justify-center shadow-xs"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{username.charAt(0).toUpperCase()}</span>
              )}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">

                <div className="px-4 py-3 border-b border-neutral-border bg-neutral-bg/30">
                  <p className="text-xs font-bold text-neutral-text">Hola, {username}</p>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5 capitalize">Rol: {role === 'administrador' ? 'Administrador' : role === 'emprendedor' ? 'Emprendedor' : 'Visitante'}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-subtle
                               hover:bg-neutral-bg hover:text-neutral-text transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Mi Perfil
                  </Link>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-subtle
                             hover:bg-neutral-bg hover:text-neutral-text transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.37 2.37 1.724 1.724 0 001.065 2.572 1.724 1.724 0 010 3.351 1.724 1.724 0 00-1.066 2.573 1.724 1.724 0 01-2.37 2.37 1.724 1.724 0 00-2.572 1.065 1.724 1.724 0 01-3.351 0 1.724 1.724 0 00-2.573-1.066 1.724 1.724 0 01-2.37-2.37 1.724 1.724 0 00-1.065-2.572 1.724 1.724 0 010-3.351 1.724 1.724 0 001.066-2.573 1.724 1.724 0 012.37-2.37 1.724 1.724 0 002.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Configuración
                </Link>

                <div className="border-t border-neutral-border py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500
                               hover:bg-red-50/60 transition-all font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Panel de menú móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-2 bg-white border border-neutral-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex flex-col py-2">
            {links.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2.5 text-sm font-medium transition-all
                    ${active
                      ? 'bg-brand-primary text-white'
                      : 'text-neutral-subtle hover:text-neutral-text hover:bg-neutral-bg'
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;