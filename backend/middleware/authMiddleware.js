const { supabaseService, supabaseAnon, supabaseAdmin } = require("../supabase");
const { findActiveSessionByToken } = require("../utils/sessionHelpers");
const { createOrUpdateUserProfile, normalizeEmail } = require("../utils/authHelpers");

const ADMIN_EMAILS = [
  "leonor.yumi@epn.edu.ec",
  "camila.bueno@epn.edu.ec",
  "concepcion.arequipa@epn.edu.ec",
].map((email) => email.toLowerCase());

const normalizeRole = (role) => (role ? String(role).toLowerCase().trim() : "");

const getRoleByEmail = (email) => {
  if (!email) return "visitante";
  const normalized = email.toLowerCase().trim();
  if (ADMIN_EMAILS.includes(normalized)) return "administrador";
  if (normalized.endsWith("@epn.edu.ec")) return "emprendedor";
  return "visitante";
};

const getUserFromToken = async (token) => {
  const clients = [supabaseService, supabaseAdmin, supabaseAnon].filter(Boolean);
  for (const client of clients) {
    if (client?.auth?.getUser && typeof client.auth.getUser === 'function') {
      const response = await client.auth.getUser(token);
      if (!response.error && response.data?.user) {
        return response.data.user;
      }
    }
  }
  return null;
};

const resolveAuthenticatedUser = async (token) => {
  const user = await getUserFromToken(token);
  if (!user) {
    throw new Error("Token inválido o expirado");
  }

  const activeSession = await findActiveSessionByToken(token);
  if (!activeSession || !activeSession.active) {
    throw new Error("Sesión inválida o caducada");
  }

  const normalizedEmail = normalizeEmail(user.email);
  let role = getRoleByEmail(normalizedEmail);
  let phone = "";
  let nombre = user.user_metadata?.full_name || user.user_metadata?.nombre || user.email || "";

  let profile = null;
  const { data: profileById, error: profileByIdError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileByIdError && profileByIdError.code !== "PGRST116") {
    console.error("Error leyendo perfil por id en middleware:", profileByIdError);
  }

  if (profileById) {
    profile = profileById;
  } else {
    const { data: profileByEmail, error: profileByEmailError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileByEmailError && profileByEmailError.code !== "PGRST116") {
      console.error("Error leyendo perfil por email en middleware:", profileByEmailError);
    }

    if (profileByEmail) {
      profile = profileByEmail;
    } else {
      const { error: insertError, profile: createdProfile } = await createOrUpdateUserProfile(user.id, normalizedEmail, nombre, role, "");
      if (insertError) {
        if (insertError.code === "42501") {
          console.warn("Advertencia RLS al crear perfil faltante en middleware:", insertError.message);
        } else {
          console.error("Error creando perfil faltante en middleware:", insertError);
        }
      }
      if (createdProfile) {
        profile = createdProfile;
      }
    }
  }

  if (profile) {
    role = normalizeRole(profile.role) || role;
    phone = profile.phone || "";
    nombre = profile.nombre || nombre;
  }

  if (getRoleByEmail(normalizedEmail) === "administrador") {
    role = "administrador";
  }

  return {
    uid: profile?.id || user.id,
    email: user.email,
    role: normalizeRole(role),
    phone,
    name: nombre,
  };
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔐 Verificando token...');
    console.log('   Método:', req.method);
    console.log('   Ruta:', req.path);
    console.log('   Header Authorization presente:', !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn('⚠️ Token no proporcionado o formato incorrecto');
      return res.status(401).json({ message: "Token no proporcionado o formato inválido" });
    }

    const token = authHeader.split(" ")[1];
    console.log('   Token recibido:', token.slice(0, 20) + '...');

    const authUser = await resolveAuthenticatedUser(token);

    console.log('   ✅ Usuario autenticado:', authUser.email);
    console.log('   Rol del usuario:', authUser.role);
    console.log('   UID resuelto:', authUser.uid);

    req.user = authUser;

    console.log('✅ Verificación exitosa');
    next();
  } catch (error) {
    console.error('❌ Error en verifyToken:', error?.message || error);
    return res.status(401).json({ message: "Token inválido o expirado", error: error?.message || String(error) });
  }
};

const authorizeRoles = (...roles) => {
  const normalizedExpectedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const userRole = normalizeRole(req.user.role);
    if (!normalizedExpectedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere rol: ${roles.join(" o ")}. Tu rol: ${req.user.role}`,
      });
    }

    next();
  };
};

const authorizeSelfOrAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const isAdmin = normalizeRole(req.user.role) === "administrador";
  const isSelf = req.user.uid === req.params.id;

  if (isAdmin) {
    return next();
  }

  if (isSelf) {
    return next();
  }

  // Si el ID del perfil no coincide con el UID de auth, validar por email
  try {
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", req.params.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error verificando ownership en authorizeSelfOrAdmin:", profileError);
      return res.status(500).json({ message: "Error interno verificando permisos" });
    }

    const normalizedProfileEmail = targetProfile?.email?.toLowerCase().trim();
    const normalizedTokenEmail = req.user.email?.toLowerCase().trim();
    if (normalizedProfileEmail && normalizedTokenEmail && normalizedProfileEmail === normalizedTokenEmail) {
      return next();
    }
  } catch (err) {
    console.error("Error en authorizeSelfOrAdmin:", err);
    return res.status(500).json({ message: "Error interno verificando permisos" });
  }

  return res.status(403).json({
    message: "Acceso denegado. Solo puedes acceder a tu propio recurso.",
  });
};

module.exports = { verifyToken, authorizeRoles, authorizeSelfOrAdmin, resolveAuthenticatedUser };
