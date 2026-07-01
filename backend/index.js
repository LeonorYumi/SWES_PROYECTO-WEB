const express = require("express");
const cors = require("cors");
const path = require("path");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const userRoutes = require("./routes/user.routes");
const protectedRoutes = require("./routes/protected.routes");
const debugRoutes = require("./routes/debug.routes");
const { sendEmail } = require("./utils/sendEmail");
const paypalRoutes = require('./routes/paypalRoutes');

const ADMIN_EMAILS = [
  "leonor.yumi@epn.edu.ec",
  "camila.bueno@epn.edu.ec",
  "concepcion.arequipa@epn.edu.ec",
].map((email) => email.toLowerCase());

const app = express();
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res) => res.send("API Supabase funcionando"));
app.get("/api", (req, res) => res.send("API Supabase funcionando"));
app.use("/api", debugRoutes);
app.use("/api", authRoutes);
app.use("/api", productRoutes);
app.use("/api", userRoutes);
app.use("/api", protectedRoutes);
app.use('/api/paypal', paypalRoutes);

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
    }

    const html = `
      <p><strong>De:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Asunto:</strong> ${subject || "Contacto desde sitio"}</p>
      <hr />
      <div>${message.replace(/\n/g, "<br/>")}</div>
    `;

    await sendEmail({
      to: ADMIN_EMAILS.join(","),
      subject: subject || `Mensaje desde SWES: ${name}`,
      html,
      replyTo: email,
    });

    res.json({ mensaje: "Mensaje enviado correctamente" });
  } catch (error) {
    console.error("Error enviando mensaje de contacto:", error);
    res.status(500).json({ mensaje: "Error al enviar mensaje" });
  }
});


module.exports = app;
