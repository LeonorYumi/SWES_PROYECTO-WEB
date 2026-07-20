const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');

// Cliente de Supabase con permisos de administrador (SERVICE_ROLE_KEY),
// ya configurado en backend/supabase.js
const { supabaseAdmin: supabase } = require('../supabase');

const router = express.Router();

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .filter(Boolean)
    .map((item) => ({
      id: item.id,
      name: item.name || 'Producto',
      price: Number(item.price || 0),
      quantity: Math.max(1, Number(item.quantity || 1)),
      image: item.image || null,
      category: item.category || null,
      sellerName: item.sellerName || item.sellername || null,
    }));
};

// GET /cart - obtener el carrito del usuario autenticado
router.get('/cart', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('carts')
      .select('items')
      .eq('user_id', req.user.uid)
      .maybeSingle();

    if (error) throw error;

    // Si el usuario no tiene fila todavía, devolvemos carrito vacío
    res.json(data?.items || []);
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({ message: 'No se pudo cargar el carrito' });
  }
});

// PUT /cart - guardar/reemplazar el carrito del usuario autenticado
router.put('/cart', verifyToken, async (req, res) => {
  try {
    const items = normalizeItems(req.body?.items);

    const { error } = await supabase
      .from('carts')
      .upsert(
        {
          user_id: req.user.uid,
          items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    res.json(items);
  } catch (error) {
    console.error('Error guardando carrito:', error);
    res.status(500).json({ message: 'No se pudo guardar el carrito' });
  }
});

// DELETE /cart - vaciar el carrito del usuario autenticado
router.delete('/cart', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('carts')
      .upsert(
        {
          user_id: req.user.uid,
          items: [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    res.json({ message: 'Carrito vaciado' });
  } catch (error) {
    console.error('Error vaciando carrito:', error);
    res.status(500).json({ message: 'No se pudo vaciar el carrito' });
  }
});

module.exports = router;
