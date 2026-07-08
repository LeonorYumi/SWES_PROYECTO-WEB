const { supabaseService, supabaseAnon, supabaseAdmin } = require("../supabase");
const { findActiveSessionByToken } = require("../utils/sessionHelpers");

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

    const user = await getUserFromToken(token);
    if (!user) {
      console.error('❌ Token inválido o expirado');
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    const activeSession = await findActiveSessionByToken(token);
    if (!activeSession || !activeSession.active) {
      console.warn('Sesión no activa o invalidada para token');
      return res.status(401).json({ message: "Sesión inválida o caducada" });
    }

    console.log('   ✅ Usuario autenticado:', user.email);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    let role = "visitante";
    if (profile) {
      role = normalizeRole(profile.role) || role;
      if (getRoleByEmail(user.email?.toLowerCase().trim()) === "administrador") {
        role = "administrador";
      }
    } else {
      const normalizedEmail = user.email?.toLowerCase().trim();
      role = getRoleByEmail(normalizedEmail);

      const { error: insertError } = await supabaseAdmin.from("users").upsert({
        id: user.id,
        email: normalizedEmail,
        nombre: user.user_metadata?.full_name || user.email || "",
        role,
        phone: user.user_metadata?.phone || "",
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (insertError) {
        if (insertError.code === '42501') {
          console.warn("Advertencia RLS al crear perfil faltante en middleware:", insertError.message);
        } else {
          console.error("Error creando perfil faltante en middleware:", insertError);
        }
      }
    }

    console.log('   Rol del usuario:', role);

    req.user = {
      uid: user.id,
      email: user.email,
      role: normalizeRole(role),
    };

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error leyendo perfil en middleware:", profileError);
    }

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

module.exports = { verifyToken, authorizeRoles, authorizeSelfOrAdmin };
