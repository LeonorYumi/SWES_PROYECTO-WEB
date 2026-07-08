import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Send, Smile } from 'lucide-react';

const EMOJI_OPTIONS = ['😀', '😂', '😍', '🥳', '🤩', '👍', '🔥', '💬', '🙌', '😎', '😊', '👏'];

function ChatRoom({ roomId, sellerName, ownerId }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const messagesEndRef = useRef(null);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('uid') : null;
  const userName = typeof window !== 'undefined'
    ? localStorage.getItem('name') || localStorage.getItem('email') || 'Visitante'
    : 'Visitante';

  const isProductOwner = ownerId && userId && ownerId === userId;
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000/api').replace(/\/$/, '');
  const chatApiBase = `${backendUrl}/chat/${roomId}/messages`;

  useEffect(() => {
    if (!roomId) return;

    const loadMessages = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(chatApiBase);
        setMessages(response.data || []);
        setSubscribed(true);
      } catch (err) {
        console.error('Error cargando mensajes:', err);
        setError('No se pudieron cargar los mensajes.');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chatApiBase]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, selectedThreadId]);

  const threads = useMemo(() => {
    const grouped = {};
    messages.forEach((message) => {
      const senderId = message.sender_id || 'anonymous';
      if (!grouped[senderId]) {
        grouped[senderId] = {
          senderId,
          senderName: message.sender_name || 'Visitante',
          messages: [],
        };
      }
      grouped[senderId].messages.push(message);
    });
    return Object.values(grouped).sort((a, b) => {
      const latestA = a.messages[a.messages.length - 1]?.created_at || '';
      const latestB = b.messages[b.messages.length - 1]?.created_at || '';
      return new Date(latestB) - new Date(latestA);
    });
  }, [messages]);

  const selectedThread = useMemo(() => {
    if (!selectedThreadId) return null;
    return threads.find((thread) => thread.senderId === selectedThreadId) || null;
  }, [selectedThreadId, threads]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) return;
    if (!roomId) return;

    try {
      const response = await axios.post(chatApiBase, {
        senderId: userId || 'anonymous',
        senderName: userName || 'Visitante',
        content: trimmed,
      });

      setMessages((prev) => [...prev, response.data]);
      setMessageText('');
      setError('');
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      setError('No se pudo enviar el mensaje.');
    }
  };

  const renderMessage = (message) => {
    const isOwn = message.sender_id && userId && message.sender_id === userId;
    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-normal shadow-sm ${isOwn ? 'bg-blue-900 text-white rounded-br-[4px]' : 'bg-gray-100 text-gray-900 rounded-bl-[4px]'}`}>
          <div className="flex items-center justify-between gap-2 mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
            <span>{isOwn ? 'Tú' : message.sender_name || sellerName || 'Emprendedor'}</span>
            <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="whitespace-pre-wrap break-words text-sm">{message.content}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
        <p className="text-sm font-semibold text-gray-900">Chat en vivo</p>
        <p className="text-xs text-gray-500">Conecta directamente con el {isProductOwner ? 'visitante' : 'emprendedor'} de este emprendimiento.</p>
        <p className="text-[10px] mt-1 text-gray-400">Estado: {subscribed ? 'Conectado' : 'Conectando...'}</p>
      </div>

      {!userId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
          <p className="text-sm text-gray-600">Inicia sesión para chatear con el emprendedor.</p>
          <p className="text-xs text-gray-400">Tu conversación se guardará en este emprendimiento.</p>
        </div>
      ) : (
        <>
          <div className="flex border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => {
                setActiveTab('chat');
                setSelectedThreadId(null);
              }}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${activeTab === 'chat' ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Conversación
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mensajes')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${activeTab === 'mensajes' ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mensajes
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
                {loading ? (
                  <p className="text-sm text-gray-500 text-center">Cargando mensajes...</p>
                ) : error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No existen mensajes aún. Sé el primero en escribir.</p>
                ) : (
                  messages.map(renderMessage)
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setEmojiOpen((open) => !open)}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:bg-slate-100"
                    aria-expanded={emojiOpen}
                    aria-label="Mostrar emojis"
                  >
                    <Smile className="h-4 w-4" />
                    Emojis
                  </button>
                  <p className="text-xs text-gray-500">Toca un emoji para agregarlo al mensaje.</p>
                </div>

                {emojiOpen && (
                  <div className="grid grid-cols-6 gap-2 rounded-3xl border border-gray-200 bg-slate-50 p-3 mb-3">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMessageText((current) => `${current}${emoji}`)}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl transition hover:bg-blue-50"
                        aria-label={`Agregar emoji ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <textarea
                      rows={3}
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder={isProductOwner ? 'Responde al visitante...' : 'Escribe tu mensaje...'}
                      className="min-h-[80px] w-full resize-none rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-900 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!messageText.trim()}
                    aria-label="Enviar mensaje"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col bg-slate-50">
              <div className="border-b border-gray-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-gray-900">Mensajes</p>
                <p className="text-xs text-gray-500">Se muestran los mensajes agrupados por remitente.</p>
              </div>
              {!loading && threads.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-gray-500">
                  No hay mensajes en este producto todavía.
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  {!selectedThread ? (
                    <div className="overflow-y-auto p-4 space-y-3">
                      {threads.map((thread) => {
                        const lastMessage = thread.messages[thread.messages.length - 1];
                        return (
                          <button
                            key={thread.senderId}
                            type="button"
                            onClick={() => setSelectedThreadId(thread.senderId)}
                            className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:border-blue-900 hover:bg-blue-50"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{thread.senderName || 'Visitante'}</p>
                                <p className="text-xs text-gray-500">{thread.messages.length} mensaje{thread.messages.length > 1 ? 's' : ''}</p>
                              </div>
                              <span className="text-[11px] text-gray-400">{new Date(lastMessage.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{lastMessage.content}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-full flex-col">
                      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Conversación con {selectedThread.senderName || 'Visitante'}</p>
                          <p className="text-xs text-gray-500">{selectedThread.messages.length} mensaje{selectedThread.messages.length > 1 ? 's' : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedThreadId(null)}
                          className="text-xs font-semibold text-blue-900 hover:text-blue-700"
                        >
                          Volver
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {selectedThread.messages.map(renderMessage)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ChatRoom;
