import { useEffect, useState } from 'react';
import { getAll, updateResource, deleteResource, createResource } from '../services/crudService';
import { AlertTriangle, CheckCircle2, Trash2, Plus } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ mostrar: false, texto: '', tipo: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [crearNuevo, setCrearNuevo] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', password: '', nombre: '', role: 'visitante', phone: '' });
  const [nuevoErrors, setNuevoErrors] = useState({ email: '', password: '', nombre: '', phone: '' });
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, usuarioId: null });

  // Búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const mostrarToast = (texto, tipo = 'success') => {
    setToast({ mostrar: true, texto, tipo });
    setTimeout(() => setToast({ mostrar: false, texto: '', tipo: '' }), 3000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAll('users');
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      mostrarToast('Error cargando usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEditClick = (user) => {
    setSelectedUser({ ...user });
  };

  const handleDeleteClick = (userId) => {
    setModalEliminar({ abierto: true, usuarioId: userId });
  };

  const handleConfirmDelete = async () => {
    const id = modalEliminar.usuarioId;
    setModalEliminar({ abierto: false, usuarioId: null });
    try {
      await deleteResource('users', id);
      mostrarToast('Usuario eliminado correctamente', 'success');
      await loadUsers();
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo eliminar el usuario', 'error');
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    if (selectedUser.role !== 'emprendedor' && selectedUser.phone) {
      mostrarToast('Solo los emprendedores pueden tener teléfono.', 'error');
      return;
    }

    const updates = {
      nombre: selectedUser.nombre,
      role: selectedUser.role,
      phone: selectedUser.role === 'emprendedor' ? selectedUser.phone : '',
    };

    try {
      await updateResource('users', selectedUser.id, updates);
      mostrarToast('Usuario actualizado correctamente', 'success');
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo actualizar el usuario', 'error');
    }
  };

  const handleCreateUser = async () => {
    // Validaciones
    if (!nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.nombre) {
      mostrarToast('Email, contraseña y nombre son obligatorios', 'error');
      return;
    }

    if (nuevoUsuario.password.length < 6) {
      mostrarToast('La contraseña debe tener mínimo 6 caracteres', 'error');
      return;
    }

    if (nuevoUsuario.role === 'emprendedor' && !nuevoUsuario.phone) {
      mostrarToast('Los emprendedores deben registrar un teléfono', 'error');
      return;
    }

    try {
      const userData = {
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
        nombre: nuevoUsuario.nombre,
        role: nuevoUsuario.role,
      };

      if (nuevoUsuario.role === 'emprendedor') {
        userData.phone = nuevoUsuario.phone;
      }

      await createResource('users', userData);
      mostrarToast('Usuario creado correctamente', 'success');
      setCrearNuevo(false);
      setNuevoUsuario({ email: '', password: '', nombre: '', role: 'visitante', phone: '' });
      await loadUsers();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.mensaje || err.message || 'No se pudo crear el usuario';
      mostrarToast(errorMsg, 'error');
    }
  };

  // Validación en tiempo real para el modal de creación
  const validateNuevo = (field, value) => {
    const errors = { ...nuevoErrors };
    if (field === 'email') {
      const v = (value || nuevoUsuario.email || '').toLowerCase().trim();
      if (!v) errors.email = 'El email es obligatorio';
      else if (nuevoUsuario.role === 'emprendedor' && !v.endsWith('@epn.edu.ec')) errors.email = 'Emprendedores requieren correo @epn.edu.ec';
      else errors.email = '';
    }
    if (field === 'password') {
      const v = value || nuevoUsuario.password || '';
      if (!v) errors.password = 'La contraseña es obligatoria';
      else if (v.length < 6) errors.password = 'Mínimo 6 caracteres';
      else errors.password = '';
    }
    if (field === 'nombre') {
      const v = value || nuevoUsuario.nombre || '';
      errors.nombre = v ? '' : 'El nombre es obligatorio';
    }
    if (field === 'phone') {
      const v = value || nuevoUsuario.phone || '';
      if (nuevoUsuario.role === 'emprendedor') {
        errors.phone = v ? '' : 'El teléfono es obligatorio para emprendedores';
      } else {
        errors.phone = '';
      }
    }
    setNuevoErrors(errors);
  };

  const isCreateValid = () => {
    if (!nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.nombre) return false;
    if (nuevoUsuario.role === 'emprendedor' && !nuevoUsuario.phone) return false;
    if (Object.values(nuevoErrors).some((v) => v && v.length > 0)) return false;
    return true;
  };
  const validationMessage = Object.values(nuevoErrors).find((v) => v) || '';

  if (loading) return <div className="p-6">Cargando usuarios...</div>;

  const normalizedSearch = (searchTerm || '').toLowerCase().trim();
  const filtered = users.filter((u) => {
    if (!normalizedSearch) return true;
    return (
      (u.email || '').toLowerCase().includes(normalizedSearch) ||
      (u.nombre || '').toLowerCase().includes(normalizedSearch) ||
      (u.role || '').toLowerCase().includes(normalizedSearch)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {toast.mostrar && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border transition-all duration-300 ${toast.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {toast.tipo === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-semibold">{toast.texto}</p>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Usuarios</h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            placeholder="Buscar por email, nombre o rol"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full sm:w-80 rounded-xl border border-gray-200 px-4 py-2 text-sm"
          />
          <button
            onClick={() => { setSearchTerm(''); setPage(1); }}
            className="px-3 py-2 rounded-xl border bg-gray-50 text-sm"
          >Limpiar</button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCrearNuevo(true)}
            className="px-4 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear nuevo usuario
          </button>
        </div>
      </div>

      {/* TARJETAS - Mobile y tablet */}
      <div className="md:hidden flex flex-col gap-3">
        {paged.map((u) => {
          return (
            <div key={u.id} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-900 break-all">{u.email}</p>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <p>
                  <span className="text-gray-400">Nombre:</span>{' '}
                  <span className="text-gray-700">{u.nombre || '-'}</span>
                </p>
                <p>
                  <span className="text-gray-400">Rol:</span>{' '}
                  <span className="text-gray-700">{u.role || '-'}</span>
                </p>
                <p className="col-span-2">
                  <span className="text-gray-400">Teléfono:</span>{' '}
                  <span className="text-gray-700">{u.phone || '-'}</span>
                </p>
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => handleEditClick(u)}
                  className="flex-1 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(u.id)}
                  className="flex-1 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLA - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full min-w-[640px] table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-xs text-gray-500">Email</th>
              <th className="p-3 text-left text-xs text-gray-500">Nombre</th>
              <th className="p-3 text-left text-xs text-gray-500">Rol</th>
              <th className="p-3 text-left text-xs text-gray-500">Teléfono</th>
              <th className="p-3 text-left text-xs text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="p-3 text-sm">{u.email}</td>
                <td className="p-3 text-sm">{u.nombre || '-'}</td>
                <td className="p-3 text-sm">{u.role || '-'}</td>
                <td className="p-3 text-sm">{u.phone || '-'}</td>
                <td className="p-3 text-sm flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleEditClick(u)}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(u.id)}
                    className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Mostrando {Math.min(filtered.length, (currentPage-1)*pageSize+1)} - {Math.min(filtered.length, currentPage*pageSize)} de {filtered.length} usuarios</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p)=>Math.max(1,p-1))} className="px-3 py-1 rounded border">Anterior</button>
          <div className="text-sm px-3">{currentPage} / {totalPages}</div>
          <button onClick={() => setPage((p)=>Math.min(totalPages,p+1))} className="px-3 py-1 rounded border">Siguiente</button>
        </div>
      </div>

      {crearNuevo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Crear nuevo usuario</h3>
                <p className="text-sm text-gray-500">Completa los datos para crear un usuario.</p>
              </div>
              <button onClick={() => setCrearNuevo(false)} className="text-gray-400 hover:text-gray-600">Cerrar</button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={(e) => { const v = e.target.value; setNuevoUsuario((prev) => ({ ...prev, email: v })); validateNuevo('email', v); }}
                  placeholder="usuario@example.com"
                  className={`w-full rounded-xl border px-4 py-3 text-sm ${nuevoErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                />
                {nuevoErrors.email && <p className="mt-2 text-xs text-red-600">{nuevoErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contraseña</label>
                <input
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) => { const v = e.target.value; setNuevoUsuario((prev) => ({ ...prev, password: v })); validateNuevo('password', v); }}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full rounded-xl border px-4 py-3 text-sm ${nuevoErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                />
                {nuevoErrors.password && <p className="mt-2 text-xs text-red-600">{nuevoErrors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  value={nuevoUsuario.nombre}
                  onChange={(e) => { const v = e.target.value; setNuevoUsuario((prev) => ({ ...prev, nombre: v })); validateNuevo('nombre', v); }}
                  placeholder="Nombre completo"
                  className={`w-full rounded-xl border px-4 py-3 text-sm ${nuevoErrors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                />
                {nuevoErrors.nombre && <p className="mt-2 text-xs text-red-600">{nuevoErrors.nombre}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rol</label>
                <select
                  value={nuevoUsuario.role}
                  onChange={(e) => {
                    const val = e.target.value;
                    const emailVal = nuevoUsuario.email || '';
                    const phoneVal = nuevoUsuario.phone || '';
                    setNuevoUsuario((prev) => ({ ...prev, role: val }));
                    // Ajustar errores dependiendo del rol seleccionado
                    setNuevoErrors((prev) => {
                      const next = { ...prev };
                      if (val === 'emprendedor') {
                        if (!emailVal.toLowerCase().endsWith('@epn.edu.ec')) next.email = 'Emprendedores requieren correo @epn.edu.ec';
                        if (!phoneVal) next.phone = 'El teléfono es obligatorio para emprendedores';
                      } else {
                        // limpiar error de phone para no emprendedores
                        if (next.phone) next.phone = '';
                        // limpiar email error solo si era por dominio
                        if (next.email === 'Emprendedores requieren correo @epn.edu.ec') next.email = '';
                      }
                      return next;
                    });
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                >
                  <option value="visitante">visitante</option>
                  <option value="emprendedor">emprendedor</option>
                  <option value="administrador">administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={nuevoUsuario.phone}
                  onChange={(e) => { const v = e.target.value; setNuevoUsuario((prev) => ({ ...prev, phone: v })); validateNuevo('phone', v); }}
                  placeholder="Opcional (requerido para emprendedores)"
                  disabled={nuevoUsuario.role !== 'emprendedor'}
                  className={`w-full rounded-xl border px-4 py-3 text-sm ${nuevoErrors.phone ? 'border-red-300 bg-red-50' : nuevoUsuario.role !== 'emprendedor' ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-200 bg-white text-gray-900'}`}
                />
                {nuevoErrors.phone && <p className="mt-2 text-xs text-red-600">{nuevoErrors.phone}</p>}
                {nuevoUsuario.role === 'emprendedor' && !nuevoErrors.phone && (
                  <p className="mt-2 text-xs text-orange-600">El teléfono es obligatorio para emprendedores.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCrearNuevo(false);
                  setNuevoUsuario({ email: '', password: '', nombre: '', role: 'visitante', phone: '' });
                }}
                className="px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={!isCreateValid()}
                className={`px-4 py-3 rounded-xl text-white text-sm font-semibold transition ${isCreateValid() ? 'bg-brand-primary hover:bg-brand-hover' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Crear usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Editar usuario</h3>
                <p className="text-sm text-gray-500">Modifica nombre, rol o teléfono.</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">Cerrar</button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                <input type="text" value={selectedUser.email || ''} disabled className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  value={selectedUser.nombre || ''}
                  onChange={(e) => setSelectedUser((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rol</label>
                <select
                  value={selectedUser.role || 'visitante'}
                  onChange={(e) => setSelectedUser((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                >
                  <option value="visitante">visitante</option>
                  <option value="emprendedor">emprendedor</option>
                  <option value="administrador">administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser((prev) => ({ ...prev, phone: e.target.value }))}
                  disabled={selectedUser.role !== 'emprendedor'}
                  className={`w-full rounded-xl border px-4 py-3 text-sm ${selectedUser.role !== 'emprendedor' ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-200 bg-white text-gray-900'}`}
                />
                {selectedUser.role !== 'emprendedor' && (
                  <p className="mt-2 text-xs text-orange-600">Solo los emprendedores pueden registrar un teléfono.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                className="px-4 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEliminar.abierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-gray-100 text-center">
            <div className="flex justify-center">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-4">Confirmar eliminación</h3>
            <p className="text-sm text-gray-500 mt-2">¿Estás seguro de que quieres eliminar este usuario?</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setModalEliminar({ abierto: false, usuarioId: null })} className="px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}