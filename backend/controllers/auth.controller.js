const { supabaseAnon, supabaseService, supabaseAdmin } = require("../supabase");
const { sendEmail } = require("../utils/sendEmail");
const {
  getRoleByEmail,
  normalizePhone,
  normalizeEmail,
  validateUserInput,
  buildFrontendUrl,
  generateRecoveryCode,
  createPasswordResetRecord,
  getPasswordResetRecord,
  createOrUpdateUserProfile,
  getUserProfile,
} = require("../utils/authHelpers");
const { createOrReplaceActiveSession } = require("../utils/sessionHelpers");

const FRONTEND_VERIFY_URL = process.env.FRONTEND_VERIFY_URL || "http://localhost:5173/verify";
const FRONTEND_RESET_URL = process.env.FRONTEND_RESET_URL || "http://localhost:5173/reset-password";

const findAuthUserByEmail = async (email) => {
  try {
    let page = 1;
    while (page) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) return { user: null, error };
      const foundUser = (data?.users || []).find((u) => u?.email?.toLowerCase() === email);
      if (foundUser) return { user: foundUser, error: null };
      page = data?.nextPage || null;
    }
    return { user: null, error: null };
  } catch (err) {
    return { user: null, error: err };
  }
};

const register = async (req, res) => {
  try {
    const { email, password, nombre, role, phone } = req.body;
    const normalEmail = normalizeEmail(email);
    const normalPhone = normalizePhone(phone);
    const selectedRole = role || getRoleByEmail(normalEmail) || "visitante";

    const validation = validateUserInput(normalEmail, password, nombre);
    if (validation) return res.status(400).json({ message: validation });
    if (selectedRole === "emprendedor" && !normalEmail.endsWith("@epn.edu.ec")) {
      return res.status(400).json({ message: "El correo debe ser institucional @epn.edu.ec para emprendedor" });
    }
    if (selectedRole === "emprendedor" && !normalPhone) {
      return res.status(400).json({ message: "El teléfono es obligatorio para emprendedores" });
    }
    if (selectedRole === "administrador") {
      return res.status(403).json({ message: "No puedes registrar administradores" });
    }

    const createUserFn = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseService.auth.admin.createUser : supabaseAnon.auth.signUp;
    const userOpts = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? { email: normalEmail, password, email_confirm: true, user_metadata: { nombre, role: selectedRole, phone: normalPhone } }
      : { email: normalEmail, password, options: { data: { nombre, role: selectedRole, phone: normalPhone }, emailRedirectTo: buildFrontendUrl(FRONTEND_VERIFY_URL, "", req) } };

    const { data, error } = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createUserFn(userOpts) : await createUserFn(userOpts[0], userOpts[1]);
    if (error) return res.status(500).json({ message: "Error al registrar usuario", detail: error.message });

    const userId = data.user?.id;
    if (userId) {
      const { error: profileErr } = await createOrUpdateUserProfile(userId, normalEmail, nombre, selectedRole, normalPhone);
      if (profileErr) console.warn('Error creando perfil en register:', profileErr.message || profileErr);
    }

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (err) {
    console.error("Error en register:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalEmail = normalizeEmail(email);

    if (!normalEmail || !password) return res.status(400).json({ message: "Correo y contraseña requeridos" });

    const { data, error } = await supabaseService.auth.signInWithPassword({ email: normalEmail, password });
    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("email not confirmed")) return res.status(403).json({ message: "Correo no verificado" });
      if (msg.includes("invalid")) {
        const { data: profileCheck } = await supabaseService.from("users").select("id").eq("email", normalEmail).single();
        if (!profileCheck) return res.status(401).json({ message: "Usuario no registrado" });
        return res.status(401).json({ message: "Correo o contraseña incorrectos" });
      }
      return res.status(401).json({ message: error.message });
    }

    const userId = data.user?.id;
    let sessionMessage = null;
    if (userId && data.session?.access_token) {
      try {
        const deviceInfo = req.headers["user-agent"] || "desconocido";
        const { data: sessionData, error: sessionError, previousSessions } = await createOrReplaceActiveSession(
          userId,
          data.session.access_token,
          deviceInfo
        );
        if (sessionError) {
          console.warn("No se pudo crear sesión única:", sessionError.message || sessionError);
          sessionMessage = "Inicio de sesión exitoso, pero no se pudo registrar la sesión única.";
        } else if (previousSessions && previousSessions.length > 0) {
          sessionMessage = "Se ha cerrado la sesión anterior para este usuario.";
        }
      } catch (sessionErr) {
        console.warn("Error registrando sesión única:", sessionErr.message || sessionErr);
        sessionMessage = "Inicio de sesión exitoso, pero no se pudo completar la verificación de sesión única.";
      }
    }

    let role = getRoleByEmail(normalEmail);
    let phone = "";
    let nombre = data.user?.user_metadata?.nombre || "";

    if (userId) {
      const { data: profile } = await supabaseAdmin.from("users").select("*").eq("id", userId).single();
      if (profile) {
        role = getRoleByEmail(normalEmail) === "administrador" ? "administrador" : profile.role || role;
        phone = profile.phone || "";
        nombre = profile.nombre || nombre;
      } else {
        if (getRoleByEmail(normalEmail) === "administrador") role = "administrador";
        const { error: profileErr, profile: createdProfile } = await createOrUpdateUserProfile(userId, normalEmail, nombre || "", role, "");
        if (profileErr) console.warn('Error creando perfil en login:', profileErr.message || profileErr);
        if (createdProfile && createdProfile.id && createdProfile.id !== userId) {
          // If an existing profile was returned with a different id, prefer its role/phone/name
          role = createdProfile.role || role;
          phone = createdProfile.phone || phone;
          nombre = createdProfile.nombre || nombre;
        }
      }
    }

    res.json({
      message: "Bienvenido",
      token: data.session?.access_token,
      uid: data.user?.id,
      email: data.user?.email,
      role,
      phone,
      name: nombre,
      sessionMessage,
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const verifyAccount = async (req, res) => {
  try {
    const token = req.query.token || req.query.oobCode || req.params.token;
    if (!token) return res.status(400).json({ message: "Falta el token de verificación" });

    const { data, error } = await supabaseService.auth.verifyOtp({ type: "signup", token });
    if (error) return res.status(400).json({ message: error.message || "Token inválido o expirado" });

    res.json({ message: "Cuenta verificada correctamente", email: data.user?.email });
  } catch (err) {
    console.error("Error en verifyAccount:", err);
    res.status(500).json({ message: "Error al verificar la cuenta" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "El correo es obligatorio" });

    const normalEmail = normalizeEmail(email);
    const { user, error: findErr } = await findAuthUserByEmail(normalEmail);
    if (findErr) console.warn('forgotPassword: findAuthUserByEmail error', findErr);

    let previewUrl;
    let resetToken = null;

    if (user?.id) {
      // Ensure profile exists and capture profile id if created or preexisting
      let profile = null;
      try {
        const { error: profileErr, profile: profileRow } = await createOrUpdateUserProfile(user.id, normalEmail, user.user_metadata?.full_name || "", getRoleByEmail(normalEmail), "");
        if (profileErr) console.warn('forgotPassword: createOrUpdateUserProfile error', profileErr);
        profile = profileRow || null;
      } catch (pErr) {
        console.warn('forgotPassword: createOrUpdateUserProfile threw', pErr);
      }

      const token = generateRecoveryCode();
      resetToken = token;

      // Try insert with auth user id first. If it fails due to FK, try with profile id.
      let insertResult = await createPasswordResetRecord(user.id, normalEmail, token);
      if (insertResult?.error) {
        console.warn('forgotPassword: insert with auth id failed', insertResult.error?.message || insertResult.error);
        if (profile && profile.id) {
          insertResult = await createPasswordResetRecord(profile.id, normalEmail, token);
        }
      }

      if (insertResult && !insertResult.error) {
        console.log('Password reset record created', insertResult.data || '(no-data)');
        const emailBody = `<p>Token de recuperación:</p><h2 style="font-size:24px;letter-spacing:2px;">${token}</h2><p>Usa este token para restablecer tu contraseña en el formulario.</p>`;
        try {
          const result = await sendEmail({ to: normalEmail, subject: 'Token de recuperación', html: emailBody });
          previewUrl = result?.previewUrl;
        } catch (sendErr) {
          console.error('Error enviando correo:', sendErr);
        }
      } else {
        console.error('forgotPassword: no se pudo crear registro de recuperación', insertResult?.error || 'unknown');
      }
    }

    res.json({
      message: 'Si el correo existe, se ha enviado un token de recuperación a tu correo',
      method: 'token',
      previewUrl,
      resetToken,
    });
  } catch (err) {
    console.error('Error en forgotPassword:', err);
    res.status(500).json({ message: 'Error al solicitar recuperación de contraseña' });
  }
};

const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: 'Faltan campos obligatorios' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'La contraseña debe tener mínimo 6 caracteres' });

    const normalizedEmail = normalizeEmail(email);
    const trimmedCode = String(code || '').trim();
    const { data: resetEntry, error: resetError } = await getPasswordResetRecord(normalizedEmail, trimmedCode);
    if (resetError) {
      console.error('Error consultando código de recuperación:', resetError);
      return res.status(400).json({ message: 'Código inválido o caducado' });
    }
    if (!resetEntry) return res.status(400).json({ message: 'Código inválido o caducado' });

    // Resolve the Supabase Auth user id by email to ensure we update the right user
    const { user: authUser, error: findErr } = await findAuthUserByEmail(normalizedEmail);
    if (findErr) console.warn('resetPasswordWithCode: findAuthUserByEmail error', findErr);
    const authUserId = authUser?.id;
    if (!authUserId) {
      console.error('resetPasswordWithCode: auth user not found for email', normalizedEmail);
      return res.status(400).json({ message: 'Código inválido o caducado' });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, { password: newPassword });
    if (updateError) {
      console.error('resetPasswordWithCode: error updating auth user password', updateError);
      return res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }

    await supabaseAdmin.from('password_reset_codes').update({ used: true }).eq('id', resetEntry.id);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en resetPasswordWithCode:', err);
    res.status(500).json({ message: 'Error al restablecer contraseña' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token: bodyToken, newPassword } = req.body;
    const token = bodyToken || req.params.token || req.query.token || req.query.oobCode;
    if (!token || !newPassword || newPassword.length < 6) return res.status(400).json({ message: "Parámetros inválidos" });

    const { createClient } = require("@supabase/supabase-js");
    const isAccessToken = typeof token === "string" && token.split(".").length >= 2;

    if (isAccessToken) {
      const clientWithToken = createClient(process.env.SUPABASE_URL, token);
      const { data: userData, error: userError } = await clientWithToken.auth.getUser();
      if (userError || !userData?.user?.id) return res.status(400).json({ message: "Token inválido o expirado" });

      const { error: updateError } = process.env.SUPABASE_SERVICE_ROLE_KEY
        ? await supabaseService.auth.admin.updateUserById(userData.user.id, { password: newPassword })
        : await clientWithToken.auth.updateUser({ password: newPassword });
      if (updateError) return res.status(500).json({ message: updateError.message });
    } else {
      const { data, error } = await supabaseAnon.auth.verifyOtp({ type: "recovery", token });
      if (error || !data?.user?.id) return res.status(400).json({ message: "Token inválido o expirado" });

      const { error: updateError } = await supabaseService.auth.admin.updateUserById(data.user.id, { password: newPassword });
      if (updateError) return res.status(500).json({ message: updateError.message });
    }

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error en resetPassword:", err);
    res.status(500).json({ message: "Error al restablecer contraseña" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.uid;
    if (!userId || !newPassword || newPassword.length < 6) return res.status(400).json({ message: "Parámetros inválidos" });

    const { error } = await supabaseService.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return res.status(400).json({ message: error.message });

    res.json({ message: "Contraseña cambiada correctamente" });
  } catch (err) {
    console.error("Error en changePassword:", err);
    res.status(500).json({ message: "Error al cambiar la contraseña" });
  }
};

const googleSignIn = async (req, res) => {
  try {
    const accessToken = req.body.accessToken || req.body.idToken;
    if (!accessToken) return res.status(400).json({ message: "Falta token" });

    const { data: userData, error } = await supabaseService.auth.getUser(accessToken);
    if (error || !userData?.user) return res.status(401).json({ message: "Token inválido" });

    const user = userData.user;
    const normalEmail = normalizeEmail(user.email);
    let role = getRoleByEmail(normalEmail);
    let sessionMessage = null;

    const { data: profile } = await supabaseAdmin.from("users").select("*").eq("id", user.id).single();
    if (!profile) {
      if (getRoleByEmail(normalEmail) === "administrador") role = "administrador";
      const { error: profileErr, profile: createdProfile } = await createOrUpdateUserProfile(
        user.id,
        normalEmail,
        user.user_metadata?.full_name || "",
        role,
        ""
      );
      if (profileErr) console.warn('Error creando perfil en googleSignIn:', profileErr.message || profileErr);
      if (createdProfile && createdProfile.role) role = createdProfile.role;
    } else {
      role = getRoleByEmail(normalEmail) === "administrador" ? "administrador" : profile.role || role;
    }

    try {
      const deviceInfo = req.headers["user-agent"] || "desconocido";
      const { data: sessionData, error: sessionError, previousSessions } = await createOrReplaceActiveSession(
        user.id,
        accessToken,
        deviceInfo
      );
      if (sessionError) {
        console.warn("googleSignIn: no se pudo crear sesión única:", sessionError.message || sessionError);
        sessionMessage = "Sesión iniciada, pero no se pudo registrar la sesión única.";
      } else if (previousSessions && previousSessions.length > 0) {
        sessionMessage = "Se ha cerrado la sesión anterior para este usuario.";
      }
    } catch (sessionErr) {
      console.warn("googleSignIn: error registrando sesión única:", sessionErr.message || sessionErr);
      sessionMessage = "Sesión iniciada, pero no se pudo completar la verificación de sesión única.";
    }

    res.json({
      message: "Bienvenido",
      uid: user.id,
      email: normalEmail,
      role,
      name: user.user_metadata?.full_name || "",
      sessionMessage,
    });
  } catch (err) {
    console.error("Error en googleSignIn:", err);
    res.status(500).json({ message: "Error en Google Sign-In" });
  }
};

module.exports = { register, verifyAccount, forgotPassword, resetPassword, resetPasswordWithCode, changePassword, login, googleSignIn };
