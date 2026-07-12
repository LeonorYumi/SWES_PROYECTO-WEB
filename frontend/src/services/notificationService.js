import axios from 'axios';

const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000/api').replace(/\/$/, '');

/**
 * Servicio para gestionar notificaciones de chat
 * Obtiene el contador de mensajes no leídos dirigidos al usuario actual
 */

export const notificationService = {
  /**
   * Obtiene el contador de mensajes no leídos para un usuario específico
   * @param {string} userId - ID del usuario
   * @returns {Promise<{unreadCount: number, userId: string, timestamp: string}>}
   */
  async getUnreadCount(userId) {
    if (!userId) {
      return { unreadCount: 0, userId: null, timestamp: new Date().toISOString() };
    }

    try {
      const response = await axios.get(`${backendUrl}/chat/notifications/unread/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo contador de mensajes no leídos:', error);
      return { unreadCount: 0, userId, timestamp: new Date().toISOString() };
    }
  },

  /**
   * Marca mensajes como leídos en el servidor
   * El backend espera el ID del usuario que lee (userId) y el ID del usuario de quien se leen los mensajes (readFromId)
   * @param {string} roomId - ID de la sala de chat
   * @param {string} userId - ID del usuario
   * @param {string} readFromId - ID del otro usuario en la conversación
   * @returns {Promise<{success: boolean, markedCount: number, timestamp: string}>}
   */
  async markAsRead(roomId, userId, readFromId) {
    if (!roomId || !userId || !readFromId) {
      return { success: false, markedCount: 0, timestamp: new Date().toISOString() };
    }

    try {
      const response = await axios.put(`${backendUrl}/chat/${roomId}/read`, {
        userId,
        readFromId,
      });
      return response.data;
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
      return { success: false, markedCount: 0, timestamp: new Date().toISOString() };
    }
  },

  /**
   * Hook para polling automático de notificaciones
   * Se puede usar en componentes para actualizar el contador periódicamente
   * @param {string} userId - ID del usuario
   * @param {number} intervalMs - Intervalo de actualización en milisegundos (default: 5000)
   * @returns {Function} Retorna función para obtener unreadCount o null
   */
  createPollingInterval(userId, intervalMs = 5000) {
    if (!userId) return null;

    const pollFunction = () => {
      return this.getUnreadCount(userId);
    };

    return { pollFunction, intervalMs };
  }
};

export default notificationService;
