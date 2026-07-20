const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const MESSAGES_FILE = path.join(__dirname, '../data/chat_messages.json');

// Crear carpeta si no existe
const dataDir = path.dirname(MESSAGES_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function ensureMessagesFile() {
  if (!fs.existsSync(MESSAGES_FILE)) {
    try {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify({}, null, 2), 'utf8');
      console.log('✅ Archivo de mensajes creado:', MESSAGES_FILE);
    } catch (error) {
      console.error('❌ Error creando archivo de mensajes:', error.message);
    }
  }
}

// Cargar mensajes del archivo al iniciar
let rooms = {};

const normalizeId = (value) => String(value ?? '').trim().toLowerCase();

function loadMessagesFromFile() {
  try {
    ensureMessagesFile();
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    const parsedData = JSON.parse(data || '{}');
    Object.keys(parsedData).forEach((roomId) => {
      parsedData[roomId] = parsedData[roomId].map((msg) => ({ ...msg, read: msg.read || false }));
    });
    rooms = parsedData;
    console.log('✅ Mensajes cargados del archivo - Total de salas:', Object.keys(rooms).length);
  } catch (error) {
    console.error('⚠️ Error cargando mensajes:', error.message);
    rooms = {};
    try {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify({}, null, 2), 'utf8');
      console.log('✅ Se inicializó archivo de mensajes vacío tras error');
    } catch (writeError) {
      console.error('❌ Error inicializando archivo de mensajes tras fallo:', writeError.message);
    }
  }
}

function saveMessagesToFile() {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(rooms, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error guardando mensajes:', error.message);
  }
}

function getRoomMessages(roomId) {
  const roomMessages = rooms[roomId] || [];
  return [...roomMessages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

const resolveRoomId = (req, roomIdParam) => {
  const roomIdFromPath = String(roomIdParam || '').trim();
  const roomIdFromBody = String(req.body?.roomId || '').trim();
  const roomIdFromQuery = String(req.query?.roomId || '').trim();
  return roomIdFromPath || roomIdFromBody || roomIdFromQuery;
};

function createMessageInRoom({ roomId, senderId, senderName, content, receiverId }) {
  console.log('\n' + '='.repeat(60));
  console.log('📨 NUEVO MENSAJE RECIBIDO');
  console.log('='.repeat(60));
  console.log({
    roomId,
    senderId,
    receiverId,
    senderName,
    contentLength: content?.length,
    timestamp: new Date().toISOString(),
  });

  const roomIdClean = String(roomId || '').trim();
  const messageText = String(content || '').trim();
  const senderIdClean = normalizeId(senderId);
  const receiverIdClean = normalizeId(receiverId);

  if (!roomIdClean) {
    console.log('❌ RECHAZADO: roomId inválido o faltante');
    return { error: 'INVALID_ROOM', message: 'El identificador de sala es obligatorio.' };
  }

  if (!messageText) {
    console.log('❌ RECHAZADO: contenido vacío');
    return { error: 'INVALID_CONTENT', message: 'El contenido del mensaje no puede estar vacío.' };
  }

  if (!senderIdClean || !receiverIdClean) {
    console.log('❌ RECHAZADO: senderId o receiverId faltantes', { senderIdClean, receiverIdClean });
    return { error: 'INVALID_PARTICIPANTS', message: 'El remitente y el destinatario son obligatorios.' };
  }

  if (senderIdClean === receiverIdClean) {
    console.log('❌ BLOQUEADO: Auto-mensaje detectado');
    console.log(`   Sender: ${senderIdClean}`);
    console.log(`   Receiver: ${receiverIdClean}`);
    return { error: 'SELF_MESSAGE_BLOCKED', message: 'No puedes enviarte mensajes a ti mismo.' };
  }

  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    room_id: roomId,
    sender_id: senderId,
    sender_name: senderName || 'Visitante',
    receiver_id: receiverId,
    content: content.trim(),
    created_at: new Date().toISOString(),
    read: false,
  };

  rooms[roomId] = rooms[roomId] || [];
  rooms[roomId].push(message);
  saveMessagesToFile();

  console.log('✅ GUARDADO EXITOSAMENTE');
  console.log(`   Message ID: ${message.id}`);
  console.log(`   Total en sala: ${rooms[roomId].length}`);
  console.log('='.repeat(60));

  return message;
}

function markMessagesAsRead(roomId, userId, readFromId) {
  const roomMessages = rooms[roomId] || [];
  let markedCount = 0;

  const userIdClean = normalizeId(userId);
  const readFromIdClean = normalizeId(readFromId);

  roomMessages.forEach((message) => {
    const receiverIdClean = normalizeId(message.receiver_id);
    const senderIdClean = normalizeId(message.sender_id);

    if (!message.read && receiverIdClean === userIdClean && senderIdClean === readFromIdClean) {
      message.read = true;
      markedCount += 1;
    }
  });

  if (markedCount > 0) saveMessagesToFile();
  return { success: true, markedCount };
}

function getUnreadCountForUser(userId) {
  const userIdClean = normalizeId(userId);
  let unreadCount = 0;

  Object.values(rooms).forEach((roomMessages) => {
    roomMessages.forEach((message) => {
      const receiverIdClean = normalizeId(message.receiver_id);
      if (receiverIdClean === userIdClean && !message.read) {
        unreadCount += 1;
      }
    });
  });

  return unreadCount;
}

loadMessagesFromFile();
console.log('✅ Chat routes initialized');

router.get('/notifications/unread/:userId', (req, res) => {
  const { userId } = req.params;
  const userIdClean = normalizeId(userId);
  const unreadRooms = [];

  Object.keys(rooms).forEach((roomId) => {
    const roomMessages = rooms[roomId] || [];
    const unreadInRoom = roomMessages.filter((msg) => normalizeId(msg.receiver_id) === userIdClean && !msg.read);
    if (unreadInRoom.length > 0) {
      const latest = unreadInRoom.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      unreadRooms.push({
        roomId,
        unreadCount: unreadInRoom.length,
        lastMessage: latest?.content || '',
        lastSenderId: latest?.sender_id || null,
        lastSenderName: latest?.sender_name || null,
        lastCreatedAt: latest?.created_at || null,
      });
    }
  });

  // ordenar por último mensaje más reciente
  unreadRooms.sort((a, b) => new Date(b.lastCreatedAt) - new Date(a.lastCreatedAt));

  res.json({
    userId,
    unreadCount: getUnreadCountForUser(userId),
    unreadRooms,
    timestamp: new Date().toISOString(),
  });
});

router.get('/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const roomMessages = getRoomMessages(roomId);

  console.log(`📥 GET /chat/${roomId}/messages - Retornando ${roomMessages.length} mensajes`);
  res.json(roomMessages);
});

router.post('/:roomId/messages', (req, res) => {
  const roomId = resolveRoomId(req, req.params.roomId);
  const message = createMessageInRoom({ roomId, ...req.body });

  if (!message || message.error) {
    const status = message?.error === 'SELF_MESSAGE_BLOCKED' ? 403 : ['INVALID_PARTICIPANTS', 'INVALID_ROOM', 'INVALID_CONTENT'].includes(message?.error) ? 400 : 500;
    console.log('❌ POST /chat/:roomId/messages falla:', { status, message });
    return res.status(status).json({
      message: message?.message || 'El mensaje no puede ser procesado.',
      error: message?.error || 'INVALID_MESSAGE',
    });
  }

  res.status(201).json(message);
});

router.put('/:roomId/read', (req, res) => {
  const { roomId } = req.params;
  const { userId, readFromId } = req.body;

  console.log(`🔵 PUT /chat/${roomId}/read - Marcando mensajes como leídos`);
  console.log(`   Usuario lector (yo): ${userId}`);
  console.log(`   Leyendo de (otro): ${readFromId}`);

  if (!userId || !readFromId) {
    return res.status(400).json({ message: 'Faltan IDs de usuario para marcar como leído.' });
  }

  res.json(markMessagesAsRead(roomId, userId, readFromId));
});

module.exports = router;
module.exports.getRoomMessages = getRoomMessages;
module.exports.createMessageInRoom = createMessageInRoom;
module.exports.markMessagesAsRead = markMessagesAsRead;
module.exports.getUnreadCountForUser = getUnreadCountForUser;