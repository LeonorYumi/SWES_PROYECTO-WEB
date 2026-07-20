import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('uid') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    let cancelado = false; // guard: evita que una respuesta vieja pise cambios posteriores

    const loadCart = async () => {
      if (!userId || !token) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api'}/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('No se pudo cargar el carrito');
        }

        const data = await res.json();
        if (!cancelado) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('No se pudo cargar el carrito:', error);
        if (!cancelado) setItems([]);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    loadCart();

    return () => {
      cancelado = true;
    };
  }, [userId, token]);

  const syncCart = async (nextItems) => {
    if (!token) {
      setItems(nextItems);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api'}/cart`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: nextItems }),
      });

      if (!res.ok) {
        throw new Error('No se pudo sincronizar el carrito');
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : nextItems);
    } catch (error) {
      console.error('Error sincronizando el carrito:', error);
      setItems(nextItems);
    }
  };

  const addItem = (product) => {
    const nextItems = (() => {
      const existing = items.find((item) => item.id === product.id);

      if (existing) {
        return items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...items,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          image: product.image,
          quantity: 1,
          category: product.category,
          sellerName: product.sellerName || product.sellername,
        },
      ];
    })();

    setItems(nextItems); // actualiza el estado local de inmediato (feedback instantáneo)
    syncCart(nextItems);
  };

  const removeItem = (id) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    syncCart(nextItems);
  };

  const updateQuantity = (id, quantity) => {
    const nextItems = (() => {
      if (quantity <= 0) {
        return items.filter((item) => item.id !== id);
      }

      return items.map((item) => (item.id === id ? { ...item, quantity } : item));
    })();

    setItems(nextItems);
    syncCart(nextItems);
  };

  const clearCart = async () => {
    if (!token) {
      setItems([]);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api'}/cart`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('No se pudo vaciar el carrito');
      }

      setItems([]);
    } catch (error) {
      console.error('Error vaciando carrito:', error);
      setItems([]);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }

  return context;
}
