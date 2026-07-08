const express = require('express');
const router = express.Router();

const rooms = {};

router.get('/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const roomMessages = rooms[roomId] || [];
  roomMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json(roomMessages);
});

router.post('/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const { senderId, senderName, content } = req.body;

  if (!roomId || !content || !content.trim()) {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío.' });
  }

  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    room_id: roomId,
    sender_id: senderId || 'anonymous',
    sender_name: senderName || 'Visitante',
    content: content.trim(),
    created_at: new Date().toISOString(),
  };

  rooms[roomId] = rooms[roomId] || [];
  rooms[roomId].push(message);

  res.status(201).json(message);
});

module.exports = router;
