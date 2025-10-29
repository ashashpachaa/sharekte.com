import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  companyNumber: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on mount
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addItem = (item: CartItem) => {
    setItems((prevItems) => {
      // Prevent duplicates
      const exists = prevItems.some((i) => i.id === item.id);
      if (exists) {
        return prevItems;
      }
      const newItems = [...prevItems, item];
      localStorage.setItem("cart", JSON.stringify(newItems));
      return newItems;
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((i) => i.id !== id);
      localStorage.setItem("cart", JSON.stringify(newItems));
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
