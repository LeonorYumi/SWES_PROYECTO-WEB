const express = require('express');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const cartsFilePath = path.join(__dirname, '..', 'data', 'carts.json');

const ensureStoreFile = () => {
  const dir = path.dirname(cartsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(cartsFilePath)) {
    fs.writeFileSync(cartsFilePath, '{}', 'utf8');
  }
};

const readCarts = () => {
  ensureStoreFile();
  try {
    return JSON.parse(fs.readFileSync(cartsFilePath, 'utf8'));
  } catch (error) {
    console.error('No se pudo leer el archivo de carritos:', error);
    return {};
  }
};

const writeCarts = (carts) => {
  ensureStoreFile();
  fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2), 'utf8');
};

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

router.get('/cart', verifyToken, (req, res) => {
  try {
    const carts = readCarts();
    res.json(carts[req.user.uid] || []);
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({ message: 'No se pudo cargar el carrito' });
  }
});

router.put('/cart', verifyToken, (req, res) => {
  try {
    const items = normalizeItems(req.body?.items);
    const carts = readCarts();
    carts[req.user.uid] = items;
    writeCarts(carts);
    res.json(items);
  } catch (error) {
    console.error('Error guardando carrito:', error);
    res.status(500).json({ message: 'No se pudo guardar el carrito' });
  }
});

router.delete('/cart', verifyToken, (req, res) => {
  try {
    const carts = readCarts();
    delete carts[req.user.uid];
    writeCarts(carts);
    res.json({ message: 'Carrito vaciado' });
  } catch (error) {
    console.error('Error vaciando carrito:', error);
    res.status(500).json({ message: 'No se pudo vaciar el carrito' });
  }
});

module.exports = router;
