const express = require("express");
const router = express.Router();
const { InferenceClient } = require("@huggingface/inference");
const { createClient } = require("@supabase/supabase-js");

const client = new InferenceClient(process.env.HF_TOKEN);


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role para poder leer todo sin RLS de usuario
);

// Trunca textos largos para no inflar el prompt
function truncar(texto, max = 140) {
  if (!texto) return "";
  return texto.length > max ? texto.slice(0, max) + "..." : texto;
}

// Trae los productos/emprendimientos publicados, opcionalmente filtrados por categoría
async function obtenerEmprendimientos(mode) {
  let query = supabase
    .from("products")
    .select("id, name, description, category, price, sellername")
    .order("created_at", { ascending: false })
    .limit(25);

  if (mode) {
    query = query.eq("category", mode);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error consultando products:", error);
    return [];
  }
  return data || [];
}

// Si el usuario tiene productos publicados, trae los suyos con más detalle
async function obtenerEmprendimientoPropio(ownerId) {
  if (!ownerId) return null;

  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, category, price, sellername")
    .eq("user_id", ownerId);

  if (error) {
    console.error("Error consultando productos propios:", error);
    return null;
  }
  return data && data.length ? data : null;
}

function formatearListaEmprendimientos(lista) {
  if (!lista.length) return "No hay emprendimientos/productos registrados en esta categoría por el momento.";
  return lista
    .map(
      (e) =>
        `- ${e.name} (${e.category}, $${e.price} - vendedor: ${e.sellername || "N/D"}): ${truncar(e.description)}`
    )
    .join("\n");
}

router.post("/", async (req, res) => {
  try {
    // message: texto del usuario
    // mode: categoría seleccionada en el chat (comida, tecnologia, ropa, tutorias) o null
    // role: rol real del usuario logueado (owner/admin/emprendedor/visitante)
    // userId: id del usuario logueado en Supabase, para buscar su propio emprendimiento
    const { message, mode, role, userId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "El mensaje es obligatorio."
      });
    }

    const esEmprendedor = role === "owner" || role === "admin" || role === "emprendedor";

    // 1. Directriz según rol
    let roleInstruction = "";
    if (esEmprendedor) {
      roleInstruction = "El usuario actual es un EMPRENDEDOR/ADMINISTRADOR. Tu objetivo principal es darle tips prácticos de cómo estructurar su negocio, optimizar sus costos, definir precios atractivos y captar clientes dentro del campus. Si tienes datos de su propio emprendimiento en el contexto, básate en ellos para dar recomendaciones concretas, no genéricas.";
    } else {
      roleInstruction = "El usuario actual es un VISITANTE/COMPRADOR. Tu objetivo es guiarle sobre qué buscar al adquirir productos, qué criterios de calidad evaluar en esta área, cómo apoyar al ecosistema politécnico, y ayudarle a encontrar emprendimientos existentes que se ajusten a lo que busca.";
    }

    // 2. Contexto técnico por categoría
    const CATEGORY_CONTEXTS = {
      comida: "Categoría activa en SWES: Comida y Snacks. Céntrate en manipulación higiénica, porciones, empaques prácticos, preventas y distribución ágil entre clases.",
      tecnologia: "Categoría activa en SWES: Tecnología / Software. Céntrate en la definición de Productos Mínimos Viables (MVP), validación de software rápido y modelos de monetización estudiantil.",
      ropa: "Categoría activa en SWES: Ropa y Accesorios. Céntrate en control de stock, marcas independientes universitarias, packaging creativo y marketing visual.",
      tutorias: "Categoría activa en SWES: Servicios Académicos / Tutorías. Céntrate en tarifas razonables por hora, estructuración de temarios de estudio eficientes y pedagogía empática."
    };
    const targetContext = CATEGORY_CONTEXTS[mode] || "Enfoque general de negocios universitarios.";

    // 3. Datos reales de Supabase: lista de emprendimientos activos + el propio si aplica
    const [listaEmprendimientos, emprendimientoPropio] = await Promise.all([
      obtenerEmprendimientos(mode),
      esEmprendedor ? obtenerEmprendimientoPropio(userId) : Promise.resolve(null)
    ]);

    const bloqueEmprendimientos = `[EMPRENDIMIENTOS ACTIVOS ACTUALMENTE EN SWES${mode ? " - categoría " + mode : ""}]:\n${formatearListaEmprendimientos(listaEmprendimientos)}`;

    const bloquePropio = emprendimientoPropio
      ? `\n\n[EMPRENDIMIENTO(S) DEL USUARIO ACTUAL]:\n${formatearListaEmprendimientos(emprendimientoPropio)}`
      : "";

    // 4. System prompt final
    const dynamicSystemPrompt = `Eres SWES Assistant, el asistente inteligente oficial del Sistema Web de Emprendimientos Estudiantiles de la EPN.

SWES es un marketplace universitario de la Escuela Politécnica Nacional donde los estudiantes pueden publicar, administrar y encontrar emprendimientos locales.

[CONTEXTO PERSONALIZADO DE LA CONSULTA]:
- ${roleInstruction}
- ${targetContext}

${bloqueEmprendimientos}${bloquePropio}

Usa la información anterior de emprendimientos reales cuando el usuario pregunte qué existe en SWES, pida recomendaciones de dónde comprar algo, o pida consejos sobre su propio negocio. No inventes emprendimientos que no estén en esta lista. Si no tienes datos suficientes para responder algo puntual, dilo con honestidad y sugiere revisar el catálogo en la plataforma.

[CÓMO FUNCIONA EL PROCESO DE COMPRA EN SWES]:
1. El usuario explora los emprendimientos disponibles en el Tablero o Dashboard.
2. Agrega los productos que desee al carrito de compras usando el botón correspondiente en cada publicación.
3. Entra al Carrito de compras, donde puede ajustar cantidades de cada producto con los botones + y -.
4. En el resumen del carrito ve el subtotal, el envío (gratis) y el total a pagar.
5. Puede pagar directamente dentro de la plataforma con PayPal o con tarjeta de débito/crédito.
6. Adicionalmente puede contactar al vendedor para coordinar detalles de entrega o pago.
7. Si el usuario pregunta "cómo comprar" o "cómo funciona la compra", explica estos pasos de forma breve y clara, en vez de solo listar emprendimientos.

REGLAS DE RESPUESTA DE CORTE ESTRICTO:
- Responde siempre en español.
- Sé breve y claro.
- Usa máximo 5 líneas salvo que el usuario pida explícitamente más detalles.
- No escribas explicaciones ni respuestas demasiado extensas.
- No uses Markdown con **asteriscos** bajo ninguna circunstancia.
- Cuando menciones varios elementos (emprendimientos, ideas, pasos), sepáralos SIEMPRE con un salto de línea real, uno por línea. Nunca los pongas en un solo párrafo separados por " - " o comas.
- Cada elemento de una lista debe ir en su propia línea, con este formato: "Nombre: descripción breve".
- Mantén un tono amigable, motivador y sumamente profesional.

Cuando el usuario pida una idea de negocio:
- Da máximo 3 ideas prácticas enfocadas en la comunidad politécnica.
- Explica brevemente cada una.`;

    const response = await client.chatCompletion({
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        { role: "system", content: dynamicSystemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 220,
      temperature: 0.5
    });

    res.json({
      reply: response.choices[0].message.content
    });

  } catch (error) {
    console.error("Error IA:", error);

    res.status(500).json({
      error: "No se pudo obtener respuesta de la IA."
    });
  }
});

module.exports = router;
