const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  uploadAvatar,
} = require("../controllers/user.controller");
const { verifyToken, authorizeRoles, authorizeSelfOrAdmin } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes"));
    }
    cb(null, true);
  },
});

// Crear usuario (solo administrador)
router.post("/users", verifyToken, authorizeRoles("administrador"), createUser);

// Obtener todos los usuarios (solo administrador)
router.get("/users", verifyToken, authorizeRoles("administrador"), getAllUsers);

// Obtener usuario por ID (solo el usuario mismo o administrador)
router.get("/users/:id", verifyToken, authorizeSelfOrAdmin, getUserById);

// Actualizar usuario (solo el usuario mismo o administrador)
router.put("/users/:id", verifyToken, authorizeSelfOrAdmin, updateUser);

// Eliminar usuario (solo administrador)
router.delete("/users/:id", verifyToken, authorizeRoles("administrador"), deleteUser);

// Subir avatar (solo el usuario mismo o administrador)
router.post("/users/:id/avatar", verifyToken, authorizeSelfOrAdmin, upload.single("file"), uploadAvatar);

module.exports = router;