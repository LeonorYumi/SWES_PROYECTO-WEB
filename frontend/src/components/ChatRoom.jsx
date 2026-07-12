import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { Send, Smile, ArrowLeft, AlertTriangle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

function ChatRoom({ roomId, sellerName, ownerId, initialThreadId = null }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  
  const chatContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const audioRef = useRef(null);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('uid') : null;
  const userName = typeof window !== 'undefined'
    ? localStorage.getItem('name') || localStorage.getItem('email') || 'Visitante'
    : 'Visitante';

  // Normalizamos IDs para comparaciones 100% seguras y sin espacios
  const currentUserIdClean = userId ? String(userId).trim().toLowerCase() : '';
  const currentOwnerIdClean = ownerId ? String(ownerId).trim().toLowerCase() : '';

  // LOG INICIAL PARA DEBUG
  useEffect(() => {
    console.log('🔵 ChatRoom INICIALIZADO:', {
      roomId,
      userId,
      currentUserIdClean,
      ownerId,
      currentOwnerIdClean,
      sellerName,
      isMatch: currentUserIdClean === currentOwnerIdClean
    });
  }, [roomId, userId, currentUserIdClean, ownerId, currentOwnerIdClean, sellerName]);

  // VALIDACIÓN CRÍTICA: ¿El usuario actual es el dueño del producto?
  const isProductOwner = useMemo(() => {
    if (!currentOwnerIdClean || !currentUserIdClean) return false;
    return currentOwnerIdClean === currentUserIdClean;
  }, [currentOwnerIdClean, currentUserIdClean]);

  // BLOQUEO DE SEGURIDAD ABSOLUTO: El emprendedor no puede chatear consigo mismo
  const isSelfChatting = useMemo(() => {
    if (!currentOwnerIdClean || !currentUserIdClean) return false;
    return isProductOwner && currentOwnerIdClean === currentUserIdClean && !selectedThreadId;
  }, [isProductOwner, currentOwnerIdClean, currentUserIdClean, selectedThreadId]);

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000/api').replace(/\/$/, '');
  const chatApiBase = `${backendUrl}/chat/${roomId}/messages`;

  // 1. Marcar mensajes como leídos en la Base de Datos (Indica al backend qué se leyó)
  const handleMarkAsRead = useCallback(async (targetThreadId) => {
    if (!roomId || !userId) return;
    try {
      // Si soy el dueño, el otro usuario es el cliente (targetThreadId).
      // Si soy un cliente, el otro usuario es el dueño (ownerId).
      const senderToMark = isProductOwner ? targetThreadId : ownerId;
      if (!senderToMark && isProductOwner) return;

      await axios.put(`${backendUrl}/chat/${roomId}/read`, {
        userId: userId,
        readFromId: senderToMark,
      });
    } catch (err) {
      // No es un error crítico si falla, solo loguear.
      console.error('Error al marcar mensajes como leídos en servidor:', err);
    }
  }, [roomId, userId, isProductOwner, ownerId, backendUrl]);

  // 2. Polling e Inyección Segura de Mensajes
  const loadMessages = useCallback(async (isFirstLoad = false) => {
    if (!roomId || !userId) {
      console.warn('⚠️ loadMessages cancelado: roomId o userId vacíos', { roomId, userId });
      return;
    }
    if (isFirstLoad) setLoading(true);
    
    try {
      console.log('📥 Obteniendo mensajes de:', chatApiBase);
      const response = await axios.get(chatApiBase);
      const rawMessages = response.data || [];
      
      console.log('📊 Mensajes recibidos del servidor:', {
        count: rawMessages.length,
        messages: rawMessages.map(m => ({
          id: m.id,
          sender_id: m.sender_id,
          receiver_id: m.receiver_id,
          content: m.content?.substring(0, 30) + '...',
          created_at: m.created_at
        }))
      });
      
      // FILTRADO ESTRICTO DE ENTRADA: Eliminamos del estado cualquier mensaje donde el emisor y receptor sean la misma persona
      const filteredMessages = rawMessages.filter(msg => {
        const s = String(msg.sender_id).trim().toLowerCase();
        const r = String(msg.receiver_id).trim().toLowerCase();
        const isSelfMessage = s === r;
        if (isSelfMessage) {
          console.warn('❌ Descartando auto-mensaje:', { s, r });
        }
        return !isSelfMessage;
      });

      console.log('✅ Mensajes después del filtrado:', filteredMessages.length);

      setMessages((prevMessages) => {
        const newMessages = filteredMessages.filter(
          (m) => !prevMessages.some((pm) => pm.id === m.id)
        );

        if (newMessages.length > 0) {
          const lastNewMessage = newMessages[newMessages.length - 1];
          const senderIdStr = String(lastNewMessage.sender_id).trim().toLowerCase();

          // Si el nuevo mensaje no es mío, reproduzco sonido y marco como leído si aplica.
          if (senderIdStr !== currentUserIdClean && audioRef.current) {
            console.log('🔔 Nuevo mensaje de otra persona, reproduciendo sonido.');
            audioRef.current.play().catch(() => {});

            // Determinar si el chat actual corresponde al del nuevo mensaje.
            const isChatActiveForNewMessage = isProductOwner
              ? String(selectedThreadId).trim().toLowerCase() === senderIdStr
              : true; // Para el cliente, cualquier mensaje del owner es relevante.

            // Si el chat está activo en pantalla, lo marcamos como leído.
            if (isChatActiveForNewMessage) {
              console.log('   Marcar como leído automáticamente porque el chat está activo.');
              handleMarkAsRead(isProductOwner ? selectedThreadId : null);
            }
          }
        }
        return filteredMessages;
      });

      setError('');
    } catch (err) {
      console.error('Error cargando mensajes:', err);
      setError('No se pudieron sincronizar los mensajes.');
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, [chatApiBase, roomId, userId, currentUserIdClean, isProductOwner, selectedThreadId, handleMarkAsRead]);

  // Control del intervalo de actualización continua
  useEffect(() => {
    loadMessages(true);
    const interval = setInterval(() => {
      loadMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadMessages]);

  // Monitores de lectura automatizada por cambios de foco
  useEffect(() => {
    if (selectedThreadId) handleMarkAsRead(selectedThreadId);
  }, [selectedThreadId, handleMarkAsRead]);

  useEffect(() => {
    if (!isProductOwner && messages.length > 0) handleMarkAsRead(null);
  }, [isProductOwner, messages.length, handleMarkAsRead]);

  // Si venimos con un hilo inicial (por notificación), lo seleccionamos al montar
  useEffect(() => {
    if (initialThreadId) {
      setSelectedThreadId(initialThreadId);
    }
  }, [initialThreadId]);

  // Mantener scroll abajo
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, selectedThreadId]);

  // Cierre de ventana emergente de emojis
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setEmojiOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. AGRUPADOR EXCLUSIVO DE CLIENTES REALES (No incluye al Dueño) - CORREGIDO
  const threads = useMemo(() => {
    console.log('🧵 Recalculando threads - isProductOwner:', isProductOwner);
    if (!isProductOwner) return [];

    const grouped = {};

    messages.forEach((message) => {
      const senderId = String(message.sender_id).trim().toLowerCase();
      const receiverId = String(message.receiver_id).trim().toLowerCase();

      //  REGLA 1: Ignorar cualquier mensaje de una persona a sí misma.
      if (senderId === receiverId) {
        return;
      }

      //  REGLA 2: El dueño del producto debe estar en la conversación.
      const ownerInvolved = senderId === currentOwnerIdClean || receiverId === currentOwnerIdClean;
      if (!ownerInvolved) {
        return;
      }

      //  REGLA 3: El ID del hilo es siempre el ID del *otro* usuario (el cliente).
      const threadId = senderId === currentOwnerIdClean ? receiverId : senderId;

      if (!grouped[threadId]) {
        grouped[threadId] = {
          senderId: threadId, // El ID real del cliente
          senderName: 'Cliente', // Nombre por defecto
          // ✅ NUEVO: Contador de mensajes no leídos por hilo
          unreadCount: 0,
          messages: [],
        };
      }

      // Si el mensaje viene del cliente, usamos su nombre para el hilo.
      if (senderId === threadId && message.sender_name) {
        grouped[threadId].senderName = message.sender_name;
      }

      // ✅ NUEVO: Contar mensajes no leídos que el cliente envió al dueño
      if (senderId === threadId && receiverId === currentOwnerIdClean && !message.read) {
        grouped[threadId].unreadCount++;
      }

      grouped[threadId].messages.push(message);
    });

    const result = Object.values(grouped).sort((a, b) => {
      const latestA = a.messages[a.messages.length - 1]?.created_at || '';
      const latestB = b.messages[b.messages.length - 1]?.created_at || '';
      return new Date(latestB) - new Date(latestA);
    });

    console.log('✅ Threads recalculados y filtrados:', result.length);
    return result;
  }, [messages, isProductOwner, currentOwnerIdClean]);

  // Conversaciones filtradas para la vista del Cliente Común
  const clientMessages = useMemo(() => {
    console.log('💬 Recalculando clientMessages - isProductOwner:', isProductOwner);
    
    if (isProductOwner) return [];

    const filtered = messages.filter(m => {
      const s = String(m.sender_id).trim().toLowerCase();
      const r = String(m.receiver_id).trim().toLowerCase();

      // ✅ Mostrar si soy el sender O si soy el receiver
      const iAmInvolved = s === currentUserIdClean || r === currentUserIdClean;
      
      if (!iAmInvolved) {
        console.log('  ❌ Ignorado en clientMessages: yo no estoy', {
          sender: s,
          receiver: r,
          meId: currentUserIdClean
        });
      }

      return iAmInvolved;
    });

    console.log('✅ ClientMessages filtrados:', filtered.length, 'de', messages.length);
    return filtered;
  }, [messages, isProductOwner, currentUserIdClean]);

  const selectedThread = useMemo(() => {
    if (!selectedThreadId) return null;
    return threads.find((t) => String(t.senderId).trim().toLowerCase() === String(selectedThreadId).trim().toLowerCase()) || null;
  }, [selectedThreadId, threads]);

  const handleSendMessage = async (event) => {
    if (event) event.preventDefault();
    const trimmed = messageText.trim();

    if (!trimmed || !roomId) return;

    if (isProductOwner && !selectedThreadId) {
      alert('Por favor selecciona una conversación activa de la lista primero.');
      return;
    }

    const receiverId = isProductOwner ? selectedThreadId : ownerId;

    // ✅ VALIDACIÓN ESTRICTA DE SEGURIDAD: Bloquear cualquier intento de auto-envío (doble validación)
    const userIdClean = String(userId).trim().toLowerCase();
    const receiverIdClean = String(receiverId).trim().toLowerCase();

    console.log('💬 Intentando enviar mensaje:', {
      userIdClean,
      receiverIdClean,
      isProductOwner,
      selectedThreadId,
      roomId
    });

    if (!userIdClean || !receiverIdClean) {
      console.error('❌ Error: IDs no disponibles para enviar mensaje');
      alert('Error: No se pudo identificar al usuario. Por favor recarga la página.');
      return;
    }

    if (userIdClean === receiverIdClean) {
      console.error('❌ BLOQUEADO EN FRONTEND: Intento de auto-envío detectado', {
        userId: userIdClean,
        receiverId: receiverIdClean
      });
      alert('❌ No puedes enviarte mensajes a ti mismo. Esta acción está bloqueada por seguridad.');
      return;
    }

    try {
      console.log('📤 Enviando POST a:', chatApiBase, {
        senderId: userId,
        receiverId,
        contentLength: trimmed.length
      });

      const response = await axios.post(chatApiBase, {
        senderId: userId || 'anonymous',
        senderName: userName || 'Visitante',
        content: trimmed,
        receiverId,
      });

      console.log('✅ Respuesta del servidor:', response.status, response.data);

      // ✅ Validar respuesta del servidor
      if (response.status === 403) {
        console.error('❌ BLOQUEADO POR SERVIDOR: Intento de auto-envío rechazado');
        alert('❌ El servidor rechazó el mensaje: No puedes enviarte mensajes a ti mismo.');
        return;
      }

      setMessages((prev) => [...prev, response.data]);
      setMessageText('');
      console.log('✅ Mensaje agregado al estado y campo limpiado');
    } catch (err) {
      console.error('❌ Error enviando mensaje:', {
        status: err.response?.status,
        errorCode: err.response?.data?.error,
        message: err.response?.data?.message,
        fullError: err
      });

      if (err.response?.status === 403) {
        alert('❌ El servidor rechazó el mensaje: ' + (err.response.data.message || 'No puedes enviarte mensajes a ti mismo.'));
      } else {
        alert('Error al enviar el mensaje. Intenta de nuevo.');
      }
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="flex h-full flex-col bg-white relative">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav" preload="auto" />

      <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
        <p className="text-sm font-semibold text-gray-900">Bandeja de Mensajes</p>
        <p className="text-xs text-gray-500">
          {isProductOwner ? 'Gestiona los chats de tus clientes interesados.' : `Chatea directamente con ${sellerName || 'el emprendedor'}.`}
        </p> 
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {!userId ? (
        <div className="flex flex-1 flex-col items-center justify-center p-5 text-center">
          <p className="text-sm text-gray-600">Inicia sesión para chatear.</p>
        </div>
      ) : isProductOwner && threads.length === 0 ? (
        // Pantalla de bloqueo e información si eres el dueño y nadie te ha escrito sobre este artículo
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50">
          <div className="bg-blue-50 text-blue-900 p-4 rounded-full mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-gray-800">Esta es tu publicación</p>
          <p className="text-xs text-gray-500 max-w-xs mt-1">
            Tú eres el vendedor de este producto. Cuando un cliente te envíe un mensaje, aparecerá listado en este panel de control inmediatamente.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* ✅ VISTA #1: BANDEJA DE ENTRADA DEL EMPRENDEDOR (si no hay un chat seleccionado) */}
          {isProductOwner && !selectedThreadId && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Clientes Interesados</p>
              {threads.length > 0 ? (
                threads.map((thread) => {
                  const lastMessage = thread.messages[thread.messages.length - 1];
                  return (
                    <button
                      key={thread.senderId}
                      type="button"
                      onClick={() => setSelectedThreadId(thread.senderId)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:border-blue-900 hover:bg-blue-50/50 flex flex-col gap-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          {thread.senderName}
                          {thread.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-blue-500" title={`${thread.unreadCount} mensajes no leídos`}></span>}
                        </p>
                        <span className="text-[10px] text-gray-400">{new Date(lastMessage.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-1">{lastMessage.content}</p>
                    </button>
                  );
                })
              ) : (
                <p className="text-center text-sm text-gray-500 py-10">Aún no hay conversaciones.</p>
              )}
            </div>
          )}

          {/* ✅ VISTA #2: CHAT ACTIVO (para clientes, o para emprendedores que seleccionaron un hilo) */}
          {(!isProductOwner || selectedThreadId) && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {isProductOwner && selectedThread && (
                <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
                  <button type="button" onClick={() => setSelectedThreadId(null)} className="p-1 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <p className="text-xs font-bold text-gray-800">Conversación con: {selectedThread.senderName}</p>
                </div>
              )}

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500 text-center">Sincronizando chat...</p>
                ) : (isProductOwner ? selectedThread?.messages : clientMessages)?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-5">No hay mensajes históricos en este chat.</p>
                ) : (
                  (isProductOwner ? selectedThread.messages : clientMessages).map((message) => {
                    const isOwn = String(message.sender_id).trim().toLowerCase() === currentUserIdClean;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${isOwn ? 'bg-blue-900 text-white rounded-br-[4px]' : 'bg-gray-100 text-gray-900 rounded-bl-[4px]'}`}>
                          <div className="flex items-center justify-between gap-2 mb-1 text-[10px] uppercase text-slate-400">
                            <span>{isOwn ? 'Tú' : message.sender_name || 'Cliente'}</span>
                          </div>
                          <div className="whitespace-pre-wrap break-words text-sm">{message.content}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-gray-100 bg-white px-4 py-3 mt-auto relative flex items-center gap-2">
                {emojiOpen && (
                  <div ref={emojiPickerRef} className="absolute bottom-[65px] left-4 z-50 shadow-xl rounded-2xl overflow-hidden">
                    <EmojiPicker onEmojiClick={handleEmojiClick} width={280} height={320} previewConfig={{ showPreview: false }} skinTonesDisabled />
                  </div>
                )}
                <button type="button" onClick={() => setEmojiOpen(!emojiOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                  <Smile className="h-5 w-5" />
                </button>
                <textarea
                  rows={1}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                />
                <button type="submit" disabled={!messageText.trim()} className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-900 text-white disabled:opacity-50 shrink-0">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatRoom;