import { useEffect, useState } from 'react';
import { getProfile, uploadAvatar, updateProfile } from '../services/profileService';

const isValidImageUrl = (url) => {
  try {
    const parsed = new URL(url.trim());
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

function ProfileEditor() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (typeof window === 'undefined') return;
      const userId = localStorage.getItem('uid');
      if (!userId) return;

      try {
        const profile = await getProfile(userId);
        setName(profile?.nombre || profile?.name || localStorage.getItem('name') || '');
        setEmail(profile?.email || localStorage.getItem('email') || '');
        setPhone(profile?.phone || localStorage.getItem('phone') || '');
        const avatar = profile?.avatar_url || localStorage.getItem('avatar_url') || '';
        setAvatarUrl(avatar);
        setAvatarUrlInput(avatar);
      } catch (err) {
        console.error('Error cargando perfil:', err);
        setName(localStorage.getItem('name') || '');
        setEmail(localStorage.getItem('email') || '');
        setPhone(localStorage.getItem('phone') || '');
        const avatar = localStorage.getItem('avatar_url') || '';
        setAvatarUrl(avatar);
        setAvatarUrlInput(avatar);
      }
    };

    loadProfile();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ message: 'Solo se permiten imágenes para el avatar.', type: 'error' });
      return;
    }
    setAvatarFile(file);
    setStatus({ message: '', type: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ message: '', type: '' });

    try {
      const userId = localStorage.getItem('uid');
      if (!userId) throw new Error('Usuario no autenticado');

      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile, userId);
        newAvatarUrl = uploadResult.url;
      } else if (avatarUrlInput.trim()) {
        if (!isValidImageUrl(avatarUrlInput)) {
          throw new Error('Ingresa una URL válida de imagen JPG, PNG, WEBP o GIF.');
        }
        newAvatarUrl = avatarUrlInput.trim();
      } else {
        newAvatarUrl = '';
      }

      const updates = {
        nombre: name,
        phone,
        avatar_url: newAvatarUrl,
      };

      await updateProfile(userId, updates);
      localStorage.setItem('name', name);
      localStorage.setItem('phone', phone);
      if (newAvatarUrl) {
        localStorage.setItem('avatar_url', newAvatarUrl);
      } else {
        localStorage.removeItem('avatar_url');
      }
      localStorage.setItem('name', name);
      localStorage.setItem('phone', phone);
      setAvatarUrl(newAvatarUrl);
      setAvatarUrlInput(newAvatarUrl);
      setAvatarFile(null);

      setStatus({ message: 'Perfil actualizado correctamente.', type: 'success' });
    } catch (error) {
      console.error('Error guardando perfil:', error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo actualizar el perfil.';
      setStatus({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Editar perfil</h2>
      <p className="text-sm text-gray-500 mb-6">Actualiza tu información de contacto y avatar.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600">Correo electrónico</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500 outline-none"
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5 space-y-4">
  <label className="block text-sm font-semibold text-gray-700">Avatar</label>
  <div className="flex items-center gap-4">
    <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-full bg-white border border-gray-200">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-gray-400 text-sm">?</div>
      )}
    </div>
    <label className="cursor-pointer rounded-full bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 inline-flex items-center gap-2 whitespace-nowrap">
      Seleccionar imagen
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </label>
  </div>
  <div className="space-y-1">
    <input
      type="url"
      value={avatarUrlInput}
      onChange={(e) => setAvatarUrlInput(e.target.value)}
      placeholder="O ingresa una URL de avatar"
      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
    />
    <p className="text-[11px] text-gray-400">Usa una URL válida o sube un archivo.</p>
  </div>
</div>

        {avatarFile && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Archivo seleccionado: {avatarFile.name}
          </div>
        )}

        {status.message && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </form>
    </div>
  );
}

export default ProfileEditor;
