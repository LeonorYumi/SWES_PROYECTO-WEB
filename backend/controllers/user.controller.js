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

    let { data: existing, error: existingError } = await supabaseAdmin.from("users").select("*").eq("id", id).single();
    if (existingError && existingError.code !== "PGRST116") {
      console.error("Error buscando usuario antes de actualizar:", existingError);
      return res.status(500).json({ mensaje: "Error al buscar el usuario", detail: existingError.message || existingError });
    }

    if (!existing && req.user?.email) {
      const normalizedEmail = req.user.email.toLowerCase().trim();
      const { data: profileByEmail, error: emailError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .single();
      if (emailError && emailError.code !== "PGRST116") {
        console.error("Error buscando usuario por email antes de actualizar:", emailError);
      }
      existing = profileByEmail || null;
    }

    if (!existing) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const supportsAvatarUrl = Object.prototype.hasOwnProperty.call(existing, "avatar_url");
    const allowedFields = ["nombre", "role", "phone", "email", "avatar_url"];
    const sanitizeValue = (key, value) => {
      if (value === null || value === undefined) return undefined;
      if (key === "phone") {
        const phoneValue = String(value).trim();
        return phoneValue || undefined;
      }
      if (key === "role") {
        const normalizedRole = String(value).toLowerCase().trim();
        return normalizedRole || undefined;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || undefined;
      }
      return value;
    };

    const updatePayload = Object.entries(req.body).reduce((acc, [key, value]) => {
      if (!allowedFields.includes(key)) return acc;
      if (key === "avatar_url" && !supportsAvatarUrl) return acc;
      const sanitized = sanitizeValue(key, value);
      if (sanitized === undefined) return acc;
      acc[key] = sanitized;
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

    const parseInvalidColumns = (err, payload) => {
      const invalidColumns = [];
      const message = err?.message || "";

      const regexes = [
        /column \"([^\"]+)\" does not exist/gi,
        /Could not find the '([^']+)' column of '([^']+)' in the schema cache/gi,
      ];

      regexes.forEach((regex) => {
        let match;
        while ((match = regex.exec(message)) !== null) {
          const column = match[1];
          if (column && Object.prototype.hasOwnProperty.call(payload, column)) {
            invalidColumns.push(column);
          }
        }
      });

      return [...new Set(invalidColumns)];
    };

    let updateResult = await performUpdate(updatePayload);

    if (updateResult.error) {
      console.warn("Error al actualizar usuario en Supabase:", JSON.stringify(updateResult.error, null, 2));
      console.warn("Payload enviado:", JSON.stringify(updatePayload, null, 2));

      const invalidColumns = parseInvalidColumns(updateResult.error, updatePayload);
      if (invalidColumns.length > 0) {
        invalidColumns.forEach((column) => {
          console.warn(`Campo no válido en users table: ${column}. Se omitirá y se reintentará.`);
          delete updatePayload[column];
        });

        if (Object.keys(updatePayload).length === 0) {
          return res.status(200).json({ mensaje: "Perfil actualizado parcialmente. Algunos campos no son compatibles con la tabla." });
        }

        updateResult = await performUpdate(updatePayload);
      } else if (updatePayload.avatar_url) {
        console.warn("No se pudo detectar el campo inválido, eliminando avatar_url y reintentando.");
        delete updatePayload.avatar_url;
        if (Object.keys(updatePayload).length === 0) {
          return res.status(200).json({ mensaje: "Perfil actualizado parcialmente. El avatar no se puede guardar porque la tabla no soporta ese campo." });
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
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) {
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

// NUEVA FUNCIÓN: subir avatar usando el Service Role (se salta el RLS de Storage)
const uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ mensaje: "No se envió ningún archivo" });
    }

    const safeName = file.originalname.replace(/\s+/g, "_");
    const filePath = `users/${id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error subiendo avatar a Supabase:", uploadError);
      return res.status(500).json({ mensaje: "Error al subir el avatar", detail: uploadError.message });
    }

    const { data: publicData } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);

    return res.json({
      url: publicData.publicUrl,
      path: filePath,
    });
  } catch (err) {
    console.error("Error al subir avatar:", err);
    res.status(500).json({ mensaje: "Error al subir el avatar", detail: err.message || String(err) });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, createUser, uploadAvatar };