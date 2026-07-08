const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { invalidateSessionByToken, findActiveSessionByToken } = require("../utils/sessionHelpers");

router.post("/session/logout", verifyToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token no proporcionado" });
    const token = authHeader.split(" ")[1];
    const { data, error } = await invalidateSessionByToken(token, "Logout manual");
    if (error) {
      console.error("Error invalidando sesión:", error);
      return res.status(500).json({ message: "No se pudo cerrar la sesión" });
    }
    res.json({ message: "Sesión cerrada correctamente", session: data });
  } catch (err) {
    console.error("Error en /session/logout:", err);
    res.status(500).json({ message: "Error interno" });
  }
});

router.get("/session/active", verifyToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const session = await findActiveSessionByToken(token);
    res.json({ active: !!session, session });
  } catch (err) {
    console.error("Error en /session/active:", err);
    res.status(500).json({ message: "Error interno" });
  }
});

module.exports = router;
