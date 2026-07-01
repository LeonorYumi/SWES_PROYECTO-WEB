const crypto = require("crypto");
const { supabaseAdmin } = require("../supabase");

const hashToken = (token) => {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateRecordId = () => crypto.randomBytes(16).toString("hex");

const createOrReplaceActiveSession = async (userId, token, deviceInfo = null) => {
  if (!userId || !token) {
    return { error: new Error("Falta userId o token"), data: null, previousSessions: [] };
  }

  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  let previousSessions = [];

  try {
    const { data: invalidated, error: invalidationError } = await supabaseAdmin
      .from("user_sessions")
      .update({ active: false, invalidated_at: now, invalidation_reason: "Nueva sesión activa" })
      .eq("user_id", userId)
      .eq("active", true);

    if (invalidationError) {
      console.warn("sessionHelpers: error invalidando sesiones anteriores", invalidationError.message || invalidationError);
    } else {
      previousSessions = invalidated || [];
    }
  } catch (insertErr) {
    console.warn("sessionHelpers: excepción invalidando sesiones anteriores", insertErr.message || insertErr);
  }

  const { data, error } = await supabaseAdmin
    .from("user_sessions")
    .insert([
      {
        id: generateRecordId(),
        user_id: userId,
        token_hash: tokenHash,
        device_info: deviceInfo,
        active: true,
        created_at: now,
        last_seen_at: now,
      },
    ])
    .select()
    .maybeSingle();

  return { data, error, previousSessions };
};

const findActiveSessionByToken = async (token) => {
  const tokenHash = hashToken(token);
  if (!tokenHash) return null;

  const { data, error } = await supabaseAdmin
    .from("user_sessions")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.warn("sessionHelpers: error consultando sesión activa", error.message || error);
    return null;
  }

  return data || null;
};

const invalidateSessionByToken = async (token, reason = "Logout") => {
  const tokenHash = hashToken(token);
  if (!tokenHash) return { data: null, error: new Error("Token inválido") };

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("user_sessions")
    .update({ active: false, invalidated_at: now, invalidation_reason: reason })
    .eq("token_hash", tokenHash)
    .select()
    .maybeSingle();

  return { data, error };
};

module.exports = {
  createOrReplaceActiveSession,
  findActiveSessionByToken,
  invalidateSessionByToken,
};
