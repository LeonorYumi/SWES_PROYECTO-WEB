const { supabaseAdmin } = require("../supabase");
const { normalizeEmail, validateUserInput, createOrUpdateUserProfile } = require("../utils/authHelpers");

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    let { data, error } = await supabaseAdmin.from("users").select("*").eq("id", id).single();

    if ((!data || error) && req.user?.email) {
      const normalizedEmail = req.user.email.toLowerCase().trim();
      const { data: profileByEmail, error: emailError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .single();
      if (emailError && emailError.code !== "PGRST116") {
        console.error("Error buscando usuario por email en getUserById:", emailError);
      }
      if (profileByEmail) {
        data = profileByEmail;
        error = null;
      }
    }

    if (error || !data) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(data);
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    res.status(500).json({ mensaje: "Error al obtener usuario" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ mensaje: "No hay datos para actualizar" });
    }

    let { data: existing, error: existingError } = await supabaseAdmin.from("users").select("id,email").eq("id", id).single();
    if (existingError && existingError.code !== "PGRST116") {
      console.error("Error buscando usuario antes de actualizar:", existingError);
      return res.status(500).json({ mensaje: "Error al buscar el usuario", detail: existingError.message || existingError });
    }

    if (!existing && req.user?.email) {
      const normalizedEmail = req.user.email.toLowerCase().trim();
      const { data: profileByEmail, error: emailError } = await supabaseAdmin
        .from("users")
        .select("id,email")
        .eq("email", normalizedEmail)
        .single();
      if (emailError && emailError.code !== "PGRST116") {
        console.error("Error buscando usuario por email antes de actualizar:", emailError);
      }
      existing = profileByEmail || null;
    }

    if (!existing) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const allowedFields = ["nombre", "role", "phone", "email", "avatar_url"];
    const updatePayload = Object.entries(req.body).reduce((acc, [key, value]) => {
      if (!allowedFields.includes(key)) return acc;
      if (value === null || value === undefined) return acc;
      if (key === "phone") {
        // No enviar teléfono vacío al actualizar. Si el rol no es emprendedor, omitimos el campo.
        if (!String(value).trim()) return acc;
        acc[key] = String(value).trim();
        return acc;
      }
      if (key === "role") {
        const normalizedRole = String(value).toLowerCase().trim();
        if (!normalizedRole) return acc;
        acc[key] = normalizedRole;
        return acc;
      }
      if (typeof value === "string") {
        acc[key] = value.trim();
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ mensaje: "No hay campos válidos para actualizar" });
    }

    const targetId = existing.id || id;
    const performUpdate = async (payload) => {
      return await supabaseAdmin
        .from("users")
        .update(payload)
        .eq("id", targetId)
        .select()
        .single();
    };

    let updateResult = await performUpdate(updatePayload);

    if (updateResult.error) {
      const err = updateResult.error;
      const invalidColumnMatch = (err.message || '').match(/column "([^"]+)" does not exist/i);
      if (invalidColumnMatch) {
        const invalidColumn = invalidColumnMatch[1];
        console.warn(`Campo no válido en users table: ${invalidColumn}. Se omitirá y se reintentará.`);
        delete updatePayload[invalidColumn];

        if (Object.keys(updatePayload).length === 0) {
          return res.status(200).json({ mensaje: `Perfil actualizado parcialmente. El campo "+invalidColumn+" no está disponible en la tabla.` });
        }

        updateResult = await performUpdate(updatePayload);
      }
    }

    if (updateResult.error) throw updateResult.error;
    res.json(updateResult.data);
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    const detail = err?.message || err?.msg || JSON.stringify(err);
    res.status(500).json({ mensaje: "Error al actualizar usuario", detail });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("id", id).single();
    if (!existing) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    // Intentar eliminar la cuenta de autenticación. Si no existe, continuar y eliminar sólo el perfil.
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) {
        // Si el error indica que el usuario no existe en auth, lo ignoramos.
        console.warn('Advertencia al eliminar auth user:', authError.message || authError);
      }
    } catch (ae) {
      console.warn('Excepción al eliminar auth user (continuando):', ae.message || ae);
    }

    const { error: deleteError } = await supabaseAdmin.from("users").delete().eq("id", id);
    if (deleteError) {
      console.error('Error eliminando perfil en tabla users:', deleteError);
      return res.status(500).json({ mensaje: 'No se pudo eliminar el perfil del usuario', detail: deleteError.message || deleteError });
    }

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, nombre, role, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = phone ? String(phone).replace(/\D/g, "") : "";

    const validation = validateUserInput(normalizedEmail, password, nombre);
    if (validation) return res.status(400).json({ mensaje: validation });

    // Enforce role-specific rules: emprendedor debe usar @epn.edu.ec y tener teléfono
    const selectedRole = (role || "visitante").toLowerCase();
    if (selectedRole === "emprendedor") {
      if (!normalizedEmail.endsWith("@epn.edu.ec")) {
        return res.status(400).json({ mensaje: "El correo debe ser institucional @epn.edu.ec para emprendedor" });
      }
      if (!normalizedPhone) {
        return res.status(400).json({ mensaje: "El teléfono es obligatorio para emprendedores" });
      }
    }

    const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("email", normalizedEmail).single();
    if (existingUser) return res.status(400).json({ mensaje: "El email ya está registrado" });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { nombre: nombre.trim(), role: selectedRole, phone: normalizedPhone || "" },
    });

    if (authError) return res.status(500).json({ mensaje: "Error al crear el usuario", detail: authError.message });

    const { error: profileErr, profile } = await createOrUpdateUserProfile(
      authData.user.id,
      normalizedEmail,
      nombre,
      selectedRole,
      normalizedPhone || ""
    );
    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ mensaje: "Error al crear el perfil del usuario" });
    }

    const { data: newUser } = await supabaseAdmin.from("users").select("*").eq("id", authData.user.id).single();
    res.status(201).json({ mensaje: "Usuario creado correctamente", usuario: newUser });
  } catch (err) {
    console.error("Error al crear usuario:", err);
    res.status(500).json({ mensaje: "Error al crear usuario" });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, createUser };
