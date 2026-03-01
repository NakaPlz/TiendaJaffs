"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import toast from "react-hot-toast";

export type CartItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
};

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    totalAmount: number;
    totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Cargar carrito guardado al iniciar
    useEffect(() => {
        const savedCart = localStorage.getItem("jaffs_cart");
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error loading cart");
            }
        }
    }, []);

    // Guardar carrito al modificar
    useEffect(() => {
        localStorage.setItem("jaffs_cart", JSON.stringify(items));
    }, [items]);

    const addToCart = (product: any) => {
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
            toast.success("Cantidad actualizada");
            setItems(items.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            toast.success("¡Agregado al pedido!");
            setItems([...items, {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image_url: product.image_url
            }]);
        }
    };

    const removeFromCart = (productId: number) => {
        setItems((current) => current.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        setItems((current) =>
            current.map((item) => (item.id === productId ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
